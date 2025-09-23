const pool = require('../db/index.js');

async function ensureAdmin(req, res, next) {
  try {
    const steamId = req.user.id;

    // Busca role_id do utilizador
    const result = await pool.query(
      'SELECT id, role_id FROM users WHERE steam_id = $1',
      [steamId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilizador não encontrado na BD' });
    }

    const user = result.rows[0];

    if (user.role_id !== 1) {
      return res.status(403).json({ error: 'Sem permissões' });
    }

    const allowedSteamIds = process.env.ADMIN_STEAMIDS.split(',').map(id => id.trim());
    const allowedUserIds = process.env.ADMIN_IDS.split(',').map(id => id.trim());

    if (!allowedSteamIds.includes(steamId) || !allowedUserIds.includes(user.id.toString())) {
        return res.status(403).json({ error: 'ID do utilizador não consta nos Admin IDs' });
    }


    // Armazena info útil na request
    req.userId = user.id;
    req.roleId = user.role_id;

    next();
  } catch (err) {
    console.error('Erro no adminMiddleware:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = ensureAdmin;
