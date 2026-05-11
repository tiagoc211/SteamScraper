// frontend/src/components/skin/FeaturedSection/FeaturedSection.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getFeaturedListings,
  createFeaturedListing,
  renewFeaturedListing,
  deleteFeaturedListing,
  getMyFeaturedSkins,
  getRandomItems,
} from '../../../api/api';
import Carousel from '../../ui/Carousel/Carousel';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import './FeaturedSection.css';

const MEDAL = ['🥇', '🥈', '🥉'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (cents) =>
  (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
};

// ─── Skin Picker ──────────────────────────────────────────────────────────────
const SkinPicker = ({ onSelect, selected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q) => {
    setLoading(true);
    const data = await getMyFeaturedSkins(q);
    setResults(data.skins || []);
    setLoading(false);
    setOpen(true);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (selected) onSelect(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleFocus = () => {
    if (results === null) search('');
    else setOpen(true);
  };

  const handlePick = (skin) => {
    onSelect(skin);
    setQuery(skin.market_hash_name);
    setOpen(false);
  };

  return (
    <div className="ft-picker" ref={wrapperRef}>
      <div className={`ft-picker-field ${selected ? 'has-selection' : ''}`}>
        {selected && (
          <img
            className="ft-picker-thumb"
            src={`https://community.akamai.steamstatic.com/economy/image/${selected.icon_url}/96fx62f`}
            alt=""
          />
        )}
        <input
          className="ft-picker-input"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder="Pesquisa uma arma tua na nossa BD..."
          autoComplete="off"
        />
        {loading && <span className="ft-picker-spinner" />}
      </div>

      {open && (
        <div className="ft-picker-dropdown">
          {results === null || loading ? (
            <div className="ft-picker-msg">A carregar...</div>
          ) : results.length === 0 ? (
            <div className="ft-picker-empty">
              <p>Nenhuma arma encontrada na base de dados.</p>
              <p className="ft-picker-hint">
                A tua arma ainda não foi capturada.<br />
                Pesquisa a skin no mercado da Steam e aguarda que seja detectada.
              </p>
            </div>
          ) : (
            results.map((skin) => {
              const imgUrl = skin.icon_url
                ? `https://community.akamai.steamstatic.com/economy/image/${skin.icon_url}/96fx62f`
                : null;
              return (
                <div key={skin.listing_id} className="ft-picker-row" onClick={() => handlePick(skin)}>
                  {imgUrl && <img src={imgUrl} alt="" className="ft-picker-row-img" />}
                  <div className="ft-picker-row-info">
                    <span className="ft-picker-row-name">{skin.market_hash_name}</span>
                    <span className="ft-picker-row-meta">
                      {skin.price ? formatPrice(skin.price) : '—'}
                      {skin.float_value != null ? ` · FL ${parseFloat(skin.float_value).toFixed(4)}` : ''}
                      {skin.paint_seed ? ` · #${skin.paint_seed}` : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const FeaturedModal = ({ topBidCents, onClose, onSubmit, loading, error }) => {
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [sellerName, setSellerName] = useState('');
  const [bidAmount, setBidAmount] = useState(
    topBidCents != null ? ((topBidCents + 10) / 100).toFixed(2) : '0.50'
  );

  const suggestedMin = topBidCents != null ? formatPrice(topBidCents + 10) : '0,50 €';

  const steamListingUrl = selectedSkin
    ? `https://steamcommunity.com/market/listings/730/${encodeURIComponent(selectedSkin.market_hash_name)}`
    : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSkin) return;
    onSubmit({
      market_hash_name: selectedSkin.market_hash_name,
      icon_url: selectedSkin.icon_url || '',
      steam_listing_url: steamListingUrl,
      seller_display_name: sellerName,
      bid_amount: bidAmount,
    });
  };

  return (
    <div className="ft-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ft-modal glass-panel">
        <button className="ft-modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <h2 className="ft-modal-title">Destaca a tua arma</h2>
        <p className="ft-modal-desc">
          A tua skin em destaque aparece em primeiro lugar para todos os visitantes.
          O ranking é actualizado em tempo real — quem pagar mais fica no topo.
        </p>

        {/* Auction stats */}
        <div className="ft-stats">
          <div className="ft-stat">
            <span className="ft-stat-label">Lance no topo</span>
            <span className="ft-stat-value accent">
              {topBidCents != null ? formatPrice(topBidCents) : '—'}
            </span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-label">Para ficar em #1</span>
            <span className="ft-stat-value">{suggestedMin}</span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-label">Mínimo</span>
            <span className="ft-stat-value">0,50 €</span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-label">Duração</span>
            <span className="ft-stat-value">7 dias</span>
          </div>
        </div>

        {/* Notice */}
        <div className="ft-notice">
          Só podes destacar armas que <strong>já se encontrem na nossa base de dados</strong>.
          Pesquisa a tua skin no site para que o sistema a detecte automaticamente.
        </div>

        <form className="ft-form" onSubmit={handleSubmit}>
          <div className="ft-field">
            <label className="ft-label">Escolhe a tua arma *</label>
            <SkinPicker onSelect={setSelectedSkin} selected={selectedSkin} />
          </div>

          {selectedSkin && (
            <div className="ft-preview">
              <img
                src={`https://community.akamai.steamstatic.com/economy/image/${selectedSkin.icon_url}/200fx200f`}
                alt={selectedSkin.market_hash_name}
              />
              <div className="ft-preview-info">
                <span className="ft-preview-name">{selectedSkin.market_hash_name}</span>
                <a className="ft-preview-link" href={steamListingUrl} target="_blank" rel="noopener noreferrer">
                  Ver no Steam Market →
                </a>
              </div>
            </div>
          )}

          <div className="ft-field">
            <label className="ft-label">Nome / tag de vendedor *</label>
            <input
              className="ft-input"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="ex: TraderPT"
              required
              maxLength={40}
            />
          </div>

          <div className="ft-field">
            <label className="ft-label">Lance semanal (€) *</label>
            <div className="ft-bid-row">
              <span className="ft-bid-symbol">€</span>
              <input
                className="ft-input ft-bid-input"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                type="number"
                min="0.50"
                step="0.10"
                required
              />
            </div>
            <span className="ft-hint">Mínimo: 0,50 € · Para liderar paga mais do que {suggestedMin}</span>
          </div>

          {error && <div className="ft-error">{error}</div>}

          <button type="submit" className="glow-btn ft-submit" disabled={loading || !selectedSkin}>
            {loading ? 'A submeter...' : 'Colocar em destaque'}
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
    <div className={`ft-row ${Number(item.rank) <= 3 ? `ft-row--top${item.rank}` : ''}`}>
      <div className="ft-row-rank">
        {Number(item.rank) <= 3 ? MEDAL[item.rank - 1] : <span className="ft-row-rank-num">#{item.rank}</span>}
      </div>
      <div className="ft-row-img">
        {imageUrl ? <img src={imageUrl} alt={item.market_hash_name} /> : <div className="ft-row-img-ph">?</div>}
      </div>
      <div className="ft-row-info">
        <a href={item.steam_listing_url} target="_blank" rel="noopener noreferrer" className="ft-row-name">
          {item.market_hash_name}
        </a>
        <span className="ft-row-seller">por {item.seller_display_name}</span>
      </div>
      <div className="ft-row-bid">
        <span className="ft-row-bid-val">{formatPrice(item.bid_amount)}</span>
        <span className="ft-row-bid-unit">/semana</span>
      </div>
      <div className={`ft-row-exp ${isExpiringSoon ? 'ft-row-exp--soon' : ''}`}>
        {days === 0 ? 'Hoje' : `${days}d`}
      </div>
      {isOwner && (
        <div className="ft-row-actions">
          <button className="ft-row-btn ft-row-btn--renew" onClick={() => onRenew(item)} title="Renovar">↺</button>
          <button className="ft-row-btn ft-row-btn--del" onClick={() => onDelete(item.id)} title="Remover">×</button>
        </div>
      )}
    </div>
  );
};

// ─── Main FeaturedSection ─────────────────────────────────────────────────────
const FeaturedSection = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [randomItems, setRandomItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [featuredData, randomData] = await Promise.all([
        getFeaturedListings(),
        getRandomItems(20),
      ]);
      setItems(featuredData.items || []);
      setRandomItems(randomData.items || []);
    } catch (err) {
      console.error('FeaturedSection fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const topBidCents = items.length > 0 ? items[0].bid_amount : null;
  const hasPaidItems = items.length > 0;

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setFormError(null);
    const result = await createFeaturedListing(form);
    setSubmitting(false);
    if (result.success) {
      setShowModal(false);
      fetchData();
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
      fetchData();
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tens a certeza que queres remover o destaque?')) return;
    await deleteFeaturedListing(id);
    fetchData();
  };

  const handleRenew = (item) => {
    setRenewTarget(item);
    setFormError(null);
    setShowModal(true);
  };

  return (
    <section className="ft-section">
      {/* ── Header ──────────────────────────────────── */}
      <div className="ft-banner glass-panel">
        <div className="ft-banner-top">
          <div>
            <h2 className="ft-title">Armas em Destaque</h2>
            <p className="ft-subtitle">
              {hasPaidItems
                ? 'Os melhores vendedores da semana · Rankings actualizados em tempo real'
                : 'Descubra as melhores skins do mercado'}
            </p>
          </div>
          <button
            className="glow-btn ft-cta"
            onClick={() => { setRenewTarget(null); setFormError(null); setShowModal(true); }}
          >
            + Destacar arma
          </button>
        </div>

        {/* ── Content: paid ranking OR random carousel ── */}
        {loading ? (
          <div className="ft-empty">A carregar destaques...</div>
        ) : hasPaidItems ? (
          /* Paid featured ranking table */
          <div className="ft-table-inner">
            <div className="ft-table-head">
              <span>Rank</span><span></span><span>Skin</span><span>Lance</span><span>Expira</span><span></span>
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
          </div>
        ) : randomItems.length > 0 ? (
          /* Fallback: random skins carousel */
          <div className="ft-carousel-area">
            <Carousel
              items={randomItems}
              renderItem={(item) => {
                const imageUrl = item.icon_url
                  ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`
                  : 'https://via.placeholder.com/200';
                return (
                  <Link
                    to={(() => {
                      const params = new URLSearchParams();
                      if (item.price) {
                        const priceEur = item.price / 100;
                        params.set('priceMin', (priceEur * 0.9).toFixed(2));
                        params.set('priceMax', (priceEur * 1.1).toFixed(2));
                      }
                      if (item.float_value) {
                        const f = parseFloat(item.float_value);
                        params.set('floatMin', Math.max(0, f - 0.005).toFixed(4));
                        params.set('floatMax', Math.min(1, f + 0.005).toFixed(4));
                      }
                      if (item.paint_seed) params.set('pattern', item.paint_seed);
                      return `/skin/${encodeURIComponent(item.market_hash_name)}?${params.toString()}`;
                    })()}
                    className="banner-item-card"
                  >
                    <div className="banner-item-image">
                      <img src={imageUrl} alt={item.market_hash_name} />
                    </div>
                    <div className="banner-item-extras">
                      {item.stickers?.slice(0, 4).map((sticker, i) => (
                        <HoverTooltip key={i} title={sticker.name} imageUrl={sticker.img} position="top">
                          <img src={sticker.img} alt={sticker.name} className="banner-extra-img" />
                        </HoverTooltip>
                      ))}
                      {item.keychains?.slice(0, 1).map((charm, i) => (
                        <HoverTooltip key={`charm-${i}`} title={charm.name} imageUrl={charm.image_url} position="top">
                          <img src={charm.image_url} alt={charm.name} className="banner-extra-img banner-charm-img" />
                        </HoverTooltip>
                      ))}
                    </div>
                    <div className="banner-item-info">
                      <h4 className="banner-item-name">{item.market_hash_name}</h4>
                      <span className="banner-avg-price">{formatPrice(item.price)}</span>
                      <div className="banner-item-tags">
                        {item.float_value && (
                          <HoverTooltip title="Float" position="top" compact>
                            <span className="banner-tag banner-tag-float">
                              FL {parseFloat(item.float_value).toFixed(4)}
                            </span>
                          </HoverTooltip>
                        )}
                        {item.paint_seed && (
                          <HoverTooltip title="Pattern" position="top" compact>
                            <span className="banner-tag banner-tag-pattern">
                              #{item.paint_seed}
                            </span>
                          </HoverTooltip>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              }}
              itemsPerView={5}
              autoPlay={true}
              autoPlayInterval={4000}
            />
          </div>
        ) : (
          <div className="ft-empty">
            <p>Nenhuma arma em destaque esta semana.</p>
            <p>Sê o primeiro a destacar a tua skin!</p>
          </div>
        )}
      </div>

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

