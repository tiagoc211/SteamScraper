// src/components/ChromaGrid.js
import React from 'react';
import './ChromaGrid.css';

export const ChromaGrid = ({ items, className = '', columns = 3 }) => {
  const data = items || [];

  const handleCardMove = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className={`chroma-grid ${className}`} style={{ '--cols': columns }}>
      {data.map((c, i) => (
        <article
          key={i}
          className="chroma-card"
          onMouseEnter={c.onMouseEnter}
          onMouseLeave={c.onMouseLeave}
          onMouseMove={handleCardMove}
          onClick={() => c.onClick && c.onClick()}
          style={{
            '--card-border': c.borderColor || 'transparent',
            '--card-gradient': c.gradient,
            cursor: c.onClick ? 'pointer' : 'default'
          }}
        >
          <footer className="chroma-info">
            <h3 className={`name ${c.tierClass}`}>{c.title}</h3>
            <p className="role">{c.subtitle}</p>
            {c.handle && <span className="handle">{c.handle}</span>}
          </footer>

          <div className="chroma-features">
            <ul>
              {c.features && c.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
      
      <div className="chroma-overlay" />
      <div className="chroma-fade" />
    </div>
  );
};

export default ChromaGrid;