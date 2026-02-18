// frontend/src/components/skin/BrowseSkinCard/BrowseSkinCard.js
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enGB, pt } from 'date-fns/locale';
import FloatBar from '../FloatBar/FloatBar';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import riflesData from '../../../data/Rifles';
import pistolsData from '../../../data/Pistols';
import smgsData from '../../../data/Smgs';
import heavyData from '../../../data/Heavy';
import knivesData from '../../../data/Knives';
import './BrowseSkinCard.css';

const RARITY_META = {
  Consumer: { color: '#b0c3d9', glow: 'rgba(176, 195, 217, 0.30)', surface: 'rgba(176, 195, 217, 0.14)', surfaceSoft: 'rgba(176, 195, 217, 0.04)' },
  Industrial: { color: '#5e98d9', glow: 'rgba(94, 152, 217, 0.30)', surface: 'rgba(94, 152, 217, 0.14)', surfaceSoft: 'rgba(94, 152, 217, 0.04)' },
  MilSpec: { color: '#4b69ff', glow: 'rgba(75, 105, 255, 0.30)', surface: 'rgba(75, 105, 255, 0.14)', surfaceSoft: 'rgba(75, 105, 255, 0.04)' },
  Restricted: { color: '#8847ff', glow: 'rgba(136, 71, 255, 0.32)', surface: 'rgba(136, 71, 255, 0.14)', surfaceSoft: 'rgba(136, 71, 255, 0.04)' },
  Classified: { color: '#d32ce6', glow: 'rgba(211, 44, 230, 0.32)', surface: 'rgba(211, 44, 230, 0.15)', surfaceSoft: 'rgba(211, 44, 230, 0.05)' },
  Covert: { color: '#ff2d2d', glow: 'rgba(255, 45, 45, 0.42)', surface: 'rgba(255, 45, 45, 0.20)', surfaceSoft: 'rgba(255, 45, 45, 0.07)' },
  Contraband: { color: '#e4ae39', glow: 'rgba(228, 174, 57, 0.35)', surface: 'rgba(228, 174, 57, 0.16)', surfaceSoft: 'rgba(228, 174, 57, 0.05)' },
};

const RARITY_ALIASES = {
  Consumer: 'Consumer',
  Industrial: 'Industrial',
  MilSpec: 'MilSpec',
  'Mil-Spec': 'MilSpec',
  Milspec: 'MilSpec',
  Restricted: 'Restricted',
  Classified: 'Classified',
  Covert: 'Covert',
  Contraband: 'Contraband',
};

const KNIFE_GLOVE_PATTERNS = [
  'knife', 'karambit', 'bayonet', 'butterfly', 'shadow daggers', 'daggers',
  'gloves', 'hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves',
  'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'
];

const normalizeSkinName = (name = '') =>
  name
    .replace(/^StatTrak™\s+/i, '')
    .replace(/^Souvenir\s+/i, '')
    .replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i, '')
    .trim();

const rarityNameBySkin = (() => {
  const map = new Map();
  const dataModules = [riflesData, pistolsData, smgsData, heavyData, knivesData];

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    Object.entries(node).forEach(([key, value]) => {
      const normalizedRarity = RARITY_ALIASES[key];

      if (normalizedRarity && Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry && typeof entry.name === 'string') {
            map.set(normalizeSkinName(entry.name), normalizedRarity);
          }
        });
        return;
      }

      if (value && typeof value === 'object') {
        walk(value);
      }
    });
  };

  dataModules.forEach(walk);
  return map;
})();

const resolveRarityKey = (skinName = '') => {
  const normalizedName = normalizeSkinName(skinName);
  const lowered = normalizedName.toLowerCase();

  if (KNIFE_GLOVE_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    return 'Covert';
  }

  return rarityNameBySkin.get(normalizedName) || null;
};

const BrowseSkinCard = React.forwardRef(({ item, variant = 'browse' }, ref) => {

  const rarityKey = resolveRarityKey(item.name);
  const rarityMeta = rarityKey ? RARITY_META[rarityKey] : null;
  const cardStyle = rarityMeta
    ? {
        '--rarity-glow': rarityMeta.glow,
        '--rarity-glow-soft': rarityMeta.surfaceSoft,
        '--rarity-text': rarityMeta.color,
        '--rarity-surface': rarityMeta.surface,
        '--rarity-surface-soft': rarityMeta.surfaceSoft,
      }
    : undefined;

  const formattedPrice = item.price 
    ? (item.price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
    : 'N/A';

  const timeAgo = item.scraped_at 
    ? formatDistanceToNow(parseISO(item.scraped_at), { addSuffix: false, locale: enGB })
    : null;

  const handleBuyClick = useCallback(async () => {
    console.log("Comprar item:", item.id);
  }, [item]);

  const CardContent = () => (
    <>
      <div className="card-header">
        <p className="item-name" title={item.name}>{item.name}</p>
      </div>

      <div className="card-image-container">
        <img src={item.image} alt={item.name} className="item-image" loading="lazy" />
        
        {item.stickers && item.stickers.length > 0 && (
          <div className="card-stickers-wrapper">
            {item.stickers.slice(0, 5).map((sticker, index) => (
              <HoverTooltip key={index} title={sticker.name} imageUrl={sticker.img} position="top">
                <img src={sticker.img} alt={sticker.name} className="card-sticker-image" />
              </HoverTooltip>
            ))}
          </div>
        )}

        {item.keychains && item.keychains.length > 0 && (
          <div className="card-charms-wrapper">
            {item.keychains.map((charm, index) => (
              <HoverTooltip key={index} title={charm.name} imageUrl={charm.image_url} position="top">
                <div className="card-charm-container">
                  <img src={charm.image_url} alt={charm.name} className="card-charm-image" />
                </div>
              </HoverTooltip>
            ))}
          </div>
        )}
      </div>

      <div className="card-info-footer">
        <div className="price-line">
          <span className="item-price">{formattedPrice}</span>
        </div>
        
        <div className="float-line">
            <FloatBar floatValue={item.float} paintSeed={item.pattern} />
        </div>
        
        {/* CORREÇÃO: 'last checked' movido para o seu próprio container */}
        {variant === 'browse' && timeAgo && (
            <div className="last-checked-line">
                <span>checked {timeAgo} ago</span>
            </div>
        )}
      </div>
    </>
  );

 if (variant === 'detail') {
    return (
      <div className="browse-card-wrapper glass-panel" ref={ref} style={cardStyle}>
        <article className="browse-skin-card">
          <CardContent />
        </article>
        <div className="card-hover-actions">
          <button className="action-btn inspect-btn" onClick={() => window.open(item.inspectLink, '_blank')}>Inspecionar</button>
          <button className="action-btn buy-btn" onClick={handleBuyClick}>Comprar</button>
        </div>
      </div>
    );
  }

  // A variante 'browse' (link)
  return (
    <Link ref={ref} to={`/skin/${encodeURIComponent(item.name)}`} className="browse-card-wrapper browse-card-link glass-panel" style={cardStyle}>
      <article className="browse-skin-card">
        <CardContent />
      </article>
    </Link>
  );
});

export default BrowseSkinCard;