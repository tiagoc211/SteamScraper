CREATE TABLE search_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    searches INTEGER DEFAULT 0,
    alarms INTEGER DEFAULT 0,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);
