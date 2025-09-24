const express = require('express');
const rolesDb = require('../db/roles.js');
const { createLog } = require('../utils/logsHelper');
const ensureAuthenticated = require('../middleware/authMiddleware');
const ensureAdmin = require('../middleware/adminMiddleware.js');

const router = express.Router();

// Listar todas as roles
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const roles = await rolesDb.getRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova role (protegida + log)
router.post('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
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
router.put('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Buscar estado antigo antes da atualização
    const oldRole = await rolesDb.getRoleById(req.params.id);
    if (!oldRole) return res.status(404).json({ error: 'Role não encontrada' });

    // Fazer a atualização
    const updatedRole = await rolesDb.updateRole(req.params.id, req.body);
    if (!updatedRole) return res.status(500).json({ error: 'Erro ao atualizar role' });

    // Criar log com antes e depois
    await createLog({
      userId: req.userId,
      action: 'UPDATE_ROLE',
      details: {
        before: oldRole,
        after: updatedRole
      }
    });

    res.json(updatedRole);
  } catch (err) {
    console.error("Erro ao atualizar role:", err);
    res.status(500).json({ error: err.message });
  }
});


// Remover role (protegida + log)
router.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
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
