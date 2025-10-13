// src/db/searchUsage.js
const db = require('./index.js');

async function getUserLimits(userId) {
  console.log("🧠 getUserLimits recebeu:", userId, typeof userId);
  const { rows } = await db.query(`
    SELECT st.max_searches_per_day, st.max_results_per_search
    FROM users u
    JOIN subscriptions s ON s.id = u.subscription_id
    JOIN subscription_type st ON st.id = s.type
    WHERE u.id = $1 AND s.status = 'ATIVO';
  `, [userId]);
  return rows[0] || null;
}


async function ensureUserUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  await db.query(`
    INSERT INTO search_usage (user_id, date)
    VALUES ($1, $2)
    ON CONFLICT (user_id, date) DO NOTHING
  `, [userId, today]);
}

async function getUserUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await db.query(`
    SELECT searches FROM search_usage WHERE user_id = $1 AND date = $2
  `, [userId, today]);
  return rows[0]?.searches || 0;
}

async function incrementSearchUsage(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await db.query(`
    UPDATE search_usage
    SET searches = searches + 1
    WHERE user_id = $1 AND date = $2
    RETURNING searches
  `, [userId, today]);
  return rows[0]?.searches || 0;
}

module.exports = {
  getUserLimits,
  ensureUserUsage,
  getUserUsage,
  incrementSearchUsage
};
