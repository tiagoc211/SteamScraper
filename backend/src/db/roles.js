const db = require('./index.js');

// Listar todas as roles
async function getRoles() {
  const result = await db.query('SELECT * FROM roles ORDER BY id');
  return result.rows;
}

// Obter role por ID
async function getRoleById(id) {
  const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
  return result.rows[0];
}

// Criar nova role
async function createRole({ name, permissions }) {
  const result = await db.query(
    `INSERT INTO roles (name, permissions) VALUES ($1, $2) RETURNING *`,
    [name, JSON.stringify(permissions)]
  );
  return result.rows[0];
}

// Atualizar role
async function updateRole(id, { name, permissions }) {
  const result = await db.query(
    `UPDATE roles SET name = $1, permissions = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, JSON.stringify(permissions), id]
  );
  return result.rows[0];
}

// Remover role
async function deleteRole(id) {
  const result = await db.query(
    `DELETE FROM roles WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
