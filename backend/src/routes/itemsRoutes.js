// backend/src/routes/itemsRoutes.js
const express = require('express');
const pool = require('../db/index.js');

const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    // Busca as 20 skins mais recentes baseadas no scraped_at
    const query = `
      SELECT 
        listing_id, 
        market_hash_name, 
        icon_url, 
        price, 
        float_value, 
        paint_seed,
        stickers,
        keychains,
        scraped_at,
        NULL as rarity_name,
        NULL as rarity_color
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

  console.log(`📊 Browse request - Page: ${page}, Category: ${category || 'All'}, Search: ${search || 'none'}`);

  const offset = (page - 1) * limit;
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // Filtro de busca por nome
  if (search) {
    whereClauses.push(`market_hash_name ILIKE $${paramIndex++}`);
    queryParams.push(`%${search}%`);
  }

  // Filtro de categoria baseado em padrões do nome
  if (category && category !== 'All') {
    const categoryPatterns = {
      'Rifles': [
        'AK-47', 'M4A4', 'M4A1-S', 'AWP', 'AUG', 'SG 553', 'SSG 08', 
        'SCAR-20', 'G3SG1', 'Galil AR', 'FAMAS'
      ],
      'Pistols': [
        'Glock-18', 'USP-S', 'P2000', 'P250', 'Five-SeveN', 'Tec-9', 
        'CZ75-Auto', 'Desert Eagle', 'R8 Revolver', 'Dual Berettas'
      ],
      'SMGs': [
        'MP9', 'MAC-10', 'MP7', 'MP5-SD', 'UMP-45', 'P90', 'PP-Bizon'
      ],
      'Heavy': [
        'Nova', 'XM1014', 'Sawed-Off', 'MAG-7', 'M249', 'Negev'
      ],
      'Knives': [
        'Karambit', 'Bayonet', 'Butterfly', 'Flip Knife', 'Gut Knife', 
        'Falchion Knife', 'Shadow Daggers', 'Bowie Knife', 'Huntsman Knife',
        'M9 Bayonet', 'Ursus Knife', 'Navaja Knife', 'Stiletto Knife',
        'Talon Knife', 'Classic Knife', 'Paracord Knife', 'Survival Knife',
        'Nomad Knife', 'Skeleton Knife', 'Kukri Knife'
      ],
      'Gloves': [
        'Hand Wraps', 'Driver Gloves', 'Sport Gloves', 'Specialist Gloves',
        'Moto Gloves', 'Bloodhound Gloves', 'Hydra Gloves', 'Broken Fang Gloves'
      ]
    };

    const patterns = categoryPatterns[category];
    if (patterns) {
      const categoryConditions = patterns.map(pattern => {
        queryParams.push(`%${pattern}%`);
        return `market_hash_name ILIKE $${paramIndex++}`;
      });
      whereClauses.push(`(${categoryConditions.join(' OR ')})`);
    }
  }

  // Filtro de StatTrak
  if (stattrak === 'true' || stattrak === true) {
    whereClauses.push(`market_hash_name ILIKE '%StatTrak™%'`);
  }

  // Filtro de Souvenir
  if (souvenir === 'true' || souvenir === true) {
    whereClauses.push(`market_hash_name ILIKE '%Souvenir%'`);
  }
  
  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const allowedSortColumns = { price: 'price', floatid: 'float_value', paintseed: 'paint_seed' };
  const safeSortBy = allowedSortColumns[sortBy] || 'price';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // QUERY SIMPLIFICADA - SEM JOIN (mas adicionamos colunas NULL para rarity por agora)
  const query = `
    SELECT 
      listing_id,
      market_hash_name,
      icon_url,
      price,
      float_value,
      paint_seed,
      stickers,
      keychains,
      inspect_link,
      scraped_at,
      NULL as rarity_name,
      NULL as rarity_color
    FROM listings
    ${whereString}
    ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST
    LIMIT $${paramIndex++}
    OFFSET $${paramIndex++}
  `;
  queryParams.push(limit, offset);

  const countQuery = `SELECT COUNT(*) FROM listings ${whereString}`;
  // countQueryParams = todos os parâmetros EXCETO os últimos 2 (limit e offset)
  const countQueryParams = queryParams.slice(0, -2);

  try {
    const itemsResult = await pool.query(query, queryParams);
    const totalResult = await pool.query(countQuery, countQueryParams);
    
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

// ROTA PARA BUSCAR AS ARMAS MAIS CARAS
router.get('/most-expensive', async (req, res) => {
  const { getMostExpensiveItems } = require('../db/listings.js');
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const items = await getMostExpensiveItems(limit);
    res.json({ success: true, items });
  } catch (err) {
    console.error('Erro ao buscar armas mais caras:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar armas mais caras.' });
  }
});

module.exports = router;