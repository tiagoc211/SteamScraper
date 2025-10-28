// backend/src/routes/itemsRoutes.js
const express = require('express');
const pool = require('../db/index.js');

const router = express.Router();

// ROTA PARA A PÁGINA /skins (BrowseSkinsPage)
router.get('/', async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Query refinada para trazer dados de ambas as tabelas
    const query = `
      SELECT DISTINCT ON (l.item_id)
        l.listing_id,
        l.item_id,
        l.price,
        i.a as item_pk,
        i.defindex,
        i.paintindex,
        i.rarity,
        i.stattrak,
        i.souvenir
        -- Adicione aqui as colunas que você tem na tabela 'items'
        -- Por exemplo: i.market_hash_name, i.icon_url, i.category_name
      FROM listings l
      JOIN items i ON l.item_id = i.a
      ORDER BY l.item_id, l.scraped_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const countQuery = `SELECT COUNT(DISTINCT item_id) FROM listings;`;

    const itemsResult = await pool.query(query, [limit, offset]);
    const totalResult = await pool.query(countQuery);
    
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      items: itemsResult.rows,
      pagination: { currentPage: parseInt(page, 10), totalPages, totalItems }
    });
  } catch (err) {
    console.error('Erro ao buscar itens da tabela de listings:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

module.exports = router;