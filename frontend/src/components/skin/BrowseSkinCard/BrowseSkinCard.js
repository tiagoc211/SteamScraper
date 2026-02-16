// frontend/src/components/skin/BrowseSkinCard/BrowseSkinCard.js
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enGB, pt } from 'date-fns/locale';
import FloatBar from '../FloatBar/FloatBar';
import HoverTooltip from '../../ui/HoverTooltip/HoverTooltip';
import './BrowseSkinCard.css';

const BrowseSkinCard = React.forwardRef(({ item, variant = 'browse' }, ref) => {

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
          <span className="item-rarity-text" style={{ color: item.rarity?.color }}>{item.rarity?.name}</span>
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
      <div className="browse-card-wrapper" ref={ref}>
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
    <Link ref={ref} to={`/skin/${encodeURIComponent(item.name)}`} className="browse-card-wrapper browse-card-link">
      <article className="browse-skin-card">
        <CardContent />
      </article>
    </Link>
  );
});

export default BrowseSkinCard;