-- ==================================================
-- ROLES
-- ==================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- ==================================================
-- SUBSCRIPTION TYPE
-- ==================================================
CREATE TABLE subscription_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    max_searches_per_day INT,
    max_results_per_search INT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- SUBSCRIPTIONS
-- ==================================================
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    type INT NOT NULL REFERENCES subscription_type(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- UTILIZADORES
-- ==================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    steam_id BIGINT UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    email VARCHAR(150) UNIQUE,
    role_id INT REFERENCES roles(id),
    subscription_id INT,
    status VARCHAR(50) DEFAULT 'ATIVO',
    balance NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- ==================================================
-- LOGS ACTIVITY
-- ==================================================
CREATE TABLE logs_activity (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- PAYMENTS
-- ==================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    subscription_id INT NOT NULL REFERENCES subscriptions(id),
    user_id INT NOT NULL REFERENCES users(id),
    amount NUMERIC NOT NULL,
    method VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- SUBSCRIPTION HISTORY
-- ==================================================
CREATE TABLE subscription_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    subscription_id INT NOT NULL REFERENCES subscriptions(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- CONDITIONS
-- ==================================================
CREATE TABLE conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- ==================================================
-- STICKERS
-- ==================================================
CREATE TABLE stickers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);


-- ==================================================
-- WEAPONS
-- ==================================================
CREATE TABLE weapons (
    id SERIAL PRIMARY KEY,
    weapon_type VARCHAR(50),
    weapon_name VARCHAR(50),
    skin_name VARCHAR(50),
    condition VARCHAR(50),
    is_stattrack BOOLEAN DEFAULT FALSE
);

-- ==================================================
-- ALERTS PARAM
-- ==================================================
CREATE TABLE alerts_param (
    id SERIAL PRIMARY KEY,
    weapon_id INT REFERENCES weapons(id),
    condition INT REFERENCES conditions(id),
    price_left NUMERIC,
    price_right NUMERIC,
    pattern INT,
    stickers INT REFERENCES stickers(id),
    float NUMERIC
);


-- ==================================================
-- ALERTS
-- ==================================================
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    status VARCHAR(50),
    alert_parameters INT REFERENCES alerts_param(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- USER SETTINGS
-- ==================================================
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id),
    language VARCHAR(10),
    alerts_settings JSONB DEFAULT '{}'::jsonb,
    currency VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

