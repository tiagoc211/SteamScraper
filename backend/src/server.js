require('dotenv').config();
console.log('STEAM_API_KEY =', process.env.STEAM_API_KEY); // para testar
// --- server.js Corrigido para Lidar com Módulos ES ---

const express = require('express');
const cors = require('cors');
const setupSteamAuth = require('./auth/steam');
const cheerio = require('cheerio');
const fetcher = require('./fetch');
const fs = require('fs/promises');
const crypto = require('crypto');
const NodeCache = require('node-cache');

// --- CONFIGURAÇÃO ---
const PORT = 3001;
const skinCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
const metaCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  // --- CORREÇÃO: Carregar 'jose' dinamicamente ---
  let importJWK, SignJWT;
  try {
    // Usamos import() dinâmico que retorna uma promessa
    const jose = await import('jose');
    importJWK = jose.importJWK;
    SignJWT = jose.SignJWT;
  } catch (err) {
    console.error('❌ ERRO CRÍTICO: Não foi possível carregar a biblioteca "jose". As rotas de autenticação estarão desativadas.', err);
  }
  
  await fetcher.ready;

  const app = express();
  app.use(cors());
  app.use(express.json());

  // --- LÓGICA DE AUTENTICAÇÃO E TOKENS ---
  const ISSUER = `http://localhost:${PORT}`;
  const AUDIENCE = 'steamscraper-extension';
  let privateKey;

  // Carregar a chave privada apenas se o import de 'jose' tiver sido bem-sucedido
  if (importJWK) {
    try {
      const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
      privateKey = await importJWK(privJwk, 'ES256');
      console.log('🔑 Chave privada carregada com sucesso.');
    } catch (error) {
      console.error('❌ ERRO CRÍTICO: Não foi possível carregar a chave privada. A rota de tokens não irá funcionar.', error.message);
    }
  }

const ISSUER = 'http://localhost:3001';
const AUDIENCE = 'steamscraper-extension';
  // --- ROTAS DA API (sem alterações na lógica interna) ---

async function loadPrivateKey() {
  const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
  const { importJWK } = await import('jose');
  return await importJWK(privJwk, 'ES256');
}

  // --- ROTA DE BUSCA (sem alterações) ---
  app.get('/api/search', async (req, res) => {
    const { query, start = 0, count = 10 } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'O parâmetro "query" é obrigatório.' });
    }
    console.log(`🔍 [Search] A procurar por "${query}"...`);
    const searchData = await fetcher.fetchSearchPage(query, start, count);
    if (searchData && searchData.success) {
      res.json(searchData);
    } else {
      res.status(503).json({ success: false, message: 'Não foi possível obter os resultados da busca na Steam.' });
    }
  });

  // ROTA DE SKIN PRINCIPAL (OBTÉM A 1ª PÁGINA E METADADOS)
  app.get('/api/skin/:marketHashName', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageCacheKey = `page_1_${marketHashName}`;
    if (skinCache.has(pageCacheKey)) {
      console.log(`✔️  [Cache] A servir a primeira página de ${marketHashName}`);
      return res.json(skinCache.get(pageCacheKey));
    }
    console.log(`🔥 [Fetch] A obter a primeira página de ${marketHashName}`);
    const firstPageData = await fetcher.fetchFirstPage(marketHashName);
    if (firstPageData === null || !firstPageData.success) {
      return res.status(500).json({ success: false, message: 'Erro crítico ao obter os dados da Steam.' });
    }
    const listings = parseListings(firstPageData);
    const totalListings = firstPageData.total_count || 0;
    const totalPages = Math.ceil(totalListings / 100);
    const metaCacheKey = `meta_${marketHashName}`;
    metaCache.set(metaCacheKey, { totalPages, totalListings });
    console.log(`📝 [Cache] Metadados para ${marketHashName} guardados: ${totalPages} páginas.`);
    const responseData = { 
      success: true, 
      marketHashName: marketHashName, 
      listings: listings,
      pagination: { currentPage: 1, totalPages: totalPages, totalListings: totalListings }
    };
    skinCache.set(pageCacheKey, responseData);
    res.json(responseData);
  });

  // ROTA DE PAGINAÇÃO INTELIGENTE
  app.get('/api/skin/:marketHashName/page/:pageNumber', async (req, res) => {
    const marketHashName = decodeURIComponent(req.params.marketHashName);
    const pageNumber = req.params.pageNumber;
    const pageNum = parseInt(pageNumber, 10);
    const pageCacheKey = `page_${pageNumber}_${marketHashName}`;
    const metaCacheKey = `meta_${marketHashName}`;
    if (isNaN(pageNum) || pageNum <= 1) {
      return res.status(400).json({ success: false, message: 'Número de página inválido. Deve ser maior que 1.' });
    }
    let metadata = metaCache.get(metaCacheKey);
    if (!metadata) {
        console.log(`⚠️  [Cache] Metadados para ${marketHashName} não encontrados. A buscar página 1 para obtê-los.`);
        const firstPageData = await fetcher.fetchFirstPage(marketHashName);
        if (firstPageData && firstPageData.success) {
            metadata = {
                totalPages: Math.ceil((firstPageData.total_count || 0) / 100),
                totalListings: firstPageData.total_count || 0
            };
            metaCache.set(metaCacheKey, metadata);
        } else {
            return res.status(500).json({ success: false, message: 'Não foi possível obter os metadados do item.' });
        }
    }
    if (pageNum > metadata.totalPages) {
      console.log(`🚫 [Block] Pedido para página inválida (${pageNum}) para ${marketHashName}. Total: ${metadata.totalPages} páginas.`);
      return res.status(404).json({ success: false, message: `Página ${pageNum} não existe. Este item só tem ${metadata.totalPages} páginas.` });
    }
    if (skinCache.has(pageCacheKey)) {
      console.log(`✔️  [Cache] A servir a página ${pageNumber} de ${marketHashName}`);
      return res.json(skinCache.get(pageCacheKey));
    }
    console.log(`🔥 [Fetch] A obter a página ${pageNumber} de ${marketHashName}`);
    const pageData = await fetcher.fetchSpecificPage(marketHashName, pageNum);
    if (pageData === null || !pageData.success) {
      return res.status(500).json({ success: false, message: `Erro ao obter a página ${pageNum}` });
    }
    const listings = parseListings(pageData);
    const responseData = { success: true, listings };
    skinCache.set(pageCacheKey, responseData);
    res.json(responseData);
  });
  
  // ROTA PARA GERAR TOKENS
  app.post('/api/tokens/buy', async (req, res) => {
    if (!privateKey || !SignJWT) {
        return res.status(500).json({ success: false, message: 'Serviço de tokens indisponível.' });
    }
    const { userId, plan } = req.body;
    if (!userId || !plan) {
        return res.status(400).json({ success: false, message: 'userId e plan são obrigatórios.' });
    }
    try {
        const jti = crypto.randomBytes(16).toString('hex');
        const token = await new SignJWT({ plan, sub: userId })
          .setProtectedHeader({ alg: 'ES256' })
          .setJti(jti)
          .setIssuedAt()
          .setIssuer(ISSUER)
          .setAudience(AUDIENCE)
          .setExpirationTime('2h')
          .sign(privateKey);
        res.json({ success: true, token });
    } catch (error) {
        console.error('❌ Erro ao gerar token:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao gerar o token.' });
    }
  });

  // INICIA O SERVIDOR
  app.listen(PORT, () => console.log(`🚀 Backend a correr em http://localhost:${PORT}`));
}

// --- FUNÇÃO AUXILIAR PARA PARSE DE LISTINGS (sem alterações) ---
function parseListings(data) {
  if (!data || !data.results_html) return [];
  const $ = cheerio.load(data.results_html);
  const listings = [];
  $('.market_listing_row').each((_, el) => {
      const $el = $(el);
      const listingid = $el.attr('id')?.replace('listing_', '');
      const name = $el.find('.market_listing_item_name').text().trim();
      const priceStr = $el.find('.market_listing_price_with_fee').text().trim();
      const image = $el.find('img.market_listing_item_img').attr('src');
      const inspectLink = $el.find('.market_listing_row_action a').attr('href');
      const li = listingid ? data.listinginfo?.[listingid] : null;
      const subtotalCents = li?.price;
      const feeCents = li?.fee;
      const totalCents = (Number.isInteger(subtotalCents) && Number.isInteger(feeCents)) ? (subtotalCents + feeCents) : null;
      const currency = li?.currencyid ?? null;
      let rawAsset = null;
      const assetId = li?.asset?.id;
      const contextId = li?.asset?.contextid || '2';
      if (assetId) {
          rawAsset = data.assets?.[730]?.[contextId]?.[assetId] ?? null;
      }
      const priceNumber = parseFloat(priceStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
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
      listings.push({ 
          listingid, name, 
          price: totalCents ? (totalCents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : priceStr,
          priceNumber, image, inspectLink, 
          stickers: stickerImgs.length > 0 ? stickerImgs : null, 
          keychains: keychains.length > 0 ? keychains : null, 
          buy: { currency, subtotalCents, feeCents, totalCents }, 
          raw: rawAsset 
      });
  });
  return listings;
}

// --- INICIA A APLICAÇÃO ---
startServer();