const express = require('express');
const rolesDb = require('../db/roles.js');

const router = express.Router();

// Listar todas as roles
router.get('/', async (req, res) => {
  try {
    const roles = await rolesDb.getRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova role
router.post('/', async (req, res) => {
  try {
    const role = await rolesDb.createRole(req.body);
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar role
router.put('/:id', async (req, res) => {
  try {
    const role = await rolesDb.updateRole(req.params.id, req.body);
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remover role
router.delete('/:id', async (req, res) => {
  try {
    const role = await rolesDb.deleteRole(req.params.id);
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
