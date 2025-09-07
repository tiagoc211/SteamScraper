// --- server.js com Lógica de Streaming ---

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const NodeCache = require('node-cache');
const fetcher = require('./fetch');

// Cache com TTL (Time To Live) de 5 minutos
const skinCache = new NodeCache({ stdTTL: 300 });

async function startServer() {
  await fetcher.ready;

  const app = express();
  app.use(cors({ origin: 'http://localhost:3000' })); // Permitir pedidos do frontend
  app.use(express.json());
  const PORT = 3001;

  // ROTA DE SKIN PRINCIPAL (AGORA COM STREAMING)
  app.get('/api/skin/:marketHashName', async (req, res) => {
    const { marketHashName } = req.params;
    const decodedMarketHashName = decodeURIComponent(marketHashName);

    // Endpoint para streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      const firstPageData = await fetcher.fetchFirstPage(decodedMarketHashName);
      if (!firstPageData || !firstPageData.total_count) {
        // Se a primeira página falhar, envia um erro e fecha a conexão
        return res.status(500).json({ success: false, message: 'Não foi possível obter os dados iniciais da skin.' });
      }

      const totalListings = firstPageData.total_count;
      const totalPages = Math.ceil(totalListings / 100);
      const firstPageListings = parseListings(firstPageData);

      // Enviar a resposta inicial (sem fechar a conexão)
      const initialPayload = {
        success: true,
        marketHashName: decodedMarketHashName,
        listings: firstPageListings,
        pagination: { totalPages, totalListings }
      };
      res.json(initialPayload);

    } catch (e) {
      console.error("Erro na rota de streaming:", e);
      // Se algo falhar antes de enviar dados, podemos enviar um erro
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
      }
    }
  });

  // ROTA DE PAGINAÇÃO (mantida para compatibilidade ou uso futuro)
  app.get('/api/skin/:marketHashName/page/:pageNumber', async (req, res) => {
    const { marketHashName, pageNumber } = req.params;
    const pageNum = parseInt(pageNumber, 10);
    const decodedMarketHashName = decodeURIComponent(marketHashName);
    
    const pageData = await fetcher.fetchSpecificPage(decodedMarketHashName, pageNum);
    if (!pageData) {
        return res.status(500).json({ success: false, message: `Não foi possível obter a página ${pageNum}.` });
    }
    const listings = parseListings(pageData);
    res.json({ success: true, listings });
  });

  // ROTA DE INSPEÇÃO (necessária para o frontend)
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


  app.listen(PORT, () => console.log(`🚀 Backend (Streaming) a correr em http://localhost:${PORT}`));
}

// FUNÇÃO DE PARSING (sem alterações)
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
        const subtotalCents = li?.price;
        const feeCents = li?.fee;
        const totalCents = (subtotalCents != null && feeCents != null) ? (subtotalCents + feeCents) : null;
        const priceNumber = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.'));
        listings.push({ listingid, name, priceNumber, image, inspectLink, buy: { totalCents } });
    });
    return listings;
}

startServer();