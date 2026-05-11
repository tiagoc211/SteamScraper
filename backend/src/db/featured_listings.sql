-- Featured listings auction system
-- Each user can submit their own Steam skin listing for a weekly paid feature slot.
-- Rank is determined dynamically by bid_amount DESC.

CREATE TABLE IF NOT EXISTS featured_listings (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  market_hash_name TEXT NOT NULL,
  icon_url        TEXT,
  steam_listing_url TEXT NOT NULL,
  seller_display_name TEXT NOT NULL,
  bid_amount      INTEGER NOT NULL DEFAULT 50,  -- in cents, min 50 = 0.50 €
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  renewal_date    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_active ON featured_listings (active, bid_amount DESC);
