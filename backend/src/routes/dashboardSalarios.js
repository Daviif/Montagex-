const express = require('express');
const router = express.Router();
const { models } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/v1/dashboard/salarios
 * 
 * Retorna cálculo de salários dos montadores baseado nos serviços realizados
 * Query params:
 *  - data_inicio: Data inicial (YYYY-MM-DD)
 *  - data_fim: Data final (YYYY-MM-DD)
 *  - usuario_id: Filtrar por montador específico
 */
router.get('/', async (req, res) => {
  try {
    const { data_inicio, data_fim, usuario_id } = req.query;
    
    // Definir período padrão (mês atual se não especificado)
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    const dataInicio = data_inicio ? new Date(data_inicio) : inicioMes;
    const dataFim = data_fim ? new Date(data_fim) : fimMes;
    
    // Buscar configurações de salário
    const configFormula = await models.Configuracao.findOne({
      where: { chave: 'salario_formula' }
    });
    
    const configBase = await models.Configuracao.findOne({
      where: { chave: 'salario_base_padrao' }
    });
    
    const formula = configFormula?.valor || 'valor_montagem';
    const salarioBase = parseFloat(configBase?.valor || 0);
    
    // Buscar todos os montadores
    const whereUsuario = usuario_id ? { id: usuario_id } : { tipo: 'montador', ativo: true };
    
    const montadores = await models.Usuario.findAll({
      where: whereUsuario,
      attributes: ['id', 'nome']
    });
    
    const resultado = {
      periodo: {
        inicio: dataInicio.toISOString().split('T')[0],
        fim: dataFim.toISOString().split('T')[0]
      },
      formula_atual: formula,
      montadores: [],
      totais: {
        total_montadores: 0,
        total_servicos: 0,
        total_valor_montagens: 0,
        total_salarios: 0
      }
    };
    
    const servicosPeriodo = await models.Servico.findAll({
      where: {
        data_servico: {
          [Op.between]: [dataInicio, dataFim]
        },
        status: 'concluido'
      },
      include: [{
        model: models.Loja,
        attributes: ['id', 'usa_porcentagem', 'porcentagem_repasse', 'nome_fantasia', 'razao_social']
      }],
      attributes: ['id', 'codigo_servico', 'data_servico', 'valor_total', 'valor_repasse_montagem', 'tipo_cliente', 'loja_id', 'cliente_particular_id']
    });

    const servicoById = servicosPeriodo.reduce((acc, servico) => {
      acc[servico.id] = servico;
      return acc;
    }, {});

    const servicoIds = servicosPeriodo.map((servico) => servico.id);
    const servicosMontadoresPeriodo = servicoIds.length > 0
      ? await models.ServicoMontador.findAll({
          where: {
            servico_id: { [Op.in]: servicoIds }
          },
          attributes: ['id', 'servico_id', 'usuario_id', 'valor_atribuido', 'papel', 'percentual_divisao']
        })
      : [];

    const servicoProdutosPeriodo = servicoIds.length > 0
      ? await models.ServicoProduto.findAll({
          where: {
            servico_id: { [Op.in]: servicoIds }
          },
          attributes: ['servico_id', 'quantidade', 'valor_unitario', 'valor_total']
        })
      : [];

    const totalProdutosPorServico = servicoProdutosPeriodo.reduce((acc, sp) => {
      const totalItem = sp.valor_total != null
        ? Number(sp.valor_total)
        : Number(sp.quantidade || 0) * Number(sp.valor_unitario || 0);
      acc[sp.servico_id] = (acc[sp.servico_id] || 0) + (Number.isNaN(totalItem) ? 0 : totalItem);
      return acc;
    }, {});

    const montadoresPorServico = servicosMontadoresPeriodo.reduce((acc, sm) => {
      if (!sm.usuario_id) return acc;
      acc[sm.servico_id] = (acc[sm.servico_id] || 0) + 1;
      return acc;
    }, {});

    const getValorCheio = (servico) => {
      const valorTotal = Number(servico.valor_total || 0);
      if (valorTotal > 0) return valorTotal;

      const valorRepasse = Number(servico.valor_repasse_montagem || 0);
      if (valorRepasse > 0) return valorRepasse;

      const totalProdutos = Number(totalProdutosPorServico[servico.id] || 0);
      return totalProdutos;
    };

    const calcularValorAtribuido = (sm) => {
      const servico = servicoById[sm.servico_id];
      if (!servico) return 0;

      // SEMPRE recalcular baseado no valor_repasse_montagem atual
      // (não usar valor_atribuido antigo que pode estar desatualizado)
      let valorBase = 0;
      if (servico.valor_repasse_montagem != null && Number(servico.valor_repasse_montagem) > 0) {
        // Valor já calculado com porcentagem da loja
        valorBase = Number(servico.valor_repasse_montagem);
      } else {
        // Calcular aqui (fallback para serviços antigos)
        const valorCheio = getValorCheio(servico);
        const loja = servico.tipo_cliente === 'loja' ? servico.Loja : null;
        valorBase = loja?.usa_porcentagem && loja?.porcentagem_repasse != null && Number(loja.porcentagem_repasse) > 0
          ? (valorCheio * Number(loja.porcentagem_repasse)) / 100
          : valorCheio;
      }

      // Aplicar divisão por percentual se definido
      if (sm.percentual_divisao != null && Number(sm.percentual_divisao) > 0) {
        return (valorBase * Number(sm.percentual_divisao)) / 100;
      }

      // Dividir igualmente entre montadores
      const totalMontadores = montadoresPorServico[sm.servico_id] || 1;
      return valorBase / totalMontadores;
    };

    // Para cada montador, calcular seus valores
    for (const montador of montadores) {
      const servicosMontador = servicosMontadoresPeriodo.filter((sm) => sm.usuario_id === montador.id);

      const valorMontagens = servicosMontador.reduce(
        (sum, sm) => sum + parseFloat(calcularValorAtribuido(sm) || 0),
        0
      );
      
      // Aplicar fórmula de cálculo
      let salarioCalculado = valorMontagens;
      try {
        // Substituir variável na fórmula e calcular
        const formulaCalculada = formula.replace('valor_montagem', valorMontagens.toString());
        salarioCalculado = eval(formulaCalculada) + salarioBase;
      } catch (error) {
        console.error('Erro ao calcular fórmula:', error);
        salarioCalculado = valorMontagens + salarioBase;
      }
      
      // Montar detalhes dos serviços
      const detalhes = servicosMontador.map(sm => {
        const servico = servicoById[sm.servico_id];
        return {
          servico_id: sm.servico_id,
          codigo_servico: servico?.codigo_servico,
          data_servico: servico?.data_servico,
          valor_atribuido: parseFloat(calcularValorAtribuido(sm) || 0),
          papel: sm.papel,
          percentual_divisao: parseFloat(sm.percentual_divisao || 0)
        };
      });
      
      resultado.montadores.push({
        usuario_id: montador.id,
        nome: montador.nome,
        servicos_realizados: servicosMontador.length,
        valor_montagens: parseFloat(valorMontagens.toFixed(2)),
        valor_base: salarioBase,
        salario_calculado: parseFloat(salarioCalculado.toFixed(2)),
        detalhes
      });
      
      // Atualizar totais
      resultado.totais.total_servicos += servicosMontador.length;
      resultado.totais.total_valor_montagens += valorMontagens;
      resultado.totais.total_salarios += salarioCalculado;
    }
    
    // Atualizar contagem de montadores
    resultado.totais.total_montadores = resultado.montadores.length;
    resultado.totais.total_valor_montagens = parseFloat(resultado.totais.total_valor_montagens.toFixed(2));
    resultado.totais.total_salarios = parseFloat(resultado.totais.total_salarios.toFixed(2));
    
    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('Erro ao calcular salários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular salários',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/dashboard/salarios/:usuario_id/detalhado
 * 
 * Retorna detalhamento completo de salário de um montador específico
 */
router.get('/:usuario_id/detalhado', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { data_inicio, data_fim } = req.query;
    
    // Buscar montador
    const montador = await models.Usuario.findByPk(usuario_id);
    if (!montador) {
      return res.status(404).json({
        success: false,
        message: 'Montador não encontrado'
      });
    }
    
    // Reutilizar lógica do endpoint principal com filtro de usuário
    const response = await fetch(
      `/dashboard/salarios?usuario_id=${usuario_id}&data_inicio=${data_inicio}&data_fim=${data_fim}`
    );

    res.json(response);
    
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes',
      error: error.message
    });
  }
});

module.exports = router;
