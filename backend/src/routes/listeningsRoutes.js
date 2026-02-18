// backend/src/routes/listeningsRoutes.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const fetcher = require('../fetch.js');
const cheerio = require('cheerio');
const listingsDb = require('../db/listings.js');
const listingCleanup = require('../db/listingCleanup.js');
const pool = require('../db/index.js');

const router = express.Router();

// --- FUNÇÃO AUXILIAR DE MAPEAMENTO (PARA ENCONTRAR O item_id) ---
let apiCache = null;
async function getApiData() {
    if (apiCache) return apiCache;
    console.log("A buscar dados da API externa para mapeamento de paint_index...");
    const res = await fetch('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
    apiCache = await res.json();
    return apiCache;
}
getApiData();

async function findItemIdByMarketHashName(marketHashName) {
    const apiData = await getApiData();
    const baseName = marketHashName.split(' (')[0].replace(/StatTrak™ |Souvenir |★ /g, '');
    const apiItem = apiData.find(item => item.name.replace('★ ', '') === baseName);
    if (!apiItem || !apiItem.paint_index) {
        console.warn(`Não foi possível encontrar o paint_index para '${marketHashName}' na API externa.`);
        return null;
    }
    const { rows } = await pool.query('SELECT a FROM items WHERE paintindex = $1 LIMIT 1', [apiItem.paint_index]);
    return rows.length > 0 ? rows[0].a : null;
}

/**
 * Função MESTRA: Extrai os dados da Steam, formata para o frontend E para a base de dados.
 */
async function parseAndProcessSteamData(steamData, marketHashName) {
    if (!steamData || !steamData.results_html) {
        return { forFrontend: [], forDatabase: [] };
    }

    const $ = cheerio.load(steamData.results_html);
    const listingsForFrontend = [];
    const listingsForDatabase = [];

    for (const el of $('.market_listing_row').toArray()) {
        const $el = $(el);
        const listingid = $el.attr('id')?.replace('listing_', '');
        if (!listingid) continue;

        const listingInfo = steamData.listinginfo?.[listingid];
        if (!listingInfo) continue;
        
        const assetInfo = listingInfo.asset?.id ? steamData.assets?.[730]?.[listingInfo.asset.contextid || '2']?.[listingInfo.asset.id] : null;

        const inspectLink = $el.find('.market_listing_row_action a').attr('href');
        let floatData = {};
        if (inspectLink) {
            try {
                const inspectRes = await fetch(`${process.env.FLOAT_INSPECT_URL}/?url=${encodeURIComponent(inspectLink)}`, {
                    timeout: 5000 // 5 segundos de timeout
                });
                if (inspectRes.ok) {
                    const jsonData = await inspectRes.json();
                    floatData = jsonData.iteminfo || {};
                    if (floatData.floatvalue) {
                        console.log(`✓ Float obtido para ${listingid}: ${floatData.floatvalue}`);
                    }
                } else {
                    console.warn(`⚠️ Serviço de inspect retornou status ${inspectRes.status} para listing ${listingid}`);
                }
            } catch (e) {
                if (listingid === Object.keys(steamData.listinginfo)[0]) {
                    // Só mostra o erro completo uma vez por página
                    console.error(`❌ FLOAT_INSPECT_URL (${process.env.FLOAT_INSPECT_URL}) não está acessível!`);
                    console.error(`   Configure um serviço de inspect local ou use uma API pública.`);
                    console.error(`   Erro: ${e.message}`);
                }
            }
        }

        const stickers = assetInfo?.descriptions?.find(d => d.value.includes('sticker_info'))?.value.match(/<img.*?src="([^"]+)" title="([^"]+)">/g)?.map(tag => ({
            name: tag.match(/title="([^"]+)"/)?.[1] || 'Sticker',
            img: tag.match(/src="([^"]+)"/)?.[1] || ''
        })) || [];
        
        const keychains = assetInfo?.descriptions?.find(d => d.value.includes('keychain_info'))?.value.match(/<img.*?src="([^"]+)" title="([^"]+)">/g)?.map(tag => ({
            name: tag.match(/title="([^"]+)"/)?.[1] || 'Charm',
            image_url: tag.match(/src="([^"]+)"/)?.[1] || ''
        })) || [];

        // 1. Formato para o frontend (SkinDetailPage)
        listingsForFrontend.push({
            listingid,
            name: marketHashName, // Nome completo
            priceNumber: (listingInfo.converted_price + listingInfo.converted_fee) / 100,
            image: $el.find('img.market_listing_item_img').attr('src'),
            inspectLink,
            stickers: stickers.map(s => s.img),
            keychains: keychains,
            raw: { ...assetInfo, ...floatData, name: marketHashName, stickers: stickers },
            buy: {
                subtotalCents: listingInfo.converted_price,
                feeCents: listingInfo.converted_fee,
                totalCents: listingInfo.converted_price + listingInfo.converted_fee
            }
        });

        // 2. Formato para guardar na base de dados (só se tiver float)
        if (floatData.floatvalue != null && floatData.paintseed != null) {
            listingsForDatabase.push({
                listing_id: listingid,
                price: listingInfo.converted_price + listingInfo.converted_fee,
                fee: listingInfo.converted_fee,
                float_value: floatData.floatvalue,
                paint_seed: floatData.paintseed,
                stickers: stickers.length > 0 ? JSON.stringify(stickers) : null,
                keychains: keychains.length > 0 ? JSON.stringify(keychains) : null,
                inspect_link: inspectLink,
                market_hash_name: marketHashName,
                icon_url: assetInfo?.icon_url || null
            });
        }
    }

    return { listingsForFrontend, listingsForDatabase };
}


// ROTA PRINCIPAL - /api/skin/:marketHashName
router.get('/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    
    try {
        const steamData = await fetcher.fetchFirstPage(marketHashName);
        if (!steamData || !steamData.success) {
            return res.status(503).json({ success: false, message: 'Erro ao obter dados da Steam.' });
        }
        
        const { listingsForFrontend, listingsForDatabase } = await parseAndProcessSteamData(steamData, marketHashName);
        
        if (listingsForDatabase.length > 0) {
            console.log(`💾 Guardando ${listingsForDatabase.length} listings com float na BD...`);
            findItemIdByMarketHashName(marketHashName).then(itemId => {
                if (itemId) {
                    const listingsWithId = listingsForDatabase.map(l => ({ ...l, item_id: itemId }));
                    const minPriceDb = Math.min(...listingsWithId.map(l => l.price));
                    listingCleanup.processListingChanges(marketHashName, listingsWithId, minPriceDb)
                        .catch(err => console.error('Erro no cleanup:', err));
                    listingsDb.upsertListings(listingsWithId).catch(console.error);
                } else {
                    console.warn(`⚠️ Item ID não encontrado para '${marketHashName}'.`);
                }
            }).catch(console.error);
        } else {
            console.warn(`⚠️ Nenhum listing com float foi obtido.`);
        }

        // SE TIVERMOS FILTROS NA QUERY, IGNORAMOS O RESULTADO DA STEAM E VAMOS À BD
        const { minPrice, maxPrice, minFloat, maxFloat, paintSeed, page, sortBy: sortByParam } = req.query;
        const hasFilters = minPrice || maxPrice || minFloat || maxFloat || paintSeed || (page && parseInt(page) > 1);

        if (hasFilters) {
             const itemId = await findItemIdByMarketHashName(marketHashName);
             if (itemId) {
                 const dbData = await listingsDb.getListingsByItemId(itemId, {
                     page: parseInt(page) || 1,
                     limit: 100,
                     sortBy: sortByParam || 'price',
                     minPrice, maxPrice, minFloat, maxFloat, paintSeed
                 });

                 // Mapeia de volta para o formato de frontend
                 const mappedListings = dbData.listings.map(dbItem => ({
                    listingid: dbItem.listing_id,
                    name: dbItem.market_hash_name,
                    priceNumber: dbItem.price / 100.0, // Preço na BD está em centavos
                    image: `https://community.akamai.steamstatic.com/economy/image/${dbItem.icon_url}`,
                    inspectLink: dbItem.inspect_link,
                    stickers: dbItem.stickers ? (typeof dbItem.stickers === 'string' ? JSON.parse(dbItem.stickers) : dbItem.stickers).map(s => s.img) : [],
                    keychains: dbItem.keychains ? (typeof dbItem.keychains === 'string' ? JSON.parse(dbItem.keychains) : dbItem.keychains) : [],
                    raw: {
                        rarity_name: null, // Se necessário buscar da tabela items
                        floatvalue: dbItem.float_value,
                        paintseed: dbItem.paint_seed,
                        icon_url: dbItem.icon_url
                    }
                 }));

                 return res.json({
                     success: true,
                     marketHashName,
                     listings: mappedListings,
                     pagination: dbData.pagination,
                     source: 'database_filtered'
                 });
             }
        }

        res.json({ 
            success: true, 
            marketHashName, 
            listings: listingsForFrontend,
            pagination: { 
                totalPages: Math.ceil((steamData.total_count || 0) / 100), 
                totalListings: steamData.total_count || 0 
            }
        });

    } catch (err) {
        console.error(`Erro na rota /skin/${marketHashName}:`, err);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});


module.exports = router;