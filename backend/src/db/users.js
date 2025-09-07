const db = require('./index.js'); // CommonJS

async function getUsers() {
  const { rows } = await db.query(`
    SELECT u.*, r.name as role_name
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.id
  `);
  return rows;
}

async function getUserById(id) {
  const { rows } = await db.query(`
    SELECT u.*, r.name as role_name
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `, [id]);
  return rows[0];
}

async function createUser(data) {
  const { steam_id, display_name, avatar_url } = data;
  const { rows } = await db.query(`
    INSERT INTO users (steam_id, display_name, avatar_url)
    VALUES ($1, $2, $3)
    RETURNING *;
  `, [steam_id, display_name, avatar_url]);
  return rows[0];
}

async function updateUser(id, data) {
  const { display_name, avatar_url, email, roleId } = data;
  const { rows } = await db.query(`
    UPDATE users
    SET display_name = $1, avatar_url = $2, email = $3, role_id = $4, updated_at = now()
    WHERE id = $5
    RETURNING *;
  `, [display_name, avatar_url, email, roleId, id]);
  return rows[0];
}

async function deleteUser(id) {
  const { rows } = await db.query(`
    DELETE FROM users WHERE id = $1 RETURNING *;
  `, [id]);
  return rows[0];
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
