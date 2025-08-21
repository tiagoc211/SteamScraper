// --- server.js (Versão Final Modular) ---

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const session = require('express-session');

// --- MÓDULOS LOCAIS ---
const fetcher = require('./fetch');
const setupSteamAuth = require('./auth/steam');

// --- CONFIGURAÇÃO ---
const PORT = 3001;
const skinCache = new NodeCache({ stdTTL: 300 });
const metaCache = new NodeCache({ stdTTL: 3600 });
const ISSUER = 'http://localhost:3001';
const AUDIENCE = 'steamscraper-extension';

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  await fetcher.ready;

  const app = express();
  app.use(cors({
    origin: 'http://localhost:3000', // URL do teu frontend
    credentials: true
  }));
  app.use(express.json());

  // --- CONFIGURAÇÃO DE SESSÃO ---
  // É importante que isto venha antes do setupSteamAuth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' } // Em produção, usa true com HTTPS
  }));

  // --- INICIALIZA A AUTENTICAÇÃO STEAM A PARTIR DO TEU FICHEIRO ---
  setupSteamAuth(app);
  
  // --- CARREGAR CHAVE PRIVADA PARA TOKENS DE COMPRA ---
  let privateKey;
  let SignJWT;
  try {
    const jose = await import('jose');
    SignJWT = jose.SignJWT;
    const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
    privateKey = await jose.importJWK(privJwk, 'ES256');
    console.log('🔑 Chave privada para tokens de compra carregada com sucesso.');
  } catch (err) {
    console.error('❌ ERRO CRÍTICO: Não foi possível carregar "jose" ou a chave privada.', err.message);
  }

  // --- ROTAS DA API DE SKINS ---
  app.get('/api/search', async (req, res) => {
    const { query, start = 0, count = 10 } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'O parâmetro "query" é obrigatório.' });
    const searchData = await fetcher.fetchSearchPage(query, start, count);
    if (searchData && searchData.success) res.json(searchData);
    else res.status(503).json({ success: false, message: 'Não foi possível obter os resultados da busca na Steam.' });
  });

  app.get('/api/skin/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageCacheKey = `page_1_${marketHashName}`;
    if (skinCache.has(pageCacheKey)) return res.json(skinCache.get(pageCacheKey));
    
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    if (!firstPageData || !firstPageData.success) return res.status(500).json({ success: false, message: 'Erro crítico ao obter os dados da Steam.' });

    const listings = parseListings(firstPageData);
    const totalListings = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalListings / 100);
    metaCache.set(`meta_${marketHashName}`, { totalPages, totalListings });

    const responseData = { success: true, marketHashName, listings, pagination: { currentPage: 1, totalPages, totalListings }};
    skinCache.set(pageCacheKey, responseData);
    res.json(responseData);
  });

  app.get('/api/skin/:marketHashName/page/:pageNumber', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageNumber = req.params.pageNumber;
    const pageCacheKey = `page_${pageNumber}_${marketHashName}`;

    if (skinCache.has(pageCacheKey)) return res.json(skinCache.get(pageCacheKey));

    const pageData = await fetcher.fetchSpecificPage(marketHashName, parseInt(pageNumber, 10));
    if (!pageData || !pageData.success) return res.status(500).json({ success: false, message: `Erro ao obter a página ${pageNumber}` });
    
    const listings = parseListings(pageData);
    const responseData = { success: true, listings };
    skinCache.set(pageCacheKey, responseData);
    res.json(responseData);
  });

  // --- ROTA PARA GERAR TOKENS DE COMPRA ---
  app.post('/api/tokens/buy', async (req, res) => {
    if (!privateKey || !SignJWT) return res.status(500).json({ error: 'Serviço de tokens indisponível.' });
    
    try {
      const { steamUrl, listingId, maxPriceCents, itemName } = req.body || {};
      if (typeof steamUrl !== 'string' || typeof listingId !== 'string' || !Number.isInteger(maxPriceCents) || maxPriceCents <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos.' });
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const token = await new SignJWT({ steamUrl, listingId, maxPriceCents, itemName, nonce })
        .setProtectedHeader({ alg: 'ES256', kid: 'steam-buy-key-1' })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(privateKey);
      res.json({ token, exp: Date.now() + 60 * 1000 });
    } catch (err) {
      console.error('❌ Erro ao gerar token de compra:', err);
      res.status(500).json({ error: 'Falha a gerar token de compra.' });
    }
  });

  app.listen(PORT, () => console.log(`🚀 Backend a correr em http://localhost:${PORT}`));
}

// --- FUNÇÃO AUXILIAR PARA PARSE ---
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