// --- server.js (Versão Final Modular e Completa) ---

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
const setupSteamAuth = require('./auth/steam'); // Certifique-se que este ficheiro existe

// --- CONFIGURAÇÃO ---
const PORT = 3001;
const skinCache = new NodeCache({ stdTTL: 300 });
const ISSUER = 'http://localhost:3001';
const AUDIENCE = 'steamscraper-extension';

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  await fetcher.ready;

  const app = express();
  app.use(cors({
    origin: 'http://localhost:3000', // URL do seu frontend
    credentials: true
  }));
  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key-for-session',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' } // Em produção, usar 'true' com HTTPS
  }));

  setupSteamAuth(app);
  
  let privateKey;
  let SignJWT;
  try {
    const jose = await import('jose');
    SignJWT = jose.SignJWT;
    const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
    privateKey = await jose.importJWK(privJwk, 'ES256');
    console.log('🔑 Chave privada para tokens carregada com sucesso.');
  } catch (err) {
    console.error('❌ ERRO CRÍTICO: Não foi possível carregar a chave privada.', err.message);
  }

  // --- ROTAS DA API ---

  // ROTA DE SKIN (Página 1)
  app.get('/api/skin/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    if (!firstPageData || !firstPageData.success) {
      return res.status(503).json({ success: false, message: 'Erro crítico ao obter os dados da Steam.' });
    }

    const listings = parseListings(firstPageData);
    const totalListings = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalListings / 100);
    
    const responseData = { success: true, marketHashName, listings, pagination: { totalPages, totalListings }};
    res.json(responseData);
  });

  // ROTA DE PAGINAÇÃO (Páginas > 1)
  app.get('/api/skin/:marketHashName/page/:pageNumber', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageNumber = parseInt(req.params.pageNumber, 10);
    const pageData = await fetcher.fetchSpecificPage(marketHashName, pageNumber);
    if (!pageData || !pageData.success) {
      return res.status(503).json({ success: false, message: `Erro ao obter a página ${pageNumber}` });
    }
    
    const listings = parseListings(pageData);
    res.json({ success: true, listings });
  });

  // ROTA DE INSPEÇÃO (PROXY PARA SERVIÇO LOCAL)
  app.get('/api/inspect', async (req, res) => {
    const inspectLink = req.query.url;
    if (!inspectLink) {
      return res.status(400).json({ success: false, error: 'O parâmetro "url" é obrigatório.' });
    }
    const FLOAT_INSPECT_SERVICE_URL = `http://localhost:80/?url=${encodeURIComponent(inspectLink)}`;
    try {
        const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
        const response = await fetch(FLOAT_INSPECT_SERVICE_URL, { timeout: 15000 });
        if (!response.ok) throw new Error(`Serviço de inspeção retornou ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('❌ Erro no proxy de inspeção:', err.message);
        res.status(503).json({ success: false, error: 'Serviço de inspeção indisponível.' });
    }
  });

  // ROTA PARA GERAR TOKENS DE COMPRA
  app.post('/api/tokens/buy', async (req, res) => {
    if (!privateKey || !SignJWT) return res.status(500).json({ error: 'Serviço de tokens indisponível.' });
    try {
      const { steamUrl, listingId, maxPriceCents, itemName } = req.body || {};
      if (!steamUrl || !listingId || !Number.isInteger(maxPriceCents)) {
        return res.status(400).json({ error: 'Parâmetros inválidos.' });
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const token = await new SignJWT({ steamUrl, listingId, maxPriceCents, itemName, nonce })
        .setProtectedHeader({ alg: 'ES256' })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(privateKey);
      res.json({ token });
    } catch (err) {
      console.error('❌ Erro ao gerar token de compra:', err);
      res.status(500).json({ error: 'Falha a gerar token de compra.' });
    }
  });

  app.listen(PORT, () => console.log(`🚀 Backend (Modular) a correr em http://localhost:${PORT}`));
}

// --- FUNÇÃO DE PARSING COMPLETA (A VERSÃO CORRETA) ---
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

startServer();