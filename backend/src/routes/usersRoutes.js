const express = require('express');
const usersDb = require('../db/users.js'); // require em vez de import

const router = express.Router();

// Listar todos os utilizadores
router.get('/', async (req, res) => {
  try {
    const users = await usersDb.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter utilizador por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await usersDb.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo utilizador
router.post('/', async (req, res) => {
  try {
    const user = await usersDb.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar utilizador
router.put('/:id', async (req, res) => {
  try {
    const user = await usersDb.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remover utilizador
router.delete('/:id', async (req, res) => {
  try {
    const user = await usersDb.deleteUser(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 
