const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const { fetchSearchPage, fetchPage } = require('./fetch');
const weaponData = require('./data');
const fs = require('fs/promises');
const crypto = require('crypto');

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


// Endpoint para pesquisa
app.get('/api/search', async (req, res) => {
  const { weapon, query } = req.query;
  let initialSearch = `${weapon || ''} ${query || ''}`;
  const searchQuery = initialSearch.replace(/knife/gi, '').trim();

  if (!searchQuery) {
    return res.json({ results: [] });
  }

  const data = await fetchSearchPage(searchQuery, 0, 100);
  if (!data || !data.results_html) {
    return res.json({ results: [] });
  }

  const $ = cheerio.load(data.results_html);
  const results = [];
  $('a.market_listing_row_link').each((_, el) => {
    const name = $(el).find('span.market_listing_item_name').text().trim();
    const price = $(el).find('span.normal_price span.market_listing_price').text().trim();
    const iconUrl = $(el).find('img.market_listing_item_img').attr('src');

    results.push({
      market_hash_name: name,
      name: name.split(' | ')[1]?.split(' (')[0] || name,
      price: price,
      icon_url: iconUrl,
    });
  });

  res.json({ results });
});


app.get('/api/skin/:marketHashName', async (req, res) => {
  const { marketHashName } = req.params;
  const data = await fetchPage(decodeURIComponent(marketHashName), 0);

  if (!data || !data.results_html) {
    return res.status(500).json({ success: false, message: 'Erro ao obter HTML da Steam' });
  }

  const $ = cheerio.load(data.results_html);
  const listings = [];

  $('.market_listing_row').each((_, el) => {
    const $el = $(el);

    const listingid = $el.attr('id')?.replace('listing_', '');
    const name = $el.find('.market_listing_item_name').text().trim();
    const price = $el.find('.market_listing_price_with_fee').text().trim();
    const image = $el.find('img.market_listing_item_img').attr('src');
    const inspectLink = $el.find('.market_listing_row_action a').attr('href');

    const stickerImgs = [];
    $el.find('#sticker_info img').each((_, img) => {
      const src = $(img).attr('src');
      if (src) stickerImgs.push(src);
    });

    // CORREÇÃO: Lógica de scraping para charms revertida para a sua versão funcional
    const keychains = [];
    $el.find('#keychain_info img').each((_, img) => {
        const src = $(img).attr('src');
        if (src) {
            keychains.push({
                image_url: src,
            });
        }
    });

    listings.push({
      listingid,
      name,
      price,
      image,
      inspectLink,
      stickers: stickerImgs.length > 0 ? stickerImgs : null,
      keychains: keychains.length > 0 ? keychains : null,
    });
  });

  res.json({
    success: true,
    marketHashName: decodeURIComponent(marketHashName),
    listings,
  });
});

app.post('/api/tokens/buy', express.json(), async (req, res) => {
  try {
    const { SignJWT } = await import('jose');
    const { steamUrl, listingId, maxPriceCents, itemName } = req.body || {};

    if (typeof steamUrl !== 'string' ||
        typeof listingId !== 'string' ||
        !Number.isInteger(maxPriceCents) || maxPriceCents <= 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const key = await loadPrivateKey();

    const token = await new SignJWT({
        steamUrl,
        listingId,
        maxPriceCents,
        itemName,
        nonce
      })
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