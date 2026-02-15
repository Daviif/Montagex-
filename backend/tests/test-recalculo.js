/**
 * Script de teste para validar recálculo automático
 * Simula alterações e verifica se valores são recalculados corretamente
 * 
 * Uso: node tests/test-recalculo.js
 */

const { models } = require('../src/models');
const { Op } = require('sequelize');

async function testarRecalculoAutomatico() {
  console.log('\n🧪 TESTE DE RECÁLCULO AUTOMÁTICO\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // 1. Buscar loja DULAR
    console.log('1️⃣ Buscando loja DULAR...');
    const loja = await models.Loja.findOne({
      where: { nome_fantasia: 'DULAR' }
    });

    if (!loja) {
      console.log('❌ Loja DULAR não encontrada');
      return;
    }

    console.log(`   ✅ Loja encontrada: ${loja.nome_fantasia}`);
    console.log(`   Configuração atual: usa_porcentagem=${loja.usa_porcentagem}, porcentagem=${loja.porcentagem_repasse}%\n`);

    // 2. Buscar um serviço da loja
    console.log('2️⃣ Buscando serviço da loja...');
    const servico = await models.Servico.findOne({
      where: { 
        loja_id: loja.id,
        tipo_cliente: 'loja'
      },
      include: [{
        model: models.ServicoMontador,
        as: 'servicoMontadores'
      }]
    });

    if (!servico) {
      console.log('❌ Nenhum serviço encontrado para esta loja');
      return;
    }

    console.log(`   ✅ Serviço encontrado: ${servico.codigo_servico}`);
    console.log(`   Valor Total: R$ ${servico.valor_total}`);
    console.log(`   Valor Repasse Atual: R$ ${servico.valor_repasse_montagem}`);
    console.log(`   Montadores: ${servico.servicoMontadores?.length || 0}\n`);

    // 3. Salvar valores originais
    const valorRepasseAntes = Number(servico.valor_repasse_montagem);
    const montadoresAntes = servico.servicoMontadores || [];

    // 4. TESTE: Alterar porcentagem da loja
    console.log('3️⃣ TESTE: Alterando porcentagem da loja...');
    console.log('   Mudando de 10% para 15%\n');

    await loja.update({
      usa_porcentagem: true,
      porcentagem_repasse: 15
    });

    // Aguardar hooks processarem
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Verificar se valores foram recalculados
    console.log('4️⃣ Verificando recálculo...\n');

    const servicoAtualizado = await models.Servico.findByPk(servico.id, {
      include: [{
        model: models.ServicoMontador,
        as: 'servicoMontadores'
      }]
    });

    const valorRepasseDepois = Number(servicoAtualizado.valor_repasse_montagem);
    const valorEsperado = (Number(servico.valor_total) * 15) / 100;

    console.log('   VALORES DO SERVIÇO:');
    console.log(`   Valor Total: R$ ${servicoAtualizado.valor_total}`);
    console.log(`   Valor Repasse ANTES: R$ ${valorRepasseAntes.toFixed(2)}`);
    console.log(`   Valor Repasse DEPOIS: R$ ${valorRepasseDepois.toFixed(2)}`);
    console.log(`   Valor ESPERADO (15%): R$ ${valorEsperado.toFixed(2)}`);
    
    if (Math.abs(valorRepasseDepois - valorEsperado) < 0.01) {
      console.log(`   ✅ SERVIÇO RECALCULADO CORRETAMENTE!\n`);
    } else {
      console.log(`   ❌ ERRO: Valor não foi recalculado corretamente\n`);
    }

    // 6. Verificar montadores
    console.log('   VALORES DOS MONTADORES:');
    const montadoresDepois = servicoAtualizado.servicoMontadores || [];
    
    for (let i = 0; i < montadoresDepois.length; i++) {
      const montadorAntes = montadoresAntes[i];
      const montadorDepois = montadoresDepois[i];
      
      const valorEsperadoMontador = valorEsperado / montadoresDepois.length;
      const valorAtual = Number(montadorDepois.valor_atribuido);
      
      console.log(`   Montador ${i + 1}:`);
      if (montadorAntes) {
        console.log(`     - ANTES: R$ ${Number(montadorAntes.valor_atribuido).toFixed(2)}`);
      }
      console.log(`     - DEPOIS: R$ ${valorAtual.toFixed(2)}`);
      console.log(`     - ESPERADO: R$ ${valorEsperadoMontador.toFixed(2)}`);
      
      if (Math.abs(valorAtual - valorEsperadoMontador) < 0.01) {
        console.log(`     ✅ Correto!`);
      } else {
        console.log(`     ❌ Erro!`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ TESTE CONCLUÍDO');
    console.log('═══════════════════════════════════════════\n');

    // 7. Reverter mudanças (opcional)
    console.log('🔄 Revertendo alterações para 10%...\n');
    await loja.update({
      usa_porcentagem: true,
      porcentagem_repasse: 10
    });

    console.log('✅ Valores restaurados\n');

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    process.exit(0);
  }
}

// Executar teste
testarRecalculoAutomatico();
