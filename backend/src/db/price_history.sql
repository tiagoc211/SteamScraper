-- Tabela para armazenar histórico de preços médios por item por dia
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    market_hash_name VARCHAR(500) NOT NULL,
    date DATE NOT NULL,
    avg_price INT, -- Preço médio do dia em cêntimos
    min_price INT, -- Preço mínimo do dia em cêntimos
    max_price INT, -- Preço máximo do dia em cêntimos
    listing_count INT, -- Número de listings nesse dia
    avg_float DOUBLE PRECISION, -- Float médio (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_item_date UNIQUE (market_hash_name, date)
);

-- Índices para acelerar queries
CREATE INDEX IF NOT EXISTS idx_price_history_name ON price_history(market_hash_name);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);
CREATE INDEX IF NOT EXISTS idx_price_history_name_date ON price_history(market_hash_name, date);
