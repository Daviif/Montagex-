const express = require('express');
const router = express.Router();
const { models, sequelize } = require('../models');
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
router.get('/salarios', async (req, res) => {
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
    
    // Para cada montador, calcular seus valores
    for (const montador of montadores) {
      // Buscar todos os serviços do montador no período
      const servicosMontador = await models.ServicoMontador.findAll({
        where: { usuario_id: montador.id },
        include: [{
          model: models.Servico,
          where: {
            data_servico: {
              [Op.between]: [dataInicio, dataFim]
            },
            status: 'concluido'
          },
          required: true,
          attributes: ['id', 'codigo_servico', 'data_servico']
        }],
        attributes: ['id', 'servico_id', 'valor_atribuido', 'papel', 'percentual_divisao']
      });
      
      // Calcular total de montagens
      const valorMontagens = servicosMontador.reduce(
        (sum, sm) => sum + parseFloat(sm.valor_atribuido || 0),
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
      const detalhes = servicosMontador.map(sm => ({
        servico_id: sm.servico_id,
        codigo_servico: sm.Servico?.codigo_servico,
        data_servico: sm.Servico?.data_servico,
        valor_atribuido: parseFloat(sm.valor_atribuido),
        papel: sm.papel,
        percentual_divisao: parseFloat(sm.percentual_divisao || 0)
      }));
      
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
router.get('/salarios/:usuario_id/detalhado', async (req, res) => {
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
