// backend/src/routes/itemsRoutes.js
const express = require('express');
const pool = require('../db/index.js');
const riflesData = require('../../../frontend/src/data/Rifles.js');
const pistolsData = require('../../../frontend/src/data/Pistols.js');
const smgsData = require('../../../frontend/src/data/Smgs.js');
const heavyData = require('../../../frontend/src/data/Heavy.js');
const knivesData = require('../../../frontend/src/data/Knives.js');

const router = express.Router();

const rarityIdToKey = {
  '1': 'Consumer',
  '2': 'Industrial',
  '3': 'MilSpec',
  '4': 'Restricted',
  '5': 'Classified',
  '6': 'Covert',
  '7': 'Contraband'
};

const rarityKeyAliases = {
  Consumer: ['Consumer'],
  Industrial: ['Industrial'],
  MilSpec: ['MilSpec', 'Mil-Spec', 'Milspec'],
  Restricted: ['Restricted'],
  Classified: ['Classified'],
  Covert: ['Covert'],
  Contraband: ['Contraband']
};

const normalizeSkinName = (name = '') =>
  name
    .replace(/^StatTrak™\s+/i, '')
    .replace(/^Souvenir\s+/i, '')
    .replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i, '')
    .trim();

const collectSkinNamesByRarity = (node, rarityNameSet) => {
  if (!node || typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node)) {
    const isTargetRarity = rarityNameSet.has(key) && Array.isArray(value);

    if (isTargetRarity) {
      for (const item of value) {
        if (item && typeof item.name === 'string') {
          const normalized = normalizeSkinName(item.name);
          if (normalized) rarityNameSet.__results.add(normalized);
        }
      }
      continue;
    }

    if (value && typeof value === 'object') {
      collectSkinNamesByRarity(value, rarityNameSet);
    }
  }
};

const buildRaritySkinIndex = () => {
  const dataModules = [riflesData, pistolsData, smgsData, heavyData, knivesData];
  const index = {};

  Object.keys(rarityKeyAliases).forEach((rarityKey) => {
    const rarityNames = new Set(rarityKeyAliases[rarityKey]);
    rarityNames.__results = new Set();

    for (const dataModule of dataModules) {
      collectSkinNamesByRarity(dataModule, rarityNames);
    }

    index[rarityKey] = rarityNames.__results;
  });

  return index;
};

const raritySkinIndex = buildRaritySkinIndex();

const normalizedMarketNameSql = `
  regexp_replace(
    regexp_replace(
      regexp_replace(market_hash_name, '^StatTrak™\\s+', ''),
      '^Souvenir\\s+',
      ''
    ),
    ' \\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\\)$',
    ''
  )
`;

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

  // Filtro de Rarity (baseado nas raridades oficiais de CS)
  if (rarity) {
    const rarityKey = rarityIdToKey[String(rarity)];

    if (rarityKey) {
      const namesForRarity = Array.from(raritySkinIndex[rarityKey] || []);
      const isCovert = rarityKey === 'Covert';
      const knifeAndGlovePatterns = [
        '%Knife%', '%Karambit%', '%Bayonet%', '%Butterfly%', '%Flip Knife%', '%Gut Knife%',
        '%Falchion Knife%', '%Shadow Daggers%', '%Bowie Knife%', '%Huntsman Knife%',
        '%M9 Bayonet%', '%Ursus Knife%', '%Navaja Knife%', '%Stiletto Knife%', '%Talon Knife%',
        '%Classic Knife%', '%Paracord Knife%', '%Survival Knife%', '%Nomad Knife%',
        '%Skeleton Knife%', '%Kukri Knife%',
        '%Gloves%', '%Hand Wraps%', '%Driver Gloves%', '%Sport Gloves%', '%Specialist Gloves%',
        '%Moto Gloves%', '%Bloodhound Gloves%', '%Hydra Gloves%', '%Broken Fang Gloves%'
      ];

      if (namesForRarity.length === 0 && !isCovert) {
        whereClauses.push('1 = 0');
      } else {
        const rarityNameParamIndex = paramIndex++;
        queryParams.push(namesForRarity);

        if (isCovert) {
          const knifeGloveConditions = knifeAndGlovePatterns.map(() => `market_hash_name ILIKE $${paramIndex++}`);
          queryParams.push(...knifeAndGlovePatterns);

          whereClauses.push(
            `(${normalizedMarketNameSql} = ANY($${rarityNameParamIndex}) OR ${knifeGloveConditions.join(' OR ')})`
          );
        } else {
          whereClauses.push(`${normalizedMarketNameSql} = ANY($${rarityNameParamIndex})`);
        }
      }
    }
  }
  
  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const allowedSortColumns = { 
    price: 'price', 
    floatid: 'float_value', 
    paintseed: 'paint_seed',
    checkedtime: 'scraped_at'
  };
  const safeSortBy = allowedSortColumns[sortBy] || 'price';
  const safeSortOrder = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const effectiveSortOrder =
    safeSortBy === 'scraped_at'
      ? (safeSortOrder === 'ASC' ? 'DESC' : 'ASC')
      : safeSortOrder;

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
    ORDER BY ${safeSortBy} ${effectiveSortOrder} NULLS LAST, listing_id DESC
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

// ROTA PARA BUSCAR ARMAS ALEATÓRIAS
router.get('/random', async (req, res) => {
  const { getRandomItems } = require('../db/listings.js');
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const items = await getRandomItems(limit);
    res.json({ success: true, items });
  } catch (err) {
    console.error('Erro ao buscar armas aleatórias:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar armas aleatórias.' });
  }
});

module.exports = router;