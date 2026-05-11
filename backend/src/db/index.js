const { Pool } = require('pg');

// Aiven Cloud PostgreSQL requires SSL but with rejectUnauthorized: false
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
