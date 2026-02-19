// frontend/src/components/skin/FeaturedSection/FeaturedSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { getFeaturedListings, createFeaturedListing, renewFeaturedListing, deleteFeaturedListing } from '../../../api/api';
import './FeaturedSection.css';

const MEDAL = ['🥇', '🥈', '🥉'];

const formatPrice = (cents) =>
  (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const FeaturedModal = ({ topBidCents, onClose, onSubmit, loading, error }) => {
  const [form, setForm] = useState({
    market_hash_name: '',
    steam_listing_url: '',
    seller_display_name: '',
    icon_url: '',
    bid_amount: topBidCents != null ? ((topBidCents + 10) / 100).toFixed(2) : '0.50',
  });

  const suggestedMin = topBidCents != null
    ? formatPrice(topBidCents + 10)
    : '0,50 €';

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="featured-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="featured-modal glass-panel">
        <button className="featured-modal-close" onClick={onClose}>×</button>
        <div className="featured-modal-header">
          <h2>🏆 Destaca a tua arma</h2>
          <p>A tua skin em destaque aparece em primeiro lugar para todos os visitantes. O ranking é actualizado em tempo real — quem pagar mais fica no topo.</p>
        </div>

        {/* Current top bid info */}
        <div className="featured-auction-info">
          <div className="auction-info-row">
            <span className="auction-info-label">Lance actual no topo</span>
            <span className="auction-info-value highlight">
              {topBidCents != null ? formatPrice(topBidCents) : '—'}
            </span>
          </div>
          <div className="auction-info-row">
            <span className="auction-info-label">Sugestão para ficar em #1</span>
            <span className="auction-info-value">{suggestedMin}</span>
          </div>
          <div className="auction-info-row">
            <span className="auction-info-label">Lance mínimo</span>
            <span className="auction-info-value">0,50 €</span>
          </div>
          <div className="auction-info-row">
            <span className="auction-info-label">Duração do destaque</span>
            <span className="auction-info-value">7 dias</span>
          </div>
        </div>

        <form className="featured-form" onSubmit={handleSubmit}>
          <div className="featured-form-group">
            <label>Nome da skin (market hash name) *</label>
            <input
              name="market_hash_name"
              value={form.market_hash_name}
              onChange={handleChange}
              placeholder="ex: AK-47 | Redline (Field-Tested)"
              required
              autoComplete="off"
            />
          </div>

          <div className="featured-form-group">
            <label>Link do listing na Steam *</label>
            <input
              name="steam_listing_url"
              value={form.steam_listing_url}
              onChange={handleChange}
              placeholder="https://steamcommunity.com/market/listings/..."
              required
              type="url"
            />
          </div>

          <div className="featured-form-group">
            <label>Teu nome / tag de vendedor *</label>
            <input
              name="seller_display_name"
              value={form.seller_display_name}
              onChange={handleChange}
              placeholder="ex: TraderPT"
              required
              maxLength={40}
            />
          </div>

          <div className="featured-form-group">
            <label>URL da imagem da skin (opcional)</label>
            <input
              name="icon_url"
              value={form.icon_url}
              onChange={handleChange}
              placeholder="https://community.akamai.steamstatic.com/economy/image/..."
            />
            <small>Deixa vazio para usar imagem automática do CS:Market Glasses.</small>
          </div>

          <div className="featured-form-group featured-form-bid">
            <label>O teu lance semanal (€) *</label>
            <div className="bid-input-wrapper">
              <span className="bid-currency">€</span>
              <input
                name="bid_amount"
                value={form.bid_amount}
                onChange={handleChange}
                type="number"
                min="0.50"
                step="0.10"
                required
              />
            </div>
            <small>Lance mínimo: 0,50 € · Para liderar o ranking paga mais do que {suggestedMin}</small>
          </div>

          {error && <div className="featured-form-error">{error}</div>}

          <button type="submit" className="featured-submit-btn" disabled={loading}>
            {loading ? 'A submeter...' : '🚀 Colocar em destaque'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Ranking Row ──────────────────────────────────────────────────────────────
const RankingRow = ({ item, currentUserId, onDelete, onRenew }) => {
  const isOwner = currentUserId && item.user_id === currentUserId;
  const days = daysUntil(item.renewal_date);
  const isExpiringSoon = days <= 2;

  const imageUrl = item.icon_url
    ? (item.icon_url.startsWith('http')
        ? item.icon_url
        : `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`)
    : null;

  return (
    <div className={`featured-rank-row ${Number(item.rank) <= 3 ? `rank-top-${item.rank}` : ''}`}>
      <div className="rank-position">
        {Number(item.rank) <= 3 ? MEDAL[item.rank - 1] : <span className="rank-num">#{item.rank}</span>}
      </div>

      <div className="rank-image">
        {imageUrl ? (
          <img src={imageUrl} alt={item.market_hash_name} />
        ) : (
          <div className="rank-image-placeholder">?</div>
        )}
      </div>

      <div className="rank-info">
        <a href={item.steam_listing_url} target="_blank" rel="noopener noreferrer" className="rank-skin-name">
          {item.market_hash_name}
        </a>
        <span className="rank-seller">por {item.seller_display_name}</span>
      </div>

      <div className="rank-bid">
        <span className="rank-bid-amount">{formatPrice(item.bid_amount)}</span>
        <span className="rank-bid-label">/semana</span>
      </div>

      <div className={`rank-expires ${isExpiringSoon ? 'expiring-soon' : ''}`}>
        {days === 0 ? 'Expira hoje' : `${days}d`}
      </div>

      {isOwner && (
        <div className="rank-actions">
          <button className="rank-btn renew" onClick={() => onRenew(item)} title="Renovar destaque">↺</button>
          <button className="rank-btn remove" onClick={() => onDelete(item.id)} title="Remover destaque">×</button>
        </div>
      )}
    </div>
  );
};

// ─── Main FeaturedSection ─────────────────────────────────────────────────────
const FeaturedSection = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    const data = await getFeaturedListings();
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  const topBidCents = items.length > 0 ? items[0].bid_amount : null;

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setFormError(null);
    const result = await createFeaturedListing(form);
    setSubmitting(false);
    if (result.success) {
      setShowModal(false);
      fetchFeatured();
    } else {
      setFormError(result.error);
    }
  };

  const handleRenewSubmit = async (form) => {
    setSubmitting(true);
    setFormError(null);
    const result = await renewFeaturedListing(renewTarget.id, form.bid_amount);
    setSubmitting(false);
    if (result.success) {
      setShowModal(false);
      setRenewTarget(null);
      fetchFeatured();
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tens a certeza que queres remover o destaque?')) return;
    await deleteFeaturedListing(id);
    fetchFeatured();
  };

  const handleRenew = (item) => {
    setRenewTarget(item);
    setFormError(null);
    setShowModal(true);
  };

  return (
    <section className="featured-section">
      {/* Header */}
      <div className="featured-section-header">
        <div className="featured-section-title-group">
          <h2 className="featured-section-title">🏆 Armas em Destaque</h2>
          <p className="featured-section-sub">
            Os melhores vendedores da semana · Rankings actualizados em tempo real
          </p>
        </div>
        <button
          className="featured-cta-btn"
          onClick={() => { setRenewTarget(null); setFormError(null); setShowModal(true); }}
        >
          ✦ Destaca a tua arma
        </button>
      </div>

      {/* Ranking */}
      <div className="featured-ranking">
        {loading ? (
          <div className="featured-loading">A carregar destaques...</div>
        ) : items.length === 0 ? (
          <div className="featured-empty">
            <p>Nenhuma arma em destaque esta semana.</p>
            <p>Sê o primeiro a destacar a tua skin!</p>
          </div>
        ) : (
          <>
            <div className="featured-rank-header">
              <span>Rank</span>
              <span></span>
              <span>Skin</span>
              <span>Lance</span>
              <span>Expira</span>
              <span></span>
            </div>
            {items.map((item) => (
              <RankingRow
                key={item.id}
                item={item}
                currentUserId={currentUser?.id}
                onDelete={handleDelete}
                onRenew={handleRenew}
              />
            ))}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FeaturedModal
          topBidCents={topBidCents}
          renewTarget={renewTarget}
          onClose={() => { setShowModal(false); setRenewTarget(null); }}
          onSubmit={renewTarget ? handleRenewSubmit : handleSubmit}
          loading={submitting}
          error={formError}
        />
      )}
    </section>
  );
};

export default FeaturedSection;
