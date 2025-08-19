require('dotenv').config();
console.log('STEAM_API_KEY =', process.env.STEAM_API_KEY); // para testar
const express = require('express');
const cors = require('cors');
const setupSteamAuth = require('./auth/steam');
const cheerio = require('cheerio');
const fetcher = require('./fetch');
const fs = require('fs/promises');
const crypto = require('crypto');
const NodeCache = require('node-cache');

// Cache com TTL (Time To Live) de 5 minutos (300 segundos)
const skinCache = new NodeCache({ stdTTL: 300 });

async function startServer() {
  await fetcher.ready;

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // frontend
  credentials: true
}));


//Steam Auth ----------------

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));


setupSteamAuth(app);

const PORT = 3001;

const ISSUER = 'http://localhost:3001';
const AUDIENCE = 'steamscraper-extension';

async function loadPrivateKey() {
  const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
  const { importJWK } = await import('jose');
  return await importJWK(privJwk, 'ES256');
}

  // --- ROTA DE BUSCA (sem alterações) ---
  app.get('/api/search', async (req, res) => {
    // ... (código desta rota continua igual)
  });

  // --- ROTA DE SKIN PRINCIPAL (AGORA SÓ DEVOLVE A 1ª PÁGINA) ---
  app.get('/api/skin/:marketHashName', async (req, res) => {
    const { marketHashName } = req.params;
    const cacheKey = `firstpage_${marketHashName}`;

    if (skinCache.has(cacheKey)) {
      console.log(`✔️  [Cache] A servir a primeira página de ${marketHashName}`);
      return res.json(skinCache.get(cacheKey));
    }

    console.log(`🔥 [Fetch] A obter a primeira página de ${marketHashName}`);
    const firstPageData = await fetcher.fetchFirstPage(decodeURIComponent(marketHashName));

    if (firstPageData === null) {
      return res.status(500).json({ success: false, message: 'Erro crítico ao obter os dados da Steam' });
    }

    const listings = parseListings(firstPageData);
    const totalPages = Math.ceil((firstPageData.total_count || 0) / 100);

    const responseData = {
      success: true,
      marketHashName: decodeURIComponent(marketHashName),
      listings: listings,
      pagination: {
        currentPage: 1,
        totalPages: totalPages,
        totalListings: firstPageData.total_count
      }
    };

    skinCache.set(cacheKey, responseData);
    res.json(responseData);
  });

  // --- NOVA ROTA PARA PAGINAÇÃO ---
  app.get('/api/skin/:marketHashName/page/:pageNumber', async (req, res) => {
    const { marketHashName, pageNumber } = req.params;
    const pageNum = parseInt(pageNumber, 10);
    const cacheKey = `page_${marketHashName}_${pageNumber}`;

    if (isNaN(pageNum) || pageNum <= 1) {
      return res.status(400).json({ success: false, message: 'Número de página inválido.' });
    }

    if (skinCache.has(cacheKey)) {
      console.log(`✔️  [Cache] A servir a página ${pageNumber} de ${marketHashName}`);
      return res.json(skinCache.get(cacheKey));
    }

    console.log(`🔥 [Fetch] A obter a página ${pageNumber} de ${marketHashName}`);
    const pageData = await fetcher.fetchSpecificPage(decodeURIComponent(marketHashName), pageNum);

    if (pageData === null) {
      return res.status(500).json({ success: false, message: `Erro ao obter a página ${pageNum}` });
    }

    const listings = parseListings(pageData);
    const responseData = { success: true, listings };

    skinCache.set(cacheKey, responseData);
    res.json(responseData);
  });

  // ... (rota /api/tokens/buy continua igual)

  app.listen(PORT, () => console.log(`Backend a correr em http://localhost:${PORT}`));
}

// --- FUNÇÃO AUXILIAR PARA PARSE DE LISTINGS ---
function parseListings(data) {
    if (!data || !data.results_html) return [];

    const $ = cheerio.load(data.results_html);
    const listings = [];
    $('.market_listing_row').each((_, el) => {
        const $el = $(el);
        const listingid = $el.attr('id')?.replace('listing_', '');
        const name = $el.find('.market_listing_item_name').text().trim();
        const price = $el.find('.market_listing_price_with_fee').text().trim();
        const image = $el.find('img.market_listing_item_img').attr('src');
        const inspectLink = $el.find('.market_listing_row_action a').attr('href');
        const li = listingid ? data.listinginfo?.[listingid] : null;
        const subtotalCents = Number.isInteger(li?.price) ? li.price : null;
        const feeCents = Number.isInteger(li?.fee) ? li.fee : null;
        const totalCents = (Number.isInteger(subtotalCents) && Number.isInteger(feeCents)) ? (subtotalCents + feeCents) : null;
        const currency = li?.currencyid ?? null;
        let rawAsset = null;
        const assetId = li?.asset?.id;
        const contextId = li?.asset?.contextid || '2';
        if (assetId) rawAsset = data.assets?.[730]?.[contextId]?.[assetId] ?? null;
        const priceNumber = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.'));
        const stickerImgs = [];
        $el.find('#sticker_info img').each((_, img) => {
          const src = $(img).attr('src');
          if (src) stickerImgs.push(src);
        });
        const keychains = [];
        $el.find('#keychain_info img').each((_, img) => {
          const src = $(img).attr('src');
          if (src) keychains.push({ image_url: src });
        });
        listings.push({ listingid, name, price: li?.price ? (li.price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : null, priceNumber, image, inspectLink, stickers: stickerImgs.length > 0 ? stickerImgs : null, keychains: keychains.length > 0 ? keychains : null, buy: { currency, subtotalCents, feeCents, totalCents }, raw: rawAsset });
    });
    return listings;
}

startServer();