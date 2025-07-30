const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio'); // Precisará do Cheerio no backend
const { fetchSearchPage, fetchPage } = require('./fetch');
const weaponData = require('./data');

const app = express();
app.use(cors());
const PORT = 3001; // Garanta que esta é a porta do seu backend

// Endpoint para pesquisa
app.get('/api/search', async (req, res) => {
  const { weapon, query } = req.query;

  // 1. Juntar os parâmetros de pesquisa numa única string
  let initialSearch = `${weapon || ''} ${query || ''}`;

  // 2. Agora, limpar a palavra "knife" da string completa e remover espaços extras
  const searchQuery = initialSearch.replace(/knife/gi, '').trim();

  // Se a pesquisa ficar vazia após a limpeza, pode optar por não pesquisar
  if (!searchQuery) {
    return res.json({ results: [] });
  }

  const data = await fetchSearchPage(searchQuery, 0, 100);
  if (!data || !data.results_html) {
    return res.json({ results: [] });
  }

  // Processar o HTML e devolver JSON limpo
  const $ = cheerio.load(data.results_html);
  const results = [];
  $('a.market_listing_row_link').each((_, el) => {
    const name = $(el).find('span.market_listing_item_name').text().trim();
    const price = $(el).find('span.normal_price span.market_listing_price').text().trim();
    const iconUrl = $(el).find('img.market_listing_item_img').attr('src');

    results.push({
      market_hash_name: name, // O nome completo é o melhor identificador
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

    listings.push({
      listingid,
      name,
      price,
      image,
      inspectLink,
      stickers: stickerImgs.length > 0 ? stickerImgs : null,
    });
  });

  res.json({
    success: true,
    marketHashName: decodeURIComponent(marketHashName),
    listings,
  });
});



app.listen(PORT, () => console.log(`Backend a correr em http://localhost:${PORT}`));