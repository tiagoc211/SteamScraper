const db = require('./index.js');

// Listar todos os logs
async function getLogs() {
  const result = await db.query('SELECT * FROM logs_activity ORDER BY created_at DESC');
  return result.rows;
}

// Obter log por ID
async function getLogById(id) {
  const result = await db.query('SELECT * FROM logs_activity WHERE id = $1', [id]);
  return result.rows[0];
}

// Criar novo log
async function createLog({ user_id, action, details = {}, ip }) {
  if (!user_id) {
    throw new Error('O campo user_id é obrigatório para criar um log.');
  }
  if (!action) {
    throw new Error('O campo action é obrigatório para criar um log.');
  }

  const result = await db.query(
    `INSERT INTO logs_activity (user_id, action, details, ip) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, action, JSON.stringify(details), ip]
  );
  return result.rows[0];
}

// Atualizar log (raro, mas possível)
async function updateLog(id, { action, details, ip }) {
  const result = await db.query(
    `UPDATE logs_activity 
     SET action = $1, details = $2, ip = $3, created_at = NOW() 
     WHERE id = $4 RETURNING *`,
    [action, JSON.stringify(details), ip, id]
  );
  return result.rows[0];
}

// Remover log
async function deleteLog(id) {
  const result = await db.query(
    `DELETE FROM logs_activity WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  getLogs,
  getLogById,
  createLog,
  updateLog,
  deleteLog
};
