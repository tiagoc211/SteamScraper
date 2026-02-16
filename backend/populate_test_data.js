// Script para popular dados de teste no histórico de preços
// ⚠️  ATENÇÃO: Este script gera dados SIMULADOS para testes rápidos
// Para dados REAIS da Steam, use: node fetch_steam_history.js
// Execute: node populate_test_data.js

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const pool = require('./src/db/index.js');

async function populateTestData() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   DADOS DE TESTE - NÃO SÃO REAIS                          ║');
  console.log('║   Use fetch_steam_history.js para dados reais da Steam   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('🔄 Populando dados de TESTE para price_history...\n');

  try {
    // 1. Criar snapshot de hoje
    console.log('📊 Criando snapshot de hoje...');
    const todayQuery = `
      INSERT INTO price_history (market_hash_name, date, avg_price, min_price, max_price, listing_count, avg_float)
      SELECT 
        market_hash_name,
        CURRENT_DATE as date,
        price as avg_price,
        ROUND(price * 0.9) as min_price,
        ROUND(price * 1.1) as max_price,
        1 as listing_count,
        float_value as avg_float
      FROM listings
      WHERE market_hash_name IS NOT NULL
      ON CONFLICT (market_hash_name, date) DO NOTHING;
    `;
    const todayResult = await pool.query(todayQuery);
    console.log(`✅ ${todayResult.rowCount} items adicionados para hoje\n`);

    // 2. Criar dados de 7 dias atrás (com variações aleatórias)
    console.log('📊 Criando dados de 7 dias atrás (com variações simuladas)...');
    const pastQuery = `
      INSERT INTO price_history (market_hash_name, date, avg_price, min_price, max_price, listing_count, avg_float)
      SELECT 
        market_hash_name,
        CURRENT_DATE - 7 as date,
        -- Variação aleatória entre -30% e +30%
        ROUND(price * (0.7 + random() * 0.6))::int as avg_price,
        ROUND(price * (0.6 + random() * 0.3))::int as min_price,
        ROUND(price * (0.8 + random() * 0.4))::int as max_price,
        1 as listing_count,
        float_value as avg_float
      FROM listings
      WHERE market_hash_name IS NOT NULL
      ON CONFLICT (market_hash_name, date) DO NOTHING;
    `;
    const pastResult = await pool.query(pastQuery);
    console.log(`✅ ${pastResult.rowCount} items adicionados para 7 dias atrás\n`);

    // 3. Verificar alguns exemplos
    console.log('📈 Exemplos de variações criadas:\n');
    const examplesQuery = `
      WITH current_prices AS (
        SELECT market_hash_name, avg_price as current_price
        FROM price_history
        WHERE date = CURRENT_DATE
        LIMIT 10
      ),
      past_prices AS (
        SELECT market_hash_name, avg_price as past_price
        FROM price_history
        WHERE date = CURRENT_DATE - 7
      )
      SELECT 
        c.market_hash_name,
        c.current_price,
        p.past_price,
        c.current_price - p.past_price as change,
        ROUND(((c.current_price::float - p.past_price::float) / p.past_price::float * 100)::numeric, 2) as percent_change
      FROM current_prices c
      INNER JOIN past_prices p ON c.market_hash_name = p.market_hash_name
      ORDER BY percent_change DESC;
    `;
    const examples = await pool.query(examplesQuery);
    
    examples.rows.forEach((row, idx) => {
      const symbol = parseFloat(row.percent_change) > 0 ? '📈' : '📉';
      console.log(`${symbol} ${row.market_hash_name}`);
      console.log(`   Antes: €${(row.past_price / 100).toFixed(2)} | Agora: €${(row.current_price / 100).toFixed(2)}`);
      console.log(`   Variação: ${row.percent_change}%\n`);
    });

    console.log('✅ Dados de teste populados com sucesso!');
    console.log('\n🎯 Agora pode visitar http://localhost:3000/trends para ver os resultados');
    
  } catch (error) {
    console.error('❌ Erro ao popular dados:', error.message);
  } finally {
    await pool.end();
  }
}

populateTestData();
