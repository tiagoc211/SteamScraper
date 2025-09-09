// src/db/subscriptions.js
const db = require('./index.js');

/**
 * Obtém todos os tipos de subscrição ativos, ordenados por preço
 */
async function getActiveSubscriptionTypes() {
  const { rows } = await db.query(`
    SELECT id, name, price_monthly::float, description, status
    FROM subscription_type 
    WHERE status = 'ACTIVE' 
    ORDER BY price_monthly ASC
  `);
  return rows;
}

/**
 * Conta quantas subscrições existem por tipo
 */
async function getSubscriptionCountsByType() {
  const { rows } = await db.query(`
    SELECT 
      st.id AS type_id, 
      st.name AS type_name, 
      COUNT(s.id)::int AS total_subscriptions
    FROM subscription_type st
    LEFT JOIN subscriptions s ON s.type = st.id
    GROUP BY st.id, st.name
    ORDER BY total_subscriptions DESC
  `);
  return rows;
}

/**
 * Obtém o total de todas as subscrições
 */
async function getTotalSubscriptions() {
  const { rows } = await db.query(`
    SELECT COUNT(*)::int AS total
    FROM subscriptions
  `);
  return rows[0].total;
}

/**
 * Obtém o total de subscrições ativas
 */
async function getTotalActiveSubscriptions() {
  const { rows } = await db.query(`
    SELECT COUNT(*)::int AS total
    FROM subscriptions s
    JOIN subscription_type st ON s.type = st.id
    WHERE st.status = 'ACTIVE' AND s.status = 'ATIVO'
  `);
  return rows[0].total;
}

/**
 * Obtém o total de dinheiro arrecadado por todas as subscrições
 */
async function getTotalRevenue() {
  const { rows } = await db.query(`
    SELECT COALESCE(SUM(st.price_monthly),0) AS total_revenue
    FROM subscriptions s
    JOIN subscription_type st ON s.type = st.id
    WHERE s.status = 'ATIVO'
  `);
  return parseFloat(rows[0].total_revenue);
}

module.exports = {
  getActiveSubscriptionTypes,
  getSubscriptionCountsByType,
  getTotalSubscriptions,
  getTotalActiveSubscriptions,
  getTotalRevenue
};
