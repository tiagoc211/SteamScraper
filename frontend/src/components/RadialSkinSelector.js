import React, { useState } from 'react';
import './RadialSkinSelector.css';

const RadialSkinSelector = ({ skins, onSelectSkin, weaponName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(null);

  const handleSelect = (skin) => {
    setSelectedSkin(skin);
    onSelectSkin(skin);
    setIsOpen(false);
  };

  if (!skins || skins.length === 0) {
    return (
      <button className="radial-toggle-button" disabled>
        Selecione uma arma
      </button>
    );
  }

  return (
    <div className="radial-selector-container">
      <button 
        className="radial-toggle-button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedSkin ? selectedSkin.name : 'Selecionar Skin'}
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="radial-menu-overlay" onClick={() => setIsOpen(false)}>
          <div className="radial-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-center-weapon">{weaponName}</div>
            {skins.map((skin, index) => {
              const angle = (index / skins.length) * 360;
              const radius = Math.min(180, skins.length * 12); // Raio dinâmico
              const style = {
                transform: `rotate(${angle}deg) translateY(${radius}px) rotate(-${angle}deg)`,
              };
              return (
                <div 
                  key={skin.name} 
                  className="menu-item" 
                  style={style} 
                  onClick={() => handleSelect(skin)}
                  title={skin.name}
                >
                  <span className="menu-item-text">{skin.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadialSkinSelector;