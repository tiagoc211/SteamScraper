const express = require('express');
const rolesDb = require('../db/roles.js');
const logsDb = require('../db/logs.js');
const ensureAuthenticated = require('../middleware/authMiddleware');

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

// Criar nova role (protegida pelo middleware e com log)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const role = await rolesDb.createRole(req.body);

    // Criar log da ação
    await logsDb.createLog({
      user_id: req.userId,
      action: 'CREATE_ROLE',
      details: { role_id: role.id, name: role.name }
    });

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
