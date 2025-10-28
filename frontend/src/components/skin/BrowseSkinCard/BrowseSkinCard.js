// src/components/skin/BrowseSkinCard/BrowseSkinCard.js
import React from 'react'; // Importar o React
import { Link } from 'react-router-dom';
import './BrowseSkinCard.css';

// CORREÇÃO: Envolvemos o componente com React.forwardRef
const BrowseSkinCard = React.forwardRef(({ item }, ref) => {
  const linkTarget = item.market_hash_name || item.name;

  return (
    // A 'ref' é passada para o elemento principal que queremos observar (o Link)
    <Link ref={ref} to={`/skin/${encodeURIComponent(linkTarget)}`} className="browse-card-link">
      <article className="browse-skin-card" style={{ '--rarity-color': item.rarity?.color || '#2a475e' }}>
        <div className="card-header">
          <p className="item-name" title={item.name}>{item.name}</p>
        </div>
        <div className="card-image-container">
          <img src={item.image} alt={item.name} className="item-image" loading="lazy" />
        </div>
        <div className="card-footer">
          <span className="item-rarity">{item.rarity?.name || 'Base Grade'}</span>
        </div>
      </article>
    </Link>
  );
});

export default BrowseSkinCard;