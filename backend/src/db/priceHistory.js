// backend/src/db/priceHistory.js
const pool = require('./index.js');
const steamPriceHistory = require('../utils/steamPriceHistory');

/**
 * Agrega os preços atuais dos listings e salva no histórico
 */
async function aggregateDailyPrices() {
  const today = new Date().toISOString().split('T')[0];
  
  const query = `
    INSERT INTO price_history (market_hash_name, date, avg_price, min_price, max_price, listing_count, avg_float)
    SELECT 
      market_hash_name,
      $1::date as date,
      ROUND(AVG(price))::int as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price,
      COUNT(*) as listing_count,
      AVG(float_value) as avg_float
    FROM listings
    WHERE market_hash_name IS NOT NULL
    GROUP BY market_hash_name
    ON CONFLICT (market_hash_name, date) 
    DO UPDATE SET
      avg_price = EXCLUDED.avg_price,
      min_price = EXCLUDED.min_price,
      max_price = EXCLUDED.max_price,
      listing_count = EXCLUDED.listing_count,
      avg_float = EXCLUDED.avg_float;
  `;

  try {
    const result = await pool.query(query, [today]);
    console.log(`📊 Daily price aggregation complete for ${today}`);
    return result.rowCount;
  } catch (err) {
    console.error('Error aggregating daily prices:', err);
    throw err;
  }
}

/**
 * Obtém os itens com maior variação de preço (positiva ou negativa)
 * Compara o preço mais recente com o mais antigo no período disponível
 */
async function getTopPriceChanges({ days = 7, limit = 20, direction = 'both' }) {
  const query = `
    WITH latest_prices AS (
      SELECT DISTINCT ON (market_hash_name)
        market_hash_name,
        avg_price as current_price,
        date as latest_date
      FROM price_history
      WHERE date >= CURRENT_DATE - $1::integer
      ORDER BY market_hash_name, date DESC
    ),
    earliest_prices AS (
      SELECT DISTINCT ON (market_hash_name)
        market_hash_name,
        avg_price as past_price,
        date as earliest_date
      FROM price_history
      WHERE date >= CURRENT_DATE - $1::integer
      ORDER BY market_hash_name, date ASC
    )
    SELECT 
      lp.market_hash_name,
      lp.current_price,
      ep.past_price,
      lp.current_price - ep.past_price as price_change,
      CASE 
        WHEN ep.past_price > 0 THEN
          ROUND(((lp.current_price::float - ep.past_price::float) / ep.past_price::float * 100)::numeric, 2)
        ELSE 0
      END as percent_change,
      l.icon_url,
      l.float_value,
      lp.latest_date as last_updated
    FROM latest_prices lp
    INNER JOIN earliest_prices ep ON lp.market_hash_name = ep.market_hash_name
    LEFT JOIN LATERAL (
      SELECT icon_url, float_value 
      FROM listings 
      WHERE market_hash_name = lp.market_hash_name 
      LIMIT 1
    ) l ON true
    WHERE ep.past_price > 0
    ${direction === 'up' ? 'AND lp.current_price > ep.past_price' : ''}
    ${direction === 'down' ? 'AND lp.current_price < ep.past_price' : ''}
    ORDER BY ${direction === 'down' ? '5 ASC' : 'ABS(lp.current_price - ep.past_price) DESC'}
    LIMIT $2;
  `;

  try {
    const result = await pool.query(query, [days, limit]);
    return result.rows;
  } catch (err) {
    console.error('Error getting top price changes:', err);
    throw err;
  }
}

/**
 * Obtém o histórico de preços de um item específico
 */
async function getItemPriceHistory(marketHashName, days = 30) {
  const query = `
    SELECT 
      date,
      avg_price,
      min_price,
      max_price,
      listing_count
    FROM price_history
    WHERE market_hash_name = $1
      AND date >= CURRENT_DATE - $2::integer
    ORDER BY date ASC;
  `;

  try {
    const result = await pool.query(query, [marketHashName, days]);
    return result.rows;
  } catch (err) {
    console.error('Error getting item price history:', err);
    throw err;
  }
}

/**
 * Busca histórico real da Steam e popula a base de dados
 * @param {number} limit - Número de itens para processar
 * @param {number} daysBack - Quantos dias de histórico buscar (máx 180)
 */
async function populateFromSteamHistory(limit = 50, daysBack = 30) {
  console.log(`\n🌐 Buscando histórico real da Steam para ${limit} itens...\n`);
  
  try {
    // Buscar os itens mais populares da nossa BD
    const itemsQuery = `
      SELECT DISTINCT market_hash_name
      FROM listings
      WHERE market_hash_name IS NOT NULL
      LIMIT $1;
    `;
    
    const { rows } = await pool.query(itemsQuery, [limit]);
    const marketHashNames = rows.map(r => r.market_hash_name);
    
    if (marketHashNames.length === 0) {
      console.log('⚠️  Nenhum item encontrado na tabela listings');
      return 0;
    }
    
    console.log(`📊 Itens selecionados: ${marketHashNames.length}\n`);
    
    // Buscar histórico da Steam (com delay entre requests)
    const histories = await steamPriceHistory.fetchMultiplePriceHistories(marketHashNames, 2000);
    
    let totalInserted = 0;
    
    // Processar cada item
    for (const [marketHashName, priceHistory] of Object.entries(histories)) {
      if (priceHistory.length === 0) continue;
      
      // Agregar por dia
      const dailyData = steamPriceHistory.aggregateByDay(priceHistory);
      
      // Filtrar apenas os últimos X dias
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      const recentData = dailyData.filter(d => new Date(d.date) >= cutoffDate);
      
      // Inserir na BD
      for (const dayData of recentData) {
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
              listing_count = EXCLUDED.listing_count;
          `, [
            marketHashName,
            dayData.date,
            dayData.avg_price,
            dayData.min_price,
            dayData.max_price,
            dayData.listing_count
          ]);
          
          totalInserted++;
        } catch (err) {
          console.error(`❌ Error inserting ${marketHashName} for ${dayData.date}:`, err.message);
        }
      }
      
      console.log(`  ✅ ${marketHashName}: ${recentData.length} days inserted`);
    }
    
    console.log(`\n✅ Total: ${totalInserted} price points inserted from Steam history`);
    return totalInserted;
    
  } catch (err) {
    console.error('❌ Error populating from Steam history:', err);
    throw err;
  }
}

/**
 * Retorna items com melhor relação preço/liquidez
 * Liquidez = muitas listings disponíveis a preços baixos
 * Score = listing_count / avg_price (quanto maior, melhor relação)
 */
async function getBestPriceLiquidity(limit = 20) {
  const query = `
    SELECT 
      l.market_hash_name,
      MIN(l.price) as min_price,
      ROUND(AVG(l.price))::INT as avg_price,
      COUNT(*) as listing_count,
      ROUND((COUNT(*)::float / NULLIF(AVG(l.price), 0) * 10000)::numeric, 2) as liquidity_score,
      MIN(l.icon_url) as icon_url
    FROM listings l
    WHERE l.price > 0 AND l.market_hash_name IS NOT NULL
    GROUP BY l.market_hash_name
    HAVING COUNT(*) >= 3
    ORDER BY (COUNT(*)::float / NULLIF(AVG(l.price), 0)) DESC
    LIMIT $1;
  `;

  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (err) {
    console.error('Error getting best price/liquidity:', err);
    throw err;
  }
}

/**
 * Retorna items com os floats mais baixos no mercado
 */
async function getLowestFloats(limit = 20) {
  const query = `
    WITH lowest_per_item AS (
      SELECT DISTINCT ON (l.market_hash_name)
        l.market_hash_name,
        l.float_value,
        l.paint_seed,
        l.price,
        l.icon_url,
        l.listing_id
      FROM listings l
      WHERE l.float_value IS NOT NULL 
        AND l.float_value > 0
        AND l.price > 0
        AND l.market_hash_name IS NOT NULL
      ORDER BY l.market_hash_name, l.float_value ASC
    )
    SELECT * FROM lowest_per_item
    ORDER BY float_value ASC
    LIMIT $1
  `;

  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (err) {
    console.error('Error getting lowest floats:', err);
    throw err;
  }
}

module.exports = {
  aggregateDailyPrices,
  getTopPriceChanges,
  getItemPriceHistory,
  populateFromSteamHistory,
  getBestPriceLiquidity,
  getLowestFloats
};
