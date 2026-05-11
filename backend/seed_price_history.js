require('dotenv').config();
const pool = require('./src/db');

/**
 * Popular price_history com dados dos últimos 7 dias baseados nos preços atuais.
 * Adiciona pequenas variações aleatórias para simular movimentos reais de mercado.
 */
async function seedPriceHistory() {
  try {
    console.log('📊 A popular price_history com dados dos últimos 7 dias...\n');
    
    // Buscar items com preços atuais
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
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum item encontrado!');
      await pool.end();
      return;
    }
    
    console.log(`✅ Encontrados ${result.rows.length} items\n`);
    
    let totalInserted = 0;
    
    for (const item of result.rows) {
      // Gerar dados para os últimos 7 dias
      for (let daysAgo = 0; daysAgo <= 7; daysAgo++) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];
        
        // Variação aleatória de -8% a +8% baseada nos dias
        // Items mais antigos têm preços ligeiramente diferentes
        const variation = 1 + (Math.random() * 0.16 - 0.08) * (daysAgo / 7);
        
        const avgPrice = Math.round(item.avg_price * variation);
        const minPrice = Math.round(item.min_price * variation);
        const maxPrice = Math.round(item.max_price * variation);
        
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
              listing_count = EXCLUDED.listing_count
          `, [item.market_hash_name, dateStr, avgPrice, minPrice, maxPrice, item.listing_count]);
          
          totalInserted++;
        } catch (err) {
          console.error(`❌ ${item.market_hash_name} ${dateStr}:`, err.message);
        }
      }
      
      console.log(`✅ ${item.market_hash_name} - 8 dias de dados`);
    }
    
    console.log(`\n✅ Pronto! ${totalInserted} registos inseridos.`);
    console.log('💡 A página de Trends agora vai mostrar variações de preço!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

seedPriceHistory();
