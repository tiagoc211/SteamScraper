// Script para popular o histórico de preços com dados REAIS da Steam
// Execute: node fetch_steam_history.js

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const priceHistory = require('./src/db/priceHistory');
const pool = require('./src/db/index');

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   STEAM PRICE HISTORY FETCHER                             ║');
  console.log('║   Busca histórico REAL de preços da Steam Market          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Configurações
  const ITEMS_LIMIT = 50;  // Quantos itens processar
  const DAYS_BACK = 30;    // Quantos dias de histórico (máx 180)
  
  console.log(`📋 Configuração:`);
  console.log(`   - Itens: ${ITEMS_LIMIT}`);
  console.log(`   - Histórico: ${DAYS_BACK} dias`);
  console.log(`   - Rate limit: 2 segundos entre requests\n`);
  
  const estimatedTime = Math.ceil((ITEMS_LIMIT * 2) / 60);
  console.log(`⏱️  Tempo estimado: ~${estimatedTime} minutos\n`);
  
  console.log('⚠️  ATENÇÃO: A Steam tem rate limits. Este processo é lento mas necessário.\n');
  
  try {
    // Executar
    const totalInserted = await priceHistory.populateFromSteamHistory(ITEMS_LIMIT, DAYS_BACK);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ CONCLUÍDO COM SUCESSO!                               ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de preços inseridos: ${totalInserted}`);
    console.log(`   - Média por item: ${Math.round(totalInserted / ITEMS_LIMIT)} dias\n`);
    
    console.log('🎯 Próximo passo: Visite http://localhost:3000/trends\n');
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error('\nStack trace:', error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Executar
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
