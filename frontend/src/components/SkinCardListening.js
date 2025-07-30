import React from 'react';
import './SkinCardListening.css';

const SkinCardListening = ({ listing, inspectedData }) => {
  const item = inspectedData[listing.listingid];

  if (!item) return null;

  const {
    floatvalue,
    paintseed,
    wear_name,
    weapon_type,
    item_name,
    imageurl,
  } = item;

  const price = listing.price;
  const float = floatvalue?.toFixed(10);
  const pattern = paintseed;

  return (
    <div className="skin-card">
      <div className="skin-header">
        <div className="skin-title">★ {weapon_type} | {item_name}</div>
        <div className="skin-wear">{wear_name}</div>
      </div>

      <div className="skin-image-container">
        <img className="skin-image" src={imageurl || listing.image} alt={item_name} />
      </div>

      <div className="skin-price">
        <span>{parseFloat(price).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
      </div>

      <div className="skin-bar">
        <div className="float-gradient" />
        <div
          className="float-indicator"
          style={{ left: `${floatvalue * 100}%` }}
          title={`Float: ${float}`}
        />
      </div>

      <div className="skin-float-pattern">
        <div className="float">Float: {float}</div>
        <div className="pattern">Pattern: {pattern}</div>
      </div>

      <div className="stickers-container">
        {listing.stickers && listing.stickers.length > 0 ? (
          listing.stickers.map((stickerUrl, i) => (
            <img
              key={i}
              src={stickerUrl}
              alt={`Sticker ${i + 1}`}
              title={`Sticker ${i + 1}`}
              className="sticker-img"
            />
          ))
        ) : (
          <span className="no-stickers">Sem stickers</span>
        )}
      </div>

      <div className="skin-footer">
        <a
          className="inspect-btn"
          href={listing.inspectLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Inspecionar
        </a>
      </div>
    </div>
  );
};

export default SkinCardListening;
