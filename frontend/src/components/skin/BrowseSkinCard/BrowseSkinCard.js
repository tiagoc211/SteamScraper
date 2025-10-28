// src/components/skin/BrowseSkinCard/BrowseSkinCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import FloatBar from '../FloatBar/FloatBar';
import './BrowseSkinCard.css';

const BrowseSkinCard = React.forwardRef(({ item }, ref) => {

  // CORREÇÃO: O preço agora vem em cêntimos, como na sua tabela
  const formattedPrice = item.price 
    ? (item.price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
    : 'N/A';
  
  const linkTarget = item.name;

  return (
    <Link ref={ref} to={`/skin/${encodeURIComponent(linkTarget)}`} className="browse-card-link">
      <article className="browse-skin-card" style={{ '--rarity-color': item.rarity?.color || '#2a475e' }}>
        
        <div className="card-header">
          <p className="item-name" title={item.name}>{item.name}</p>
          <span className="item-rarity-text">{item.rarity?.name}</span>
        </div>

        <div className="card-image-container">
          <img src={item.image} alt={item.name} className="item-image" loading="lazy" />
          {item.stickers && item.stickers.length > 0 && (
            <div className="card-stickers-wrapper">
              {item.stickers.map((sticker, index) => (
                <img 
                  key={index} 
                  src={sticker.img} 
                  alt={sticker.name} 
                  className="card-sticker-image"
                  title={sticker.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="card-info-footer">
          <div className="price-line">
            <span className="item-price">{formattedPrice}</span>
          </div>
          <FloatBar floatValue={item.float} paintSeed={item.pattern} />
        </div>

      </article>
    </Link>
  );
});

export default BrowseSkinCard;