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

module.exports = router;