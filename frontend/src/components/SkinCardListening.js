import React from 'react';
import './SkinCardListening.css';

const SkinCardListening = ({ listing, inspectedData, marketHashName }) => {
  const item = inspectedData[listing.listingid];

  if (!item) {
    return null; 
  }

  const {
    floatvalue,
    paintseed,
    wear_name,
    imageurl,
    stickers, // Dos dados de inspeção
    full_item_name,
  } = item;
  
  // Os charms vêm do 'listing' original
  const { keychains } = listing;

  const steamMarketUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`;
  const highResImageUrl = (imageurl || listing.image).replace('360fx360f', '512fx512f');
  const priceValue = parseFloat(listing.price);
  const formattedPrice = priceValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  const getWearColor = (wearFloat) => {
    if (wearFloat < 0.07) return '#86c55c';
    if (wearFloat < 0.15) return '#a4c55c';
    if (wearFloat < 0.37) return '#c5c25c';
    if (wearFloat < 0.45) return '#c59a5c';
    return '#c55c5c';
  };

  const handleBuyClick = async () => {
    try {
      const maxPriceCents = formattedPrice;
      const res = await fetch('http://localhost:3001/api/tokens/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamUrl: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`,
          listingId: listing.listingid,
          maxPriceCents,
          itemName: listing.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        alert('Erro ao gerar token de compra.');
        return;
      }

      window.postMessage({
        type: 'SS_BUY_REQUEST',
        steamUrl: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`,
        listingId: listing.listingid,
        expectedPrice: maxPriceCents / 100,
        itemName: listing.name,
        token: data.token
      }, window.origin);

    } catch (err) {
      console.error('Erro no handleBuyClick:', err);
      alert('Falha ao processar compra.');
    }
  };

  return (
    <div className="skin-card-listening">
      <div className="card-header">
        <span className="item-name">★ {full_item_name}</span>
      </div>
      <div className="item-image-container">
        <div className="smoke-effect"></div>
        <img className="skin-image" src={highResImageUrl} alt={listing.name} />
        {keychains && keychains.length > 0 && (
          <div className="charms-wrapper">
            {keychains.map((keychain, index) => (
              <div key={index} className="charm-container">
                <img 
                    src={keychain.image_url} 
                    alt={keychain.name}
                    title={keychain.name}
                    className="charm-image" 
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="item-price">{formattedPrice}</div>
        <div className="float-bar-container">
          <div className="float-bar-gradient" />
          <div
            className="float-indicator"
            style={{ left: `${floatvalue * 100}%` }}
            title={`Float: ${floatvalue?.toFixed(8)}`}
          />
        </div>
        <div className="item-details">
          <span>Float: {floatvalue?.toFixed(8)}</span>
          <span>Pattern: {paintseed}</span>
        </div>
 <div className="item-stickers">
        {listing.stickers && listing.stickers.length > 0 ? (
          listing.stickers.map((stickerUrl, i) => (
            <img
              key={i}
              src={stickerUrl}
              alt={stickers[i].name}
              title={stickers[i].name}
              className="sticker-image"
            />
          ))
        ) : (
          <span className="no-stickers">Sem stickers</span>
        )}
      </div>
        <div className="card-actions">
          <button
            className="inspect-button"
            onClick={() => window.open(listing.inspectLink, '_blank')}
          >
            Inspecionar
          </button>
          <button className="buy-button" onClick={handleBuyClick}>
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkinCardListening;