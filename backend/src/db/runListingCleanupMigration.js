// backend/src/db/runListingCleanupMigration.js
/**
 * Script para aplicar a migração que adiciona as colunas necessárias
 * para o sistema de limpeza de listings
 * 
 * Execute: node runListingCleanupMigration.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./index.js');

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  MIGRAÇÃO: Adicionar colunas de cleanup a listings         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Verificar se as colunas já existem
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='listings' 
      AND column_name IN ('delisted_check_count', 'last_delisted_check')
    `;
    
    const { rows: existingColumns } = await pool.query(checkQuery);
    
    if (existingColumns.length === 2) {
      console.log('✅ Colunas já existem na tabela listings\n');
      return;
    }

    // Aplicar migração
    const migrationQuery = `
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS delisted_check_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_delisted_check TIMESTAMP WITH TIME ZONE DEFAULT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_listings_delisted_check 
      ON listings(market_hash_name, delisted_check_count, last_delisted_check);
    `;

    await pool.query(migrationQuery);
    
    console.log('✅ Colunas adicionadas com sucesso!');
    console.log('✅ Índice de performance criado!\n');
    
    console.log('📋 Nova estrutura da tabela listings:');
    console.log('   - delisted_check_count: Contador de verificações (0-3)');
    console.log('   - last_delisted_check: Última verificação de delisted\n');
    
    console.log('🎯 O sistema está pronto para rastrear listings delisted!\n');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
