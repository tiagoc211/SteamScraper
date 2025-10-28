// backend/src/routes/itemsRoutes.js
const express = require('express');
const pool = require('../db/index.js');

const router = express.Router();

router.get('/', async (req, res) => {
  // Extrai parâmetros do query string com valores padrão
  const { 
    page = 1, 
    limit = 100, 
    sortBy = 'floatid', // Ordenação padrão por float
    sortOrder = 'ASC',  // Float mais baixo (melhor) primeiro
    category,
    rarity,
    search,
    stattrak,
    souvenir
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Array para guardar as condições WHERE e os seus valores
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // Constrói a cláusula WHERE dinamicamente
  if (category && category !== 'All') {
    // ASSUMINDO que você tem uma coluna 'category_name' na sua tabela items
    whereClauses.push(`category_name = $${paramIndex++}`);
    queryParams.push(category);
  }
  if (rarity) {
    whereClauses.push(`rarity = $${paramIndex++}`);
    queryParams.push(rarity);
  }
  if (search) {
    // ASSUMINDO que você tem uma coluna 'market_hash_name'
    whereClauses.push(`market_hash_name ILIKE $${paramIndex++}`);
    queryParams.push(`%${search}%`); // ILIKE para pesquisa case-insensitive
  }
  if (stattrak === 'true') {
    whereClauses.push(`stattrak = true`);
  }
  if (souvenir === 'true') {
    whereClauses.push(`souvenir = true`);
  }
  
  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Validação simples para evitar SQL Injection no sortBy
  const allowedSortColumns = ['floatid', 'price', 'paintseed'];
  const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'floatid';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const query = `
    SELECT * FROM items
    ${whereString}
    ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;
  queryParams.push(limit, offset);

  // Query para contar o total de resultados (para sabermos o total de páginas)
  const countQuery = `SELECT COUNT(*) FROM items ${whereString}`;

  try {
    const itemsResult = await pool.query(query, queryParams);
    const totalResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 3)); // Usa apenas os params do WHERE
    
    const totalItems = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      items: itemsResult.rows,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems,
      }
    });
  } catch (err) {
    console.error('Erro ao buscar itens com paginação:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

module.exports = router;