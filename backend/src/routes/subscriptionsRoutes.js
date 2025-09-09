// src/routes/subscriptionsRoutes.js
const express = require('express');
const subscriptionsDb = require('../db/subscriptions.js');

const router = express.Router();

// Rota para listar todos os tipos de subscrição ativos
router.get('/', async (req, res) => {
  try {
    const types = await subscriptionsDb.getActiveSubscriptionTypes();
    res.json(types);
  } catch (err) {
    console.error('Erro ao obter os tipos de subscrição:', err);
    res.status(500).json({ error: 'Falha ao obter os planos de subscrição.' });
  }
});

// Obter total de subscrições
router.get('/total', async (req, res) => {
  try {
    const total = await subscriptionsDb.getTotalSubscriptions();
    res.json({ total });
  } catch (err) {
    console.error('Erro ao obter total de subscrições:', err);
    res.status(500).json({ error: 'Falha ao obter o total de subscrições.' });
  }
});

// Obter total de subscrições ativas (tipos ativos)
router.get('/total-active', async (req, res) => {
  try {
    const totalActive = await subscriptionsDb.getTotalActiveSubscriptions();
    res.json({ totalActive });
  } catch (err) {
    console.error('Erro ao obter total de subscrições ativas:', err);
    res.status(500).json({ error: 'Falha ao obter o total de subscrições ativas.' });
  }
});

// Obter contagem de subscrições por tipo
router.get('/counts-by-type', async (req, res) => {
  try {
    const counts = await subscriptionsDb.getSubscriptionCountsByType();
    res.json(counts);
  } catch (err) {
    console.error('Erro ao obter contagem de subscrições por tipo:', err);
    res.status(500).json({ error: 'Falha ao obter a contagem de subscrições por tipo.' });
  }
});

// Total de receita
router.get('/total-revenue', async (req, res) => {
  try {
    const totalRevenue = await subscriptionsDb.getTotalRevenue();
    res.json({ totalRevenue });
  } catch (err) {
    console.error('Erro ao obter total de receita:', err);
    res.status(500).json({ error: 'Falha ao obter total de receita.' });
  }
});



module.exports = router;