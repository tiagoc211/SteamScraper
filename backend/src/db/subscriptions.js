// src/db/subscriptions.js
const db = require('./index.js');

/**
 * Obtém todos os tipos de subscrição que estão ativos.
 * Ordena-os pelo preço para uma exibição lógica.
 */
async function getActiveSubscriptionTypes() {
  const { rows } = await db.query(`
    SELECT * 
    FROM subscription_type 
    WHERE status = 'ACTIVE' 
    ORDER BY price_monthly ASC
  `);
  return rows;
}

module.exports = {
  getActiveSubscriptionTypes,
};