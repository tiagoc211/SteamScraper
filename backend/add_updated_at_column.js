require('dotenv').config();
const pool = require('./src/db');

async function addColumn() {
  try {
    console.log('🔧 A adicionar coluna updated_at...');
    
    await pool.query(`
      ALTER TABLE price_history 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    
    console.log('✅ Coluna updated_at adicionada com sucesso!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addColumn();
