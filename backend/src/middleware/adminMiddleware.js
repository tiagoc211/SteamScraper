const pool = require('../db/index.js');
const { createLog } = require('../utils/logsHelper');

async function ensureAdmin(req, res, next) {
  try {
    const steamId = req.user.id;

    // Busca role_id do utilizador
    const result = await pool.query(
      'SELECT id, role_id FROM users WHERE steam_id = $1',
      [steamId]
    );

    if (result.rows.length === 0) {
      await createLog({
        userId: null,
        action: 'ADMIN_ACCESS_DENIED',
        details: { reason: 'Utilizador não encontrado na BD', steamId, path: req.originalUrl }
      });
      return res.status(401).json({ error: 'Utilizador não encontrado na BD' });
    }

    const user = result.rows[0];

    if (user.role_id !== 1) {
      await createLog({
        userId: user.id,
        action: 'ADMIN_ACCESS_DENIED',
        details: { reason: 'Role inválida', role_id: user.role_id, steamId, path: req.originalUrl }
      });
      return res.status(403).json({ error: 'Sem permissões' });
    }

    const allowedSteamIds = (process.env.ADMIN_STEAMIDS || "")
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    const allowedUserIds = (process.env.ADMIN_IDS || "")
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!allowedSteamIds.includes(steamId) || !allowedUserIds.includes(user.id.toString())) {
      await createLog({
        userId: user.id,
        action: 'ADMIN_ACCESS_DENIED',
        details: { reason: 'IDs não permitidos no .env', steamId, userId: user.id, path: req.originalUrl }
      });
      return res.status(403).json({ error: 'ID do utilizador não consta nos Admin IDs' });
    }

    // Armazena info útil na request
    req.userId = user.id;
    req.roleId = user.role_id;

    // Log de acesso autorizado
    await createLog({
      userId: user.id,
      action: 'ADMIN_ACCESS_GRANTED',
      details: { steamId, path: req.originalUrl }
    });

    next();
  } catch (err) {
    console.error('Erro no adminMiddleware:', err);

    await createLog({
      userId: req.user?.id || null,
      action: 'ADMIN_ACCESS_ERROR',
      details: { error: err.message, path: req.originalUrl }
    });

    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = ensureAdmin;
