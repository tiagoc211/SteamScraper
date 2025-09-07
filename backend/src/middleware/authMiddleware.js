const pool = require('../db/index.js');

async function ensureAuthenticated(req, res, next) {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Passport coloca o profile do Steam em req.user
    const steamId = req.user.id;

    // Obter o id do utilizador na tua tabela users
    const result = await pool.query(
      'SELECT id FROM users WHERE steam_id = $1',
      [steamId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilizador não encontrado na BD' });
    }

    req.userId = result.rows[0].id; // Adiciona o id do utilizador à request
    next();
  } catch (err) {
    console.error('Erro no middleware de autenticação:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = ensureAuthenticated;
