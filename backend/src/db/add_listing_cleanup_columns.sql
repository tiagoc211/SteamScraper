-- Migration: Add listing cleanup tracking columns
-- Execute: psql -U <usuario> -d <database> -f add_listing_cleanup_columns.sql

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS delisted_check_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_delisted_check TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Índice para melhorar performance de queries que usam delisted_check_count
CREATE INDEX IF NOT EXISTS idx_listings_delisted_check 
ON listings(market_hash_name, delisted_check_count, last_delisted_check);

COMMENT ON COLUMN listings.delisted_check_count IS 'Contador de quantas vezes esta listing foi verificada como possível delisted (ex: passou do preço mínimo). Ao atingir 3, é seguro remover.';

COMMENT ON COLUMN listings.last_delisted_check IS 'Timestamp da última verificação de delisted. Usado para cleanup automático de listings antigas.';
