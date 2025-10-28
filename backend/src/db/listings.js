// backend/src/db/listings.js
const pool = require('./index.js');

/**
 * Insere ou atualiza múltiplos listings na base de dados.
 * Usa ON CONFLICT para ser eficiente (UPSERT).
 * @param {Array} listings - Um array de objetos de listing a serem guardados.
 */
async function upsertListings(listings) {
  if (!listings || listings.length === 0) {
    return;
  }

  // Prepara os valores para uma query parametrizada em massa
  const values = [];
  const placeholders = listings.map((l, index) => {
    const i = index * 10; // Cada listing tem 10 colunas
    values.push(
      l.listing_id, l.item_id, l.price, l.fee,
      l.seller_steam_id, l.float_value, l.paint_seed,
      l.paint_index, JSON.stringify(l.stickers), l.inspect_link
    );
    return `($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10})`;
  }).join(', ');

  const query = `
    INSERT INTO listings (
      listing_id, item_id, price, fee, seller_steam_id, 
      float_value, paint_seed, paint_index, stickers, inspect_link
    )
    VALUES ${placeholders}
    ON CONFLICT (listing_id) DO UPDATE SET
      price = EXCLUDED.price,
      fee = EXCLUDED.fee,
      float_value = EXCLUDED.float_value,
      stickers = EXCLUDED.stickers,
      scraped_at = CURRENT_TIMESTAMP;
  `;

  try {
    await pool.query(query, values);
    console.log(`${listings.length} listings foram inseridos/atualizados com sucesso.`);
  } catch (err) {
    console.error('Erro ao fazer upsert dos listings:', err);
  }
}

/**
 * Busca os listings de um item específico da base de dados.
 * @param {number} itemId - O ID do item da sua tabela 'items'.
 * @param {Object} options - Opções de paginação e ordenação.
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


module.exports = { upsertListings, getListingsByItemId };