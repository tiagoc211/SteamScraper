// frontend/src/components/ui/AdBanner/AdBanner.js
import React, { useEffect, useRef } from 'react';
import './AdBanner.css';

const IS_DEV =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

/**
 * AdBanner — Google AdSense
 * variants: leaderboard | rectangle | skyscraper | mobile-banner
 * Em localhost mostra sempre um placeholder visível.
 * Em produção renderiza o bloco AdSense real.
 */
const AdBanner = ({ variant = 'leaderboard', adSlot = '', className = '' }) => {
  const adRef = useRef(null);
  const initialized = useRef(false);

  const normalizedSlot = String(adSlot || '').trim();
  const isPlaceholderSlot = !normalizedSlot || normalizedSlot.startsWith('YOUR_SLOT_ID');

  // Em dev OU sem slot válido → mostra placeholder visual
  const showPlaceholder = IS_DEV || isPlaceholderSlot;

  // Tamanhos mínimos para o placeholder (CSS cuida dos reais em prod)
  const placeholderSizeMap = {
    leaderboard:     { width: '728px', height: '90px'  },
    rectangle:       { width: '336px', height: '280px' },
    skyscraper:      { width: '160px', height: '600px' },
    'mobile-banner': { width: '320px', height: '100px' },
  };
  const pSize = placeholderSizeMap[variant] || placeholderSizeMap['leaderboard'];

  useEffect(() => {
    if (showPlaceholder || initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  }, [showPlaceholder]);

  return (
    <div className={`ad-banner-wrapper ad-banner--${variant} ${className}`} aria-label="Publicidade">
      <span className="ad-banner__label">Publicidade</span>

      {showPlaceholder ? (
        /* ── Placeholder visível em localhost / dev ── */
        <div
          className={`ad-banner__test-placeholder ad-banner__test-placeholder--${variant}`}
          style={{ width: pSize.width, height: pSize.height }}
        >
          <span>Publicidade</span>
          <small>{variant} · {normalizedSlot || 'sem slot'}</small>
        </div>
      ) : (
        /* ── AdSense real (produção) ── */
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-1034789266408347"
          data-ad-slot={normalizedSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export default AdBanner;
