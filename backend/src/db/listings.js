// backend/src/db/listings.js
const pool = require('./index.js');

/**
 * Insere ou atualiza múltiplos listings na base de dados.
 * Esta função já estava correta, mas incluímo-la para ter o ficheiro completo.
 */
async function upsertListings(listings) {
  if (!listings || listings.length === 0) return;

  const values = [];
  const placeholders = listings.map((l, index) => {
    // Agora temos 11 colunas
    const i = index * 11; 
    values.push(
      l.listing_id, l.item_id, l.price, l.fee,
      l.float_value, l.paint_seed, l.stickers, l.keychains, // Adicionado keychains
      l.inspect_link, l.market_hash_name, l.icon_url
    );
    return `($${i+1}, $${i+2}, $${i+3}, $${i+4}, $${i+5}, $${i+6}, $${i+7}, $${i+8}, $${i+9}, $${i+10}, $${i+11})`;
  }).join(', ');

  const query = `
    INSERT INTO listings (
      listing_id, item_id, price, fee, 
      float_value, paint_seed, stickers, keychains, -- Adicionado keychains
      inspect_link, market_hash_name, icon_url
    )
    VALUES ${placeholders}
    ON CONFLICT (listing_id) DO UPDATE SET
      price = EXCLUDED.price,
      fee = EXCLUDED.fee,
      float_value = EXCLUDED.float_value,
      stickers = EXCLUDED.stickers,
      keychains = EXCLUDED.keychains, -- Adicionado keychains
      market_hash_name = EXCLUDED.market_hash_name,
      icon_url = EXCLUDED.icon_url,
      scraped_at = CURRENT_TIMESTAMP;
  `;

  try {
    await pool.query(query, values);
    console.log(`${listings.length} listings (com charms) foram inseridos/atualizados.`);
  } catch (err) {
    console.error('Erro ao fazer upsert dos listings:', err);
  }
}

/**
 * Busca os listings de um item específico da base de dados.
 * CORREÇÃO: Adicionado o 'async' keyword que estava em falta.
 */
async function getListingsByItemId(itemId, { page = 1, limit = 24, sortBy = 'price', sortOrder = 'ASC' }) {
    const offset = (page - 1) * limit;

    const allowedSort = {
        price: 'price',
        float: 'float_value',
        pattern: 'paint_seed'
    };
    const safeSortBy = allowedSort[sortBy] || 'price';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
        SELECT * FROM listings
        WHERE item_id = $1
        ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST
        LIMIT $2
        OFFSET $3;
    `;
    
    const countQuery = 'SELECT COUNT(*) FROM listings WHERE item_id = $1;';

    // O 'await' aqui dentro agora é válido porque a função é 'async'
    const { rows } = await pool.query(query, [itemId, limit, offset]);
    const totalResult = await pool.query(countQuery, [itemId]);
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    
    return {
        listings: rows,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems
        }
    };
}


/**
 * Busca as armas mais caras da base de dados (preço médio mais alto)
 */
async function getMostExpensiveItems(limit = 10) {
  const query = `
    SELECT 
      market_hash_name,
      MAX(icon_url) as icon_url,
      ROUND(AVG(price)) as avg_price,
      MAX(price) as max_price,
      MIN(price) as min_price,
      COUNT(*) as listing_count
    FROM listings
    WHERE price > 0 AND market_hash_name IS NOT NULL
    GROUP BY market_hash_name
    HAVING COUNT(*) >= 1
    ORDER BY AVG(price) DESC
    LIMIT $1;
  `;

  try {
    const { rows } = await pool.query(query, [limit]);
    console.log(`✅ Fetched ${rows.length} most expensive items`);
    return rows;
  } catch (err) {
    console.error('Erro ao buscar armas mais caras:', err);
    throw err;
  }
}

module.exports = { upsertListings, getListingsByItemId, getMostExpensiveItems };