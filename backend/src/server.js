const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
// ATUALIZADO: Importa o objeto fetcher completo, não as funções individualmente
const fetcher = require('./fetch');
const fs = require('fs/promises');
const crypto = require('crypto');

// Envolve toda a lógica do servidor numa função async
async function startServer() {
  // ATUALIZAÇÃO CRÍTICA: Espera que o módulo fetch esteja pronto antes de continuar
  await fetcher.ready;

  const app = express();
  app.use(cors());
  const PORT = 3001;

  const ISSUER = 'http://localhost:3001';
  const AUDIENCE = 'steamscraper-extension';

  async function loadPrivateKey() {
    const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
    const { importJWK } = await import('jose');
    return await importJWK(privJwk, 'ES256');
  }

  app.get('/api/search', async (req, res) => {
    const { weapon, query } = req.query;
    let initialSearch = `${weapon || ''} ${query || ''}`;
    const searchQuery = initialSearch.replace(/knife/gi, '').trim();

    if (!searchQuery) return res.json({ results: [] });

    // ATUALIZADO: Usa fetcher.fetchSearchPage
    const data = await fetcher.fetchSearchPage(searchQuery, 0, 100);
    if (!data || !data.results_html) return res.json({ results: [] });

    const $ = cheerio.load(data.results_html);
    const results = [];
    $('a.market_listing_row_link').each((_, el) => {
      const name = $(el).find('span.market_listing_item_name').text().trim();
      const price = $(el).find('span.normal_price span.market_listing_price').text().trim();
      const iconUrl = $(el).find('img.market_listing_item_img').attr('src');
      results.push({ market_hash_name: name, name: name.split(' | ')[1]?.split(' (')[0] || name, price: price, icon_url: iconUrl });
    });
    res.json({ results });
  });

  app.get('/api/skin/:marketHashName', async (req, res) => {
    const { marketHashName } = req.params;

    // ATUALIZADO: Usa fetcher.fetchAllListingsPages
    const allPagesData = await fetcher.fetchAllListingsPages(decodeURIComponent(marketHashName));

    if (allPagesData === null) return res.status(500).json({ success: false, message: 'Erro crítico ao obter os dados da Steam' });

    const allListings = [];
    allPagesData.forEach(data => {
      if (!data.results_html) return;
      const $ = cheerio.load(data.results_html);
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
        allListings.push({ listingid, name, price: li?.price ? (li.price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : null, priceNumber, image, inspectLink, stickers: stickerImgs.length > 0 ? stickerImgs : null, keychains: keychains.length > 0 ? keychains : null, buy: { currency, subtotalCents, feeCents, totalCents }, raw: rawAsset });
      });
    });
    res.json({ success: true, marketHashName: decodeURIComponent(marketHashName), listings: allListings });
  });

  app.post('/api/tokens/buy', express.json(), async (req, res) => {
    try {
      const { SignJWT } = await import('jose');
      const { steamUrl, listingId, maxPriceCents, itemName } = req.body || {};
      if (typeof steamUrl !== 'string' || typeof listingId !== 'string' || !Number.isInteger(maxPriceCents) || maxPriceCents <= 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const key = await loadPrivateKey();
      const token = await new SignJWT({ steamUrl, listingId, maxPriceCents, itemName, nonce })
        .setProtectedHeader({ alg: 'ES256', kid: 'steam-buy-key-1' })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(key);
      res.json({ token, exp: Date.now() + 60 * 1000 });
    } catch (err) {
      console.error('Erro ao gerar token:', err);
      res.status(500).json({ error: 'Falha a gerar token' });
    }
  });

  app.listen(PORT, () => console.log(`Backend a correr em http://localhost:${PORT}`));
}

// Inicia o servidor
startServer();