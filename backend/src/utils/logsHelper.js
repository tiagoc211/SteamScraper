const logsDb = require('../db/logs.js');

/**
 * Cria um log de forma simplificada.
 * @param {Object} params
 * @param {number} params.userId - ID do utilizador que realizou a ação
 * @param {string} params.action - Ação executada (ex: 'CREATE_ROLE')
 * @param {Object} params.details - Detalhes extra da ação
 */
async function createLog({ userId, action, details }) {
  try {
    await logsDb.createLog({
      user_id: userId,
      action,
      details
    });
  } catch (err) {
    console.error('Erro ao criar log:', err);
  }
}

module.exports = { createLog };
