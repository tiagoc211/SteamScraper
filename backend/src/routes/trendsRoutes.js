// backend/src/routes/trendsRoutes.js
const express = require('express');
const priceHistory = require('../db/priceHistory');

const router = express.Router();

// GET /api/trends/top-gainers - Itens com maior aumento de preço
router.get('/top-gainers', async (req, res) => {
  const { days = 7, limit = 20 } = req.query;
  
  try {
    const topGainers = await priceHistory.getTopPriceChanges({
      days: parseInt(days),
      limit: parseInt(limit),
      direction: 'up'
    });
    
    res.json({ success: true, items: topGainers });
  } catch (err) {
    console.error('Error fetching top gainers:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar top gainers' });
  }
});

// GET /api/trends/top-losers - Itens com maior queda de preço
router.get('/top-losers', async (req, res) => {
  const { days = 7, limit = 20 } = req.query;
  
  try {
    const topLosers = await priceHistory.getTopPriceChanges({
      days: parseInt(days),
      limit: parseInt(limit),
      direction: 'down'
    });
    
    res.json({ success: true, items: topLosers });
  } catch (err) {
    console.error('Error fetching top losers:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar top losers' });
  }
});

// GET /api/trends/biggest-changes - Maiores variações (positivas e negativas)
router.get('/biggest-changes', async (req, res) => {
  const { days = 7, limit = 40 } = req.query;
  
  try {
    const changes = await priceHistory.getTopPriceChanges({
      days: parseInt(days),
      limit: parseInt(limit),
      direction: 'both'
    });
    
    res.json({ success: true, items: changes });
  } catch (err) {
    console.error('Error fetching biggest changes:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar maiores variações' });
  }
});

// GET /api/trends/item/:marketHashName - Histórico de um item específico
router.get('/item/:marketHashName', async (req, res) => {
  const { marketHashName } = req.params;
  const { days = 30 } = req.query;
  
  try {
    const history = await priceHistory.getItemPriceHistory(
      decodeURIComponent(marketHashName),
      parseInt(days)
    );
    
    res.json({ success: true, history });
  } catch (err) {
    console.error('Error fetching item history:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico do item' });
  }
});

// POST /api/trends/aggregate - Agrega preços do dia (admin/cronjob)
router.post('/aggregate', async (req, res) => {
  try {
    const rowCount = await priceHistory.aggregateDailyPrices();
    res.json({ 
      success: true, 
      message: `${rowCount} items agregados com sucesso`,
      rowCount 
    });
  } catch (err) {
    console.error('Error aggregating prices:', err);
    res.status(500).json({ success: false, message: 'Erro ao agregar preços' });
  }
});

// POST /api/trends/populate-from-steam - Busca histórico real da Steam (admin)
router.post('/populate-from-steam', async (req, res) => {
  const { limit = 50, daysBack = 30 } = req.body;
  
  try {
    console.log(`🌐 Starting Steam price history fetch: ${limit} items, ${daysBack} days`);
    
    // Executar em background para não bloquear a resposta
    priceHistory.populateFromSteamHistory(parseInt(limit), parseInt(daysBack))
      .then(count => console.log(`✅ Finished: ${count} price points inserted`))
      .catch(err => console.error('❌ Background population failed:', err));
    
    res.json({ 
      success: true, 
      message: 'Steam price history fetch started in background',
      status: 'processing'
    });
  } catch (err) {
    console.error('Error starting Steam history fetch:', err);
    res.status(500).json({ success: false, message: 'Erro ao iniciar busca da Steam' });
  }
});

// GET /api/trends/best-liquidity - Items com melhor relação preço/liquidez
router.get('/best-liquidity', async (req, res) => {
  const { limit = 20 } = req.query;
  
  try {
    const items = await priceHistory.getBestPriceLiquidity(parseInt(limit));
    res.json({ success: true, items });
  } catch (err) {
    console.error('Error fetching best liquidity:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar liquidez' });
  }
});

// GET /api/trends/lowest-floats - Items com floats mais baixos
router.get('/lowest-floats', async (req, res) => {
  const { limit = 20 } = req.query;
  
  try {
    const items = await priceHistory.getLowestFloats(parseInt(limit));
    res.json({ success: true, items });
  } catch (err) {
    console.error('Error fetching lowest floats:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar floats' });
  }
});

module.exports = router;
