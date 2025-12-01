// backend/src/routes/itemsRoutes.js
const express = require('express');
const pool = require('../db/index.js');

const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    // Busca as 20 skins mais recentes baseadas no scraped_at
    const query = `
      SELECT listing_id, market_hash_name, icon_url, price, float_value, scraped_at
      FROM listings
      ORDER BY scraped_at DESC
      LIMIT 20
    `;
    const { rows } = await pool.query(query);
    
    res.json({ success: true, items: rows });
  } catch (err) {
    console.error('Erro ao buscar últimas skins:', err);
    res.status(500).json({ success: false, items: [] });
  }
});

// ROTA PARA A PÁGINA /skins (BrowseSkinsPage) - AGORA MUITO MAIS RÁPIDA
router.get('/', async (req, res) => {
  const { 
    page = 1, limit = 100, sortBy = 'price', sortOrder = 'ASC',
    // Filtros agora podem ser aplicados diretamente nesta tabela
    category, rarity, search, stattrak, souvenir 
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // A lógica de construção de filtros continua a mesma
  if (search) {
    whereClauses.push(`market_hash_name ILIKE $${paramIndex++}`);
    queryParams.push(`%${search}%`);
  }
  // NOTA: Para filtrar por categoria, raridade, etc., essas colunas
  // também teriam que ser adicionadas à tabela 'listings'.
  // Por agora, vamos focar-nos na busca por nome.
  
  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const allowedSortColumns = { price: 'price', floatid: 'float_value', paintseed: 'paint_seed' };
  const safeSortBy = allowedSortColumns[sortBy] || 'price';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // QUERY SIMPLIFICADA - SEM JOIN
  const query = `
    SELECT * FROM listings
    ${whereString}
    ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;
  queryParams.push(limit, offset);

  const countQuery = `SELECT COUNT(*) FROM listings ${whereString}`;

  try {
    const itemsResult = await pool.query(query, queryParams);
    const totalResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 3));
    
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      items: itemsResult.rows,
      pagination: { currentPage: parseInt(page, 10), totalPages, totalItems }
    });
  } catch (err) {
    console.error('Erro ao buscar listings da base de dados:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

module.exports = router;