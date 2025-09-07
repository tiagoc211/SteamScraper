const express = require('express');
const fs = require('fs/promises');
const router = express.Router();

router.get('/', async (req, res) => {
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

module.exports = router;
