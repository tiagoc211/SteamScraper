const express = require('express');
const usersDb = require('../db/users.js');
const ensureAuthenticated = require('../middleware/authMiddleware');
const ensureAdmin = require('../middleware/adminMiddleware');
const { createLog } = require('../utils/logsHelper');

const router = express.Router();

// Listar todos os utilizadores
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const users = await usersDb.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter utilizador por ID
router.get('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await usersDb.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo utilizador (protegido + log)
router.post('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await usersDb.createUser(req.body);

    await createLog({
      userId: req.userId,
      action: 'CREATE_USER',
      details: { user_id: user.id, display_name: user.display_name }
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar utilizador (protegido + log)
router.put('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const oldUser = await usersDb.getUserById(req.params.id);
    const updatedUser = await usersDb.updateUser(req.params.id, req.body);

    await createLog({
      userId: req.userId,
      action: 'UPDATE_USER',
      details: {
        before: oldUser,
        after: updatedUser
      }
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar utilizador como INATIVO (soft delete)
router.put('/:id/deactivate', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    console.log('ID recebido para desativar:', req.params.id);
    const user = await usersDb.deactivateUser(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar utilizador como ATIVO
router.put('/:id/activate', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    console.log('ID recebido para ativar:', req.params.id);
    const user = await usersDb.activateUser(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
