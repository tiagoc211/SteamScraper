// frontend/src/components/skin/FilterSidebar/FilterSidebar.js
import React from 'react';
import './FilterSidebar.css';

// Componente reutilizável para uma secção de filtro
const FilterSection = ({ title, children }) => (
  <div className="filter-section">
    <div className="section-header">
      <h3 className="section-title">{title}</h3>
    </div>
    <div className="section-content">{children}</div>
  </div>
);

// Componente para um simples toggle (ligar/desligar)
const ToggleSwitch = ({ label, isChecked, onToggle }) => (
    <div className="toggle-switch-container">
        <label>{label}</label>
        <button className={`filter-toggle ${isChecked ? 'active' : ''}`} onClick={onToggle}>
            <div className="toggle-knob" />
        </button>
    </div>
);


const FilterSidebar = ({ filters, setFilters, context = 'detail' }) => { // 'detail' é o contexto padrão

  // Manipulador genérico para inputs de texto e número
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Manipulador para os toggles (StatTrak, Souvenir)
  const handleToggleChange = (name) => {
      setFilters(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Manipulador para os filtros de intervalo (preço, float)
  const handleRangeChange = (name, index, value) => {
    setFilters(prevFilters => {
      const newRange = [...(prevFilters[name] || ['', ''])]; // Garante que a array existe
      newRange[index] = value;
      return { ...prevFilters, [name]: newRange };
    });
  };

  return (
    <aside className="filter-sidebar glass-panel">
      {context === 'browse' && (
        <>
          <FilterSection title="Sort By">
            <div className="sort-by-container">
              <select
                  className="filter-select"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                  <option value="floatid">Float</option>
                  <option value="price">Price</option>
                  <option value="paintseed">Paint Seed</option>
                  <option value="checkedtime">Checked Time</option>
              </select>
              
              <div className="sort-order-arrows">
                <button
                  className={`arrow-btn ${filters.sortOrder === 'ASC' ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'ASC' }))}
                  title="Ascending order"
                >
                  ↑
                </button>
                <button
                  className={`arrow-btn ${filters.sortOrder === 'DESC' ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'DESC' }))}
                  title="Descending order"
                >
                  ↓
                </button>
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Search">
            <input type="text" name="search" placeholder="Filter by name..." value={filters.search || ''} onChange={handleInputChange} className="filter-input" />
          </FilterSection>

          <FilterSection title="Rarity">
            <select
                className="filter-select"
                value={filters.rarity}
                onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
            >
                <option value="">All</option>
                <option value="1">Consumer Grade (grey/white)</option>
                <option value="2">Industrial Grade (light blue)</option>
                <option value="3">Mil-Spec (blue)</option>
                <option value="4">Restricted (purple)</option>
                <option value="5">Classified (pink)</option>
                <option value="6">Covert / knives and gloves (red)</option>
                <option value="7">Contraband (yellow)</option>
            </select>
          </FilterSection>

          <FilterSection title="Special">
             <ToggleSwitch label="StatTrak™" isChecked={filters.stattrak || false} onToggle={() => handleToggleChange('stattrak')} />
             <ToggleSwitch label="Souvenir" isChecked={filters.souvenir || false} onToggle={() => handleToggleChange('souvenir')} />
          </FilterSection>
        </>
      )}

      {/* ================================================= */}
      {/* FILTROS PARA A PÁGINA DE DETALHES (/skin/:name) */}
      {/* ================================================= */}
      {context === 'detail' && (
        <>
          <FilterSection title="Price">
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder="From"
                // CORREÇÃO: Usa optional chaining (?.) e um fallback para não crashar
                value={filters.priceNumber?.[0] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 0, e.target.value)} 
              />
              <input 
                type="number" 
                placeholder="To"
                value={filters.priceNumber?.[1] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 1, e.target.value)} 
              />
            </div>
          </FilterSection>

          <FilterSection title="Wear">
             <div className="range-inputs">
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Minimum"
                    value={filters.wear?.[0] || ''} 
                    onChange={(e) => handleRangeChange('wear', 0, e.target.value)} 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder="Maximum" 
                    value={filters.wear?.[1] || ''} 
                    onChange={(e) => handleRangeChange('wear', 1, e.target.value)} 
                />
            </div>
          </FilterSection>

          <FilterSection title="Patterns">
            <input 
                type="number" 
                name="paintSeed" 
                placeholder="Paint Seed"
                value={filters.paintSeed || ''} 
                onChange={handleInputChange}
                className="filter-input"
            />
          </FilterSection>

          <button 
            className="apply-filters-btn"
            onClick={filters.onApply}
          >
            Apply Filters
          </button>
        </>
      )}
    </aside>
  );
};

export default FilterSidebar;