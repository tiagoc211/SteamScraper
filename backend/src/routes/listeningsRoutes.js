// backend/src/routes/listeningsRoutes.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args)); // Para a API externa
const fetcher = require('../fetch.js'); // O seu fetcher para a Steam
const cheerio = require('cheerio');
const listingsDb = require('../db/listings.js');
const pool = require('../db/index.js');

const router = express.Router();

// --- LÓGICA DE TRADUÇÃO E MAPEAMENTO ---
let apiCache = null; // Cache para os dados da API ByMykel

/**
 * Busca e armazena em cache os dados da API ByMykel para mapeamento.
 */
async function getApiData() {
    if (apiCache) return apiCache;
    console.log("A buscar dados da API externa para mapeamento...");
    const res = await fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
    apiCache = await res.json();
    return apiCache;
}
getApiData(); // Pré-aquece o cache no arranque do servidor

/**
 * Encontra o item_id na sua tabela 'items' correspondente a um market_hash_name.
 * @param {string} marketHashName - O nome do item vindo do URL.
 * @returns {number | null} O ID do item na sua tabela, ou null se não for encontrado.
 */
async function findItemIdByMarketHashName(marketHashName) {
    const apiData = await getApiData();
    
    // 1. Encontra o item correspondente na API externa para obter o paint_index
    // A API 'skins.json' não tem o wear, então temos de o remover do nome
    const baseName = marketHashName.split(' (')[0].replace('StatTrak™ ', '').replace('Souvenir ', '').replace('★ ', '');
    
    const apiItem = apiData.find(item => item.name.replace('★ ', '') === baseName);

    if (!apiItem || !apiItem.paint_index) {
        console.warn(`Não foi possível encontrar o paint_index para '${marketHashName}' na API externa.`);
        return null;
    }

    // 2. Com o paint_index, procura na sua tabela 'items'
    // ASSUME que a combinação de 'defindex' e 'paintindex' é única
    const itemQuery = 'SELECT a FROM items WHERE paintindex = $1 LIMIT 1';
    const { rows } = await pool.query(itemQuery, [apiItem.paint_index]);

    if (rows.length > 0) {
        return rows[0].a; // Retorna o ID (coluna 'a')
    }
    
    console.warn(`Nenhum item encontrado na sua BD com paintindex: ${apiItem.paint_index}`);
    return null;
}


// --- LÓGICA DE SCRAPE E GRAVAÇÃO ---

async function processAndSaveListings(data, marketHashName) {
    if (!data || !data.results_html) return;

    // A nova lógica de tradução entra aqui!
    const itemId = await findItemIdByMarketHashName(marketHashName);
    if (!itemId) {
        console.warn(`Não foi possível associar '${marketHashName}' a um item_id. Listings não serão guardados.`);
        return;
    }

    const $ = cheerio.load(data.results_html);
    const listingsToSave = [];

    $('.market_listing_row').each((_, el) => {
        const $el = $(el);
        const listingid = $el.attr('id')?.replace('listing_', '');
        if (!listingid) return;

        const listingInfo = data.listinginfo?.[listingid];
        if (!listingInfo) return;
        
        const assetInfo = listingInfo.asset?.id ? data.assets?.[730]?.[listingInfo.asset.contextid || '2']?.[listingInfo.asset.id] : null;
        
        listingsToSave.push({
            listing_id: listingid,
            item_id: itemId,
            price: listingInfo.converted_price,
            fee: listingInfo.converted_fee,
            float_value: null, // O float requereria uma chamada de inspeção separada e mais complexa
            paint_seed: null,
            inspect_link: $el.find('.market_listing_row_action a').attr('href'),
            stickers: assetInfo?.descriptions?.find(d => d.value.includes('sticker_info'))?.value.match(/src="([^"]+)"/g)?.map(s => s.slice(5, -1)) || null,
        });
    });

    if (listingsToSave.length > 0) {
        await listingsDb.upsertListings(listingsToSave);
    }
}

// --- ROTAS ---

// ROTA PARA A PÁGINA DE DETALHES (SkinDetailPage)
// Continua a fazer scrape e a devolver em tempo real, mas agora guarda os resultados.
router.get('/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    
    if (!firstPageData || !firstPageData.success) {
      return res.status(503).json({ success: false, message: 'Erro ao obter dados da Steam.' });
    }

    // Tenta guardar os dados em segundo plano, sem bloquear a resposta.
    processAndSaveListings(firstPageData, marketHashName).catch(console.error);
    
    // Devolve os dados do scrape diretamente para o frontend, como antes.
    const listings = parseListingsForFrontend(firstPageData);
    const totalListings = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalListings / 100);
    
    res.json({ success: true, marketHashName, listings, pagination: { totalPages, totalListings }});
});

// A sua função de parse que envia os dados para o frontend (pode ser diferente da que guarda)
function parseListingsForFrontend(data) {
    if (!data || !data.results_html) return [];
    const listings = [];
    const $ = cheerio.load(data.results_html);
    $('.market_listing_row').each((_, el) => {
        const $el = $(el);
        const listingid = $el.attr('id')?.replace('listing_', '');
        if (!listingid) return;
        
        const name = $el.find('.market_listing_item_name').text().trim();
        const priceText = $el.find('.market_listing_price_with_fee').text().trim();
        const image = $el.find('img.market_listing_item_img').attr('src');
        const inspectLink = $el.find('.market_listing_row_action a').attr('href');
        
        listings.push({ listingid, name, priceText, image, inspectLink });
    });
    return listings;
}

// A rota de paginação também precisa de ser ajustada
router.get('/:marketHashName/page/:pageNumber', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageNumber = parseInt(req.params.pageNumber, 10);
    
    const pageData = await fetcher.fetchSpecificPage(marketHashName, pageNumber);
    
    if (!pageData || !pageData.success) {
        return res.status(503).json({ success: false, message: `Erro ao obter a página ${pageNumber}` });
    }

    processAndSaveListings(pageData, marketHashName).catch(console.error);

    const listings = parseListingsForFrontend(pageData);
    res.json({ success: true, listings });
});

module.exports = router;