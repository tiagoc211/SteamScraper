const express = require('express');
const rolesDb = require('../db/roles.js');
const { createLog } = require('../utils/logsHelper');
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

// Criar nova role (protegida + log)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const role = await rolesDb.createRole(req.body);

    await createLog({
      userId: req.userId,
      action: 'CREATE_ROLE',
      details: { role_id: role.id, name: role.name }
    });

    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar role (protegida + log)
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const role = await rolesDb.updateRole(req.params.id, req.body);

    await createLog({
      userId: req.userId,
      action: 'UPDATE_ROLE',
      details: { role_id: role.id, name: role.name }
    });

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remover role (protegida + log)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const role = await rolesDb.deleteRole(req.params.id);

    await createLog({
      userId: req.userId,
      action: 'DELETE_ROLE',
      details: { role_id: role.id, name: role.name }
    });

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
