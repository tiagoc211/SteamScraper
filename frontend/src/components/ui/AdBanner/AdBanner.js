// frontend/src/components/ui/AdBanner/AdBanner.js
import React, { useEffect, useRef } from 'react';
import './AdBanner.css';

/**
 * AdBanner — componente reutilizável para Google AdSense
 * 
 * variants:
 *  - "leaderboard"  : 728×90  — horizontal, topo/fim de página
 *  - "rectangle"    : 336×280 — bloco médio, inline entre conteúdo
 *  - "skyscraper"   : 160×600 — vertical, colunas laterais
 *  - "mobile-banner": 320×100 — banner mobile
 *
 * Passa `adSlot` com o ID do teu slot AdSense (encontra em AdSense → Anúncios → Por unidade de anúncio)
 */
const AdBanner = ({ variant = 'leaderboard', adSlot = '', className = '' }) => {
  const adRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  }, []);

  const sizeMap = {
    leaderboard:   { width: '728px',  height: '90px',  format: 'horizontal' },
    rectangle:     { width: '336px',  height: '280px', format: 'rectangle' },
    skyscraper:    { width: '160px',  height: '600px', format: 'vertical' },
    'mobile-banner': { width: '320px', height: '100px', format: 'horizontal' },
  };
  const size = sizeMap[variant] || sizeMap['leaderboard'];

  return (
    <div className={`ad-banner-wrapper ad-banner--${variant} ${className}`} aria-label="Publicidade">
      <span className="ad-banner__label">Publicidade</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: size.width, height: size.height }}
        data-ad-client="ca-pub-1034789266408347"
        data-ad-slot={adSlot}
        data-ad-format={size.format}
        data-full-width-responsive="false"
      />
    </div>
  );
};

export default AdBanner;
