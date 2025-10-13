const express = require('express');
const fetcher = require('../fetch.js'); // Ajusta o path se necessário
const cheerio = require('cheerio');
const searchUsageDb = require('../db/searchUsage.js');
console.log('searchUsageDb =', searchUsageDb);
const ensureAuthenticated = require('../middleware/authMiddleware.js');

const router = express.Router();

function parseListings(data) {
    if (!data || !data.results_html) return [];
    const $ = cheerio.load(data.results_html);
    const listings = [];
    $('.market_listing_row').each((_, el) => {
        const $el = $(el);
        const listingid = $el.attr('id')?.replace('listing_', '');
        if (!listingid) return;

        const name = $el.find('.market_listing_item_name').text().trim();
        const priceText = $el.find('.market_listing_price_with_fee').text().trim();
        const image = $el.find('img.market_listing_item_img').attr('src');
        const inspectLink = $el.find('.market_listing_row_action a').attr('href');
        
        const listingInfo = data.listinginfo?.[listingid];
        const assetInfo = listingInfo?.asset?.id ? data.assets?.[730]?.[listingInfo.asset.contextid || '2']?.[listingInfo.asset.id] : null;

        const priceNumber = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));

        const stickerImgs = [];
        $el.find('#sticker_info img, .market_listing_sticker_images img').each((_, img) => {
          const src = $(img).attr('src');
          if (src) stickerImgs.push(src);
        });

        const keychains = [];
        $el.find('#keychain_info img, .market_listing_keychain_images img').each((_, img) => {
          const src = $(img).attr('src');
          if (src) keychains.push({ image_url: src });
        });

        listings.push({
            listingid, name,
            price: listingInfo?.price ? (listingInfo.price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : null,
            priceNumber, image, inspectLink,
            stickers: stickerImgs.length > 0 ? stickerImgs : null,
            keychains: keychains.length > 0 ? keychains : null,
            buy: {
                subtotalCents: listingInfo?.price,
                feeCents: listingInfo?.fee,
                totalCents: (listingInfo?.price != null && listingInfo?.fee != null) ? (listingInfo.price + listingInfo.fee) : null,
                currency: listingInfo?.currencyid
            },
            raw: assetInfo
        });
    });
    return listings;
}

// --- ROTAS ---

router.get('/limitado/:marketHashName', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;
    const marketHashName = decodeURIComponent(req.params.marketHashName);

    // 1️⃣ Obter limites do plano
    console.log("🧩 userId recebido no router:", userId);

    const limits = await searchUsageDb.getUserLimits(userId);
    if (!limits)
      return res.status(403).json({ success: false, message: 'Nenhum plano ativo encontrado.' });

    const { max_searches_per_day, max_results_per_search } = limits;

    // 2️⃣ Garantir registo diário e validar limite
    await searchUsageDb.ensureUserUsage(userId);
    const usedToday = await searchUsageDb.getUserUsage(userId);
    if (usedToday >= max_searches_per_day)
      return res.status(429).json({ success: false, message: 'Limite diário de pesquisas atingido.' });

    // 3️⃣ Incrementar uso
    await searchUsageDb.incrementSearchUsage(userId);

    // 4️⃣ Fazer o scrape normal (sem alterar tua lógica)
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    if (!firstPageData || !firstPageData.success) {
      return res.status(503).json({ success: false, message: 'Erro ao obter dados da Steam.' });
    }

    // 5️⃣ Aplicar limite de resultados
    const listings = parseListings(firstPageData).slice(0, max_results_per_search);
    const totalListings = Math.min(firstPageData.total_count || 0, max_results_per_search);
    const totalPages = Math.ceil(totalListings / 100);

    // 6️⃣ Resposta
    res.json({
      success: true,
      marketHashName,
      listings,
      pagination: { totalPages, totalListings },
      usage: {
        used_today: usedToday + 1,
        remaining: Math.max(0, max_searches_per_day - (usedToday + 1)),
        limit_per_day: max_searches_per_day,
        limit_results: max_results_per_search
      }
    });

  } catch (err) {
    console.error('Erro no endpoint /limitado:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao processar a pesquisa limitada.' });
  }
});

router.get('/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    if (!firstPageData || !firstPageData.success) {
      return res.status(503).json({ success: false, message: 'Erro crítico ao obter os dados da Steam.' });
    }

    const listings = parseListings(firstPageData);
    const totalListings = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalListings / 100);
    
    res.json({ success: true, marketHashName, listings, pagination: { totalPages, totalListings }});
});

router.get('/:marketHashName/page/:pageNumber', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageNumber = parseInt(req.params.pageNumber, 10);
    const pageData = await fetcher.fetchSpecificPage(marketHashName, pageNumber);
    if (!pageData || !pageData.success) {
        return res.status(503).json({ success: false, message: `Erro ao obter a página ${pageNumber}` });
    }

    const listings = parseListings(pageData);
    res.json({ success: true, listings });
});



module.exports = router;
