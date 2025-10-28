CREATE TABLE search_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    searches INTEGER DEFAULT 0,
    alarms INTEGER DEFAULT 0,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);


CREATE TABLE listings (
    listing_id VARCHAR(255) PRIMARY KEY, -- ID do listing da Steam, que é único
    item_id BIGINT REFERENCES items(a), -- Chave estrangeira para a tabela 'items'
    price INT, -- Preço total em cêntimos para evitar problemas com decimais
    fee INT, -- Taxa da Steam em cêntimos
    seller_steam_id VARCHAR(255),
    seller_avatar_url TEXT,
    float_value DOUBLE PRECISION, -- Usar DOUBLE PRECISION para floats com muitas casas decimais
    paint_seed INT,
    paint_index INT,
    stickers JSONB, -- JSONB é mais eficiente para pesquisar do que JSON
    inspect_link TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Para sabermos quando foi a última vez que foi atualizado
);

-- (Opcional, mas recomendado) Criar um índice na chave estrangeira para acelerar as buscas
CREATE INDEX idx_listings_item_id ON listings(item_id);