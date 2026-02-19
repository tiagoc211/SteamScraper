// backend/src/routes/featuredRoutes.js
const express = require('express');
const pool = require('../db/index.js');
const ensureAuthenticated = require('../middleware/authMiddleware');

const router = express.Router();

const MIN_BID_CENTS = 50; // 0.50 €

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/featured
// Lista todas as armas em destaque activas, ordenadas por bid_amount DESC.
// Expira automaticamente as que ultrapassaram renewal_date.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Expirar automaticamente os destaques vencidos
    await pool.query(
      `UPDATE featured_listings SET active = FALSE
       WHERE active = TRUE AND renewal_date < NOW()`
    );

    const result = await pool.query(
      `SELECT
         id,
         user_id,
         market_hash_name,
         icon_url,
         steam_listing_url,
         seller_display_name,
         bid_amount,
         renewal_date,
         created_at,
         ROW_NUMBER() OVER (ORDER BY bid_amount DESC, created_at ASC) AS rank
       FROM featured_listings
       WHERE active = TRUE
       ORDER BY bid_amount DESC, created_at ASC`
    );

    res.json({ success: true, items: result.rows });
  } catch (err) {
    console.error('GET /api/featured error:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/featured
// Cria um novo destaque. Requer autenticação.
// Body: { market_hash_name, icon_url?, steam_listing_url, seller_display_name, bid_amount }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', ensureAuthenticated, async (req, res) => {
  const { market_hash_name, icon_url, steam_listing_url, seller_display_name, bid_amount } = req.body;

  if (!market_hash_name || !steam_listing_url || !seller_display_name || bid_amount == null) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios em falta.' });
  }

  const bidCents = Math.round(parseFloat(bid_amount) * 100);
  if (isNaN(bidCents) || bidCents < MIN_BID_CENTS) {
    return res.status(400).json({ success: false, error: `O lance mínimo é de 0,50 €.` });
  }

  // Verificar se o URL parece um link Steam válido
  if (!steam_listing_url.includes('steamcommunity.com') && !steam_listing_url.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'URL do listing Steam inválido.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO featured_listings
         (user_id, market_hash_name, icon_url, steam_listing_url, seller_display_name, bid_amount, renewal_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
       RETURNING *`,
      [req.userId, market_hash_name, icon_url || null, steam_listing_url, seller_display_name, bidCents]
    );

    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('POST /api/featured error:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/featured/:id/renew
// Renova o destaque por mais 7 dias. Pode actualizar o bid_amount.
// Requer autenticação e ser o dono do destaque.
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/renew', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { bid_amount } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM featured_listings WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destaque não encontrado ou sem permissão.' });
    }

    let newBidCents = existing.rows[0].bid_amount;
    if (bid_amount != null) {
      newBidCents = Math.round(parseFloat(bid_amount) * 100);
      if (isNaN(newBidCents) || newBidCents < MIN_BID_CENTS) {
        return res.status(400).json({ success: false, error: 'O lance mínimo é de 0,50 €.' });
      }
    }

    const result = await pool.query(
      `UPDATE featured_listings
       SET active = TRUE, renewal_date = NOW() + INTERVAL '7 days', bid_amount = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newBidCents, id, req.userId]
    );

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/featured/:id/renew error:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/featured/:id
// Desactiva o destaque. Requer autenticação e ser o dono.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE featured_listings SET active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destaque não encontrado ou sem permissão.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/featured/:id error:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

module.exports = router;
