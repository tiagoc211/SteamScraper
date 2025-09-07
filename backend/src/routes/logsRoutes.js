// src/routes/logsRoutes.js
const express = require('express');
const logsDb = require('../db/logs.js');
const ensureAuthenticated = require('../middleware/authMiddleware');

const router = express.Router();

// 📌 Listar todos os logs
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const logs = await logsDb.getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Listar logs de um utilizador específico
router.get('/user/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const logs = await logsDb.getLogsByUser(req.params.userId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Obter log por ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const log = await logsDb.getLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log não encontrado' });
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
