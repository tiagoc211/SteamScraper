// frontend/src/components/ui/LastSearchesBar/LastSearchesBar.js
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom'; // Importante para o popup sair da barra
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getLatestItems } from '../../../api/api';
import './LastSearchesBar.css';

const LastSearchesBar = () => {
  const [items, setItems] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  
  const previousFirstId = useRef(null);
  const constraintsRef = useRef(null); // Referência para limitar o arrasto

  const fetchLatest = async () => {
    try {
      const data = await getLatestItems();
      if (!data || data.length === 0) {
        console.log("Nenhum item encontrado para Last Searches. Visite algumas skins para popular a lista.");
        return;
      }

      const newestItem = data[0];
      if (newestItem.listing_id !== previousFirstId.current) {
        setItems(data.slice(0, 15)); // Aumentei para 15 para ter mais margem de drag
        previousFirstId.current = newestItem.listing_id;
      }
    } catch (err) {
      console.error("Erro ao buscar últimas pesquisas:", err);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000); 
    return () => clearInterval(interval);
  }, []);

  // Formatações
  const formatPrice = (price) => (price / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  const getThumbUrl = (iconUrl) => `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/100fx100f`;
  const getLargeUrl = (iconUrl) => `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/300fx300f`;

  // Função para calcular posição do popup
  const handleMouseEnter = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 5, // 5px abaixo do item
      left: rect.left
    });
    setHoveredItem(item);
  };

  if (items.length === 0) return null;

  return (
    <div className="last-searches-container">
      <div className="ls-label">
        <span className="pulsing-dot"></span>
        LAST SEARCHES
      </div>
      
      {/* Área Arrastável */}
      <div className="ls-drag-area" ref={constraintsRef}>
        <motion.div 
          className="ls-list-wrapper"
          drag="x"
          dragConstraints={constraintsRef}
          // Garante que não arrasta para fora da tela totalmente
          dragElastic={0.1} 
        >
          <AnimatePresence initial={false} mode='popLayout'>
            {items.map((item) => (
              <motion.div
                key={item.listing_id}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="ls-item-wrapper"
                // Eventos de Hover
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link 
                  to={`/skin/${encodeURIComponent(item.market_hash_name)}`} 
                  className="ls-card"
                  draggable="false" // Impede o drag nativo do browser para não conflitar
                >
                  <div className="ls-img-container">
                      <img 
                        src={getThumbUrl(item.icon_url)} 
                        alt={item.market_hash_name} 
                        className="ls-img"
                        draggable="false"
                      />
                  </div>
                  <div className="ls-info">
                    <div className="ls-name">{item.market_hash_name}</div>
                    <div className="ls-price">{formatPrice(item.price)}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 
          PORTAL DO POPUP 
          Isto renderiza o popup fora da barra, no body, permitindo que fique
          por cima de tudo e não seja cortado pelo overflow da barra.
      */}
      {hoveredItem && createPortal(
        <AnimatePresence>
          <motion.div 
            className="ls-portal-popup"
            style={{ 
              top: popupPos.top, 
              left: popupPos.left 
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, duration: 0.15 }}
            transition={{ duration: 0.2 }}
            // Manter o popup aberto se o rato for para cima dele
            onMouseEnter={() => setHoveredItem(hoveredItem)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="ls-popup-header">
              <span className="ls-popup-price">{formatPrice(hoveredItem.price)}</span>
              {hoveredItem.float_value && (
                <span className="ls-popup-float">Float: {hoveredItem.float_value.toFixed(4)}</span>
              )}
            </div>
            <div className="ls-popup-img-wrapper">
              <img 
                src={getLargeUrl(hoveredItem.icon_url)} 
                alt={hoveredItem.market_hash_name} 
                className="ls-popup-img" 
              />
            </div>
            <div className="ls-popup-name">{hoveredItem.market_hash_name}</div>
            
            <Link 
              to={`/skin/${encodeURIComponent(hoveredItem.market_hash_name)}`} 
              className="ls-popup-cta"
            >
              Ver Detalhes →
            </Link>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default LastSearchesBar;