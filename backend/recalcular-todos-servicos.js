/**
 * Script para recalcular TODOS os valores_atribuido no banco
 * baseado na configuração atual das lojas
 * 
 * Uso: node recalcular-todos-servicos.js
 */

const { Client } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

async function recalcularTodosServicos() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Buscar todas as lojas
    const lojasResult = await client.query(`
      SELECT id, nome_fantasia, razao_social, usa_porcentagem, porcentagem_repasse
      FROM lojas
      ORDER BY nome_fantasia
    `);

    console.log(`📊 Encontradas ${lojasResult.rows.length} lojas\n`);

    let totalServicosAtualizados = 0;
    let totalMontadoresAtualizados = 0;

    // 2. Para cada loja, recalcular seus serviços
    for (const loja of lojasResult.rows) {
      console.log(`🏪 Processando loja: ${loja.nome_fantasia || loja.razao_social}`);
      console.log(`   Configuração: usa_porcentagem=${loja.usa_porcentagem}, porcentagem=${loja.porcentagem_repasse}%`);

      const usaPorcentagem = loja.usa_porcentagem;
      const porcentagemRepasse = parseFloat(loja.porcentagem_repasse || 0);

      // Buscar serviços da loja
      const servicosResult = await client.query(`
        SELECT id, codigo_servico, valor_total, valor_repasse_montagem
        FROM servicos
        WHERE loja_id = $1 AND tipo_cliente = 'loja'
        ORDER BY data_servico DESC
      `, [loja.id]);

      if (servicosResult.rows.length === 0) {
        console.log(`   ⚠️  Nenhum serviço encontrado\n`);
        continue;
      }

      console.log(`   📋 ${servicosResult.rows.length} serviço(s) encontrado(s)`);

      for (const servico of servicosResult.rows) {
        const valorTotal = parseFloat(servico.valor_total || 0);

        // Calcular novo valor de repasse
        const novoValorRepasse = usaPorcentagem && porcentagemRepasse > 0
          ? (valorTotal * porcentagemRepasse) / 100
          : valorTotal;

        // Atualizar valor_repasse_montagem do serviço
        await client.query(`
          UPDATE servicos
          SET valor_repasse_montagem = $1
          WHERE id = $2
        `, [novoValorRepasse.toFixed(2), servico.id]);

        totalServicosAtualizados++;

        // Buscar montadores do serviço
        const montadoresResult = await client.query(`
          SELECT id, usuario_id, percentual_divisao
          FROM servico_montadores
          WHERE servico_id = $1
        `, [servico.id]);

        if (montadoresResult.rows.length > 0) {
          const totalMontadores = montadoresResult.rows.length;
          const valorPorMontador = novoValorRepasse / totalMontadores;

          for (const montador of montadoresResult.rows) {
            let novoValorMontador;

            if (montador.percentual_divisao != null && parseFloat(montador.percentual_divisao) > 0) {
              novoValorMontador = (novoValorRepasse * parseFloat(montador.percentual_divisao)) / 100;
            } else {
              novoValorMontador = valorPorMontador;
            }

            // Atualizar valor_atribuido
            await client.query(`
              UPDATE servico_montadores
              SET valor_atribuido = $1
              WHERE id = $2
            `, [novoValorMontador.toFixed(2), montador.id]);

            totalMontadoresAtualizados++;
          }
        }
      }

      console.log(`   ✅ Serviços da loja atualizados\n`);
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅ RECÁLCULO CONCLUÍDO');
    console.log(`📊 Total de serviços atualizados: ${totalServicosAtualizados}`);
    console.log(`👷 Total de montadores atualizados: ${totalMontadoresAtualizados}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao recalcular:', error);
  } finally {
    await client.end();
  }
}

// Executar
recalcularTodosServicos();
