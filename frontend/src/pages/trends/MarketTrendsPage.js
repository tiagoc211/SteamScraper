// frontend/src/pages/trends/MarketTrendsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTopGainers, getTopLosers, getBestLiquidity, getLowestFloats, getRandomItems } from '../../api/api';
import AdBanner from '../../components/ui/AdBanner/AdBanner';
import './MarketTrendsPage.css';

const TrendCard = ({ item, type }) => {
  const formatPrice = (cents) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  const imageUrl = item.icon_url 
    ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`
    : 'https://via.placeholder.com/200';
  
  const isPositive = parseFloat(item.percent_change) > 0;
  const arrow = isPositive ? '↑' : '↓';
  const changeClass = isPositive ? 'positive' : 'negative';

  return (
    <Link to={`/skin/${encodeURIComponent(item.market_hash_name)}`} className="trend-card glass-panel">
      <div className="trend-card-top">
        <div className="trend-card-image">
          <img src={imageUrl} alt={item.market_hash_name} />
        </div>
        <div className="trend-card-content">
          <h3 className="trend-card-title" title={item.market_hash_name}>{item.market_hash_name}</h3>
          <div className="trend-card-prices">
            <div className="price-row">
              <span className="price-label">Atual:</span>
              <span className="price-value current">{formatPrice(item.current_price)}</span>
            </div>
            <div className="price-row">
              <span className="price-label">Anterior:</span>
              <span className="price-value past">{formatPrice(item.past_price)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`trend-card-change ${changeClass}`}>
        <span className="change-arrow">{arrow}</span>
        <span className="change-percent">{Math.abs(item.percent_change)}%</span>
        <span className="change-amount">({formatPrice(Math.abs(item.price_change))})</span>
      </div>
    </Link>
  );
};

const LiquidityCard = ({ item }) => {
  const formatPrice = (cents) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  const imageUrl = item.icon_url 
    ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`
    : 'https://via.placeholder.com/200';

  return (
    <Link to={`/skin/${encodeURIComponent(item.market_hash_name)}`} className="trend-card liquidity-card glass-panel">
      <div className="trend-card-top">
        <div className="trend-card-image">
          <img src={imageUrl} alt={item.market_hash_name} />
        </div>
        <div className="trend-card-content">
          <h3 className="trend-card-title" title={item.market_hash_name}>{item.market_hash_name}</h3>
          <div className="trend-card-prices">
            <div className="price-row">
              <span className="price-label">Mín:</span>
              <span className="price-value current">{formatPrice(item.min_price)}</span>
            </div>
            <div className="price-row">
              <span className="price-label">Médio:</span>
              <span className="price-value">{formatPrice(item.avg_price)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="liquidity-stats">
        <div className="liquidity-badge">
          <span className="liquidity-count">{item.listing_count}</span>
          <span className="liquidity-label">listings</span>
        </div>
        <div className="liquidity-score-badge">
          <span className="score-value">{item.liquidity_score}</span>
          <span className="score-label">score</span>
        </div>
      </div>
    </Link>
  );
};

const FloatCard = ({ item, rank }) => {
  const formatPrice = (cents) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  const imageUrl = item.icon_url 
    ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`
    : 'https://via.placeholder.com/200';
  
  // Cor do float: mais verde = mais baixo (melhor)
  const floatPercent = item.float_value * 100;
  const floatColor = floatPercent < 1 ? '#00ff88' : floatPercent < 5 ? '#10b981' : floatPercent < 10 ? '#fbbf24' : '#ef4444';

  return (
    <Link to={`/skin/${encodeURIComponent(item.market_hash_name)}`} className="trend-card float-card glass-panel">
      <div className="float-rank">#{rank}</div>
      <div className="trend-card-top">
        <div className="trend-card-image">
          <img src={imageUrl} alt={item.market_hash_name} />
        </div>
        <div className="trend-card-content">
          <h3 className="trend-card-title" title={item.market_hash_name}>{item.market_hash_name}</h3>
          <div className="float-value-display" style={{ color: floatColor }}>
            {parseFloat(item.float_value).toFixed(14)}
          </div>
        </div>
      </div>
      <div className="float-card-meta">
        <span className="float-card-price">{formatPrice(item.price)}</span>
        {item.paint_seed && <span className="float-card-seed">Pattern: {item.paint_seed}</span>}
      </div>
    </Link>
  );
};

const MarketTrendsPage = ({ showHeader = true, fixedTimeframe = null }) => {
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [bestLiquidity, setBestLiquidity] = useState([]);
  const [lowestFloats, setLowestFloats] = useState([]);
  const [randomItems, setRandomItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(fixedTimeframe || 7);
  
  // Estados para drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const hasDragged = useRef(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const effectiveTimeframe = fixedTimeframe || timeframe;
        const promises = [
          getTopGainers(effectiveTimeframe, 10),
          getTopLosers(effectiveTimeframe, 10),
          getBestLiquidity(10),
          getLowestFloats(10)
        ];
        
        // Só busca items aleatórios se não mostrar header (HomePage)
        if (!showHeader) {
          promises.push(getRandomItems(20));
        }
        
        const results = await Promise.all(promises);
        
        setTopGainers(results[0].items || []);
        setTopLosers(results[1].items || []);
        setBestLiquidity(results[2].items || []);
        setLowestFloats(results[3].items || []);
        
        if (!showHeader && results[4]) {
          setRandomItems(results[4].items || []);
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [timeframe, fixedTimeframe, showHeader]);

  // Carrosel automático - só na HomePage
  useEffect(() => {
    if (!showHeader && randomItems.length > 8 && !isDragging) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const maxIndex = Math.max(0, randomItems.length - 8);
          return (prev + 1) % (maxIndex + 1);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [randomItems, showHeader, isDragging]);

  // Handlers para drag
  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartIndex.current = currentIndex;
    hasDragged.current = false;
    setDragOffset(0);
    e.preventDefault();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      // Snap to nearest index
      const cardWidth = 220;
      const totalOffset = currentIndex * cardWidth + dragOffset;
      const newIndex = Math.round(totalOffset / cardWidth);
      const maxIndex = Math.max(0, randomItems.length - 8);
      setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
      setIsDragging(false);
      setDragOffset(0);
      
      // Reset hasDragged after a short delay
      setTimeout(() => {
        hasDragged.current = false;
      }, 100);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // Snap to nearest index
      const cardWidth = 220;
      const totalOffset = currentIndex * cardWidth + dragOffset;
      const newIndex = Math.round(totalOffset / cardWidth);
      const maxIndex = Math.max(0, randomItems.length - 8);
      setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
      setIsDragging(false);
      setDragOffset(0);
      
      // Reset hasDragged after a short delay
      setTimeout(() => {
        hasDragged.current = false;
      }, 100);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    
    const deltaX = dragStartX.current - e.clientX;
    
    // Marca como dragged se moveu mais de 5px
    if (Math.abs(deltaX) > 5) {
      hasDragged.current = true;
    }
    
    setDragOffset(deltaX);
  };

  // Touch handlers para mobile
  const handleTouchStart = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartIndex.current = currentIndex;
    hasDragged.current = false;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    
    const deltaX = dragStartX.current - e.touches[0].clientX;
    
    // Marca como dragged se moveu mais de 5px
    if (Math.abs(deltaX) > 5) {
      hasDragged.current = true;
    }
    
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      // Snap to nearest index
      const cardWidth = 220;
      const totalOffset = currentIndex * cardWidth + dragOffset;
      const newIndex = Math.round(totalOffset / cardWidth);
      const maxIndex = Math.max(0, randomItems.length - 8);
      setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)));
      setIsDragging(false);
      setDragOffset(0);
      
      // Reset hasDragged after a short delay
      setTimeout(() => {
        hasDragged.current = false;
      }, 100);
    }
  };

  // Prevenir navegação se estava arrastando
  const handleItemClick = (e) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const formatPrice = (cents) => (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="market-analytics-page">
      {showHeader && (
        <header className="analytics-header">
          <div className="header-content">
            <div className="header-title-section">
              <h1>Market Analytics</h1>
              <p className="analytics-subtitle">Análise avançada de mercado em tempo real</p>
            </div>
            {!fixedTimeframe && (
              <div className="timeframe-selector">
                <button 
                  className={`timeframe-btn ${timeframe === 1 ? 'active' : ''}`}
                  onClick={() => setTimeframe(1)}
                >
                  24h
                </button>
                <button 
                  className={`timeframe-btn ${timeframe === 7 ? 'active' : ''}`}
                  onClick={() => setTimeframe(7)}
                >
                  7 dias
                </button>
                <button 
                  className={`timeframe-btn ${timeframe === 30 ? 'active' : ''}`}
                  onClick={() => setTimeframe(30)}
                >
                  30 dias
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      
      {loading ? (
        <div className="analytics-loader">A carregar dados...</div>
      ) : (
        <>
          {/* Faixa de armas aleatórias - SÓ na HomePage */}
          {!showHeader && randomItems.length > 0 && (
            <div className="expensive-items-banner">
              <div className="banner-header">
                <h2>Armas em Destaque</h2>
                <p>Descubra as melhores skins do mercado</p>
              </div>
              <div 
                className="banner-items-carousel"
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div 
                  className="banner-items-container"
                  style={{ 
                    transform: `translateX(-${currentIndex * 220 + dragOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  {randomItems.map((item, index) => {
                    const imageUrl = item.icon_url 
                      ? `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/200fx200f`
                      : 'https://via.placeholder.com/200';
                    
                    return (
                      <Link 
                        key={index} 
                        to={`/skin/${encodeURIComponent(item.market_hash_name)}`} 
                        className="banner-item-card"
                        onClick={handleItemClick}
                      >
                        <div className="banner-item-image">
                          <img src={imageUrl} alt={item.market_hash_name} />
                        </div>
                        <div className="banner-item-info">
                          <h4 className="banner-item-name">{item.market_hash_name}</h4>
                          <div className="banner-item-prices">
                            <span className="banner-avg-price">{formatPrice(item.price)}</span>
                            {item.float_value && (
                              <span className="banner-float">Float: {parseFloat(item.float_value).toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Analytics Dashboard */}
          <AdBanner variant="leaderboard" adSlot="YOUR_SLOT_ID_TRENDS_TOP" />
          <div className="analytics-dashboard">
          <div className="dashboard-row">
            <section className="analytics-section gainers-section">
              <div className="section-header">
                <h2>Top Gainers</h2>
                <p>Maior aumento de preço</p>
              </div>
              <div className="horizontal-scroll">
                {topGainers.length > 0 ? (
                  topGainers.map((item, index) => (
                    <TrendCard key={index} item={item} type="gainer" />
                  ))
                ) : (
                  <div className="no-data">Sem dados suficientes</div>
                )}
              </div>
            </section>

            <section className="analytics-section losers-section">
              <div className="section-header">
                <h2>Top Losers</h2>
                <p>Maior queda de preço</p>
              </div>
              <div className="horizontal-scroll">
                {topLosers.length > 0 ? (
                  topLosers.map((item, index) => (
                    <TrendCard key={index} item={item} type="loser" />
                  ))
                ) : (
                  <div className="no-data">Sem dados suficientes</div>
                )}
              </div>
            </section>
          </div>

          <div className="dashboard-row">
            <section className="analytics-section liquidity-section">
              <div className="section-header">
                <h2>Melhor Preço/Liquidez</h2>
                <p>Mais fáceis de negociar</p>
              </div>
              <div className="horizontal-scroll">
                {bestLiquidity.length > 0 ? (
                  bestLiquidity.map((item, index) => (
                    <LiquidityCard key={index} item={item} />
                  ))
                ) : (
                  <div className="no-data">Sem dados</div>
                )}
              </div>
            </section>

            <section className="analytics-section floats-section">
              <div className="section-header">
                <h2>Floats Mais Baixos</h2>
                <p>Condição quase perfeita</p>
              </div>
              <div className="horizontal-scroll">
                {lowestFloats.length > 0 ? (
                  lowestFloats.map((item, index) => (
                    <FloatCard key={index} item={item} rank={index + 1} />
                  ))
                ) : (
                  <div className="no-data">Sem dados</div>
                )}
              </div>
            </section>
          </div>
        </div>
        <AdBanner variant="leaderboard" adSlot="YOUR_SLOT_ID_TRENDS_BTM" />
        </>
      )}
    </div>
  );
        

};

export default MarketTrendsPage;
