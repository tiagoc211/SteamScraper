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

  const handleBuyClick = async () => {
    try {
      // Convert price para cêntimos (remover símbolos e vírgulas)
      const priceNumber = parseFloat(
        price.replace(/[^\d,.-]/g, '').replace(',', '.')
      );
      const maxPriceCents = Math.round(priceNumber * 100);

      // Chamar backend para obter token
      console.log("[UI] a pedir token...");
      const res = await fetch('http://localhost:3001/api/tokens/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamUrl: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(listing.name)}`,
          listingId: listing.listingid,
          maxPriceCents,
          itemName: item_name,
        }),
      });

      const data = await res.json();
      console.log("[UI] token?", res.ok, !!data.token);

      if (!res.ok || !data.token) {
        alert('Erro ao gerar token de compra.');
        return;
      }

      // Enviar token e dados à extensão
      // Em vez de chrome.runtime.sendMessage(...), usa:
      console.log("[UI] a enviar SS_BUY_REQUEST");
      window.postMessage({
        type: 'SS_BUY_REQUEST',
        steamUrl: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(listing.name)}`,
        listingId: listing.listingid,
        expectedPrice: maxPriceCents / 100,
        itemName: item_name,
        token: data.token
      }, window.origin);


    } catch (err) {
      console.error('Erro no handleBuyClick:', err);
      alert('Falha ao processar compra.');
    }
  };

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
        <button className="buy-btn" onClick={handleBuyClick}>
          Comprar
        </button>
      </div>
    </div>
  );
};

export default SkinCardListening;
