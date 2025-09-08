const express = require('express');
const usersDb = require('../db/users.js');
const ensureAuthenticated = require('../middleware/authMiddleware');
const { createLog } = require('../utils/logsHelper');

const router = express.Router();

// Listar todos os utilizadores
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const users = await usersDb.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter utilizador por ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const user = await usersDb.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo utilizador (protegido + log)
router.post('/', ensureAuthenticated, async (req, res) => {
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
router.put('/:id', ensureAuthenticated, async (req, res) => {
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

// Remover utilizador (protegido + log)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const user = await usersDb.deleteUser(req.params.id);

    await createLog({
      userId: req.userId,
      action: 'DELETE_USER',
      details: { user_id: user.id, display_name: user.display_name }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
