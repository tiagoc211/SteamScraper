require('dotenv').config();
const pool = require('./src/db');

async function testConnection() {
  try {
    console.log('🔌 Testando conexão à base de dados...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão bem-sucedida!');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    
    // Test price_history table
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'price_history'
    `);
    
    if (tableCheck.rows[0].count > 0) {
      console.log('✅ Tabela price_history existe');
      
      const countResult = await pool.query('SELECT COUNT(*) as count FROM price_history');
      console.log(`📊 Registos existentes: ${countResult.rows[0].count}`);
    } else {
      console.log('⚠️  Tabela price_history NÃO existe - precisa de ser criada');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('📝 Stack:', error.stack);
    process.exit(1);
  }
}

testConnection();
