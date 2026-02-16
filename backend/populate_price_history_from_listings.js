require('dotenv').config();
const pool = require('./src/db');

async function populateFromListings() {
  try {
    console.log('📊 A popular histórico de preços a partir das listings existentes...\n');
    
    // Buscar items únicos com preços
    const result = await pool.query(`
      SELECT 
        market_hash_name,
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price))::INT as avg_price,
        COUNT(*) as listing_count
      FROM listings
      WHERE price > 0
      GROUP BY market_hash_name
      ORDER BY listing_count DESC
      LIMIT 100
    `);
    
    console.log(`✅ Encontrados ${result.rows.length} items com preços\n`);
    
    const today = new Date().toISOString().split('T')[0];
    let inserted = 0;
    
    for (const item of result.rows) {
      try {
        await pool.query(`
          INSERT INTO price_history 
            (market_hash_name, date, avg_price, min_price, max_price, listing_count)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (market_hash_name, date) 
          DO UPDATE SET
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            listing_count = EXCLUDED.listing_count,
            updated_at = CURRENT_TIMESTAMP
        `, [
          item.market_hash_name,
          today,
          item.avg_price,
          item.min_price,
          item.max_price,
          item.listing_count
        ]);
        
        inserted++;
        console.log(`[${inserted}/${result.rows.length}] ${item.market_hash_name} - ${item.min_price}¢`);
      } catch (err) {
        console.error(`❌ Erro em ${item.market_hash_name}:`, err.message);
      }
    }
    
    console.log(`\n✅ Histórico populado! ${inserted} items guardados para hoje (${today})`);
    console.log('\n💡 A partir de agora, os preços serão atualizados automaticamente quando alguém procurar items no site!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

populateFromListings();
