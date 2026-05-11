require('dotenv').config();
const pool = require('./src/db');
const fs = require('fs');
const path = require('path');

async function ensureTable() {
  try {
    console.log('🔍 Verificando se tabela price_history existe...');
    
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'price_history'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Tabela price_history já existe!');
    } else {
      console.log('⚠️  Tabela price_history NÃO existe. A criar...');
      
      const sqlPath = path.join(__dirname, 'src', 'db', 'price_history.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await pool.query(sql);
      console.log('✅ Tabela price_history criada com sucesso!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

ensureTable();
