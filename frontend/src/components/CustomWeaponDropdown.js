import React, { useState } from 'react';
import './CustomWeaponDropdown.css';

const CustomWeaponDropdown = ({ weapons, selectedWeapon, onSelect, onHover }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (weapon) => {
    onSelect(weapon);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown-container">
      <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
        {selectedWeapon || 'Selecione a arma'}
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <ul className="dropdown-list">
          {weapons.map(weapon => (
            <li
              key={weapon}
              onClick={() => handleSelect(weapon)}
              onMouseEnter={() => onHover(weapon)}
            >
              {weapon}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomWeaponDropdown;