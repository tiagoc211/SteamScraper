import React, { useState } from 'react';
import './FilterSidebar.css';

const FilterSection = ({ title, children, isEnabled, onToggle, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`filter-section ${isEnabled ? '' : 'disabled'}`}>
      <div className="section-header">
        <button className="section-title" onClick={() => setIsOpen(!isOpen)}>
          <span>{title}</span>
          <span className="arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        <button className={`filter-toggle ${isEnabled ? 'active' : ''}`} onClick={onToggle}>
            <div className="toggle-knob" />
        </button>
      </div>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
};

const FilterSidebar = ({ filters, setFilters, onApplyFilters, onToggleFilter, onResetFilters }) => {
  
  // Este manipulador já estava correto.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // CORREÇÃO: O manipulador de intervalos foi melhorado para evitar qualquer possibilidade de estado obsoleto.
  // Toda a lógica agora acontece dentro do callback de setFilters.
  const handleRangeChange = (name, index, value) => {
    setFilters(prevFilters => {
      // Cria uma cópia da array que queremos modificar (ex: prevFilters.priceNumber)
      const newRange = [...prevFilters[name]];
      newRange[index] = value;
      // Retorna o novo objeto de estado completo
      return { 
        ...prevFilters, 
        [name]: newRange 
      };
    });
  };

  return (
    <aside className="filter-sidebar">
      {/* CORREÇÃO: Alterado de 'price' para 'priceNumber' para corresponder ao estado do componente pai */}
      <FilterSection title="Price" isEnabled={filters.enabled.priceNumber} onToggle={() => onToggleFilter('priceNumber')}>
        <div className="range-inputs">
          <div className="input-group">
            <label>From</label>
            {/* CORREÇÃO: Usa 'priceNumber' e o manipulador correto */}
            <input type="number" name="priceFrom" value={filters.priceNumber[0]} onChange={(e) => handleRangeChange('priceNumber', 0, e.target.value)} placeholder="0" />
          </div>
          <div className="input-group">
            <label>To</label>
            {/* CORREÇÃO: Usa 'priceNumber' e o manipulador correto */}
            <input type="number" name="priceTo" value={filters.priceNumber[1]} onChange={(e) => handleRangeChange('priceNumber', 1, e.target.value)} placeholder="∞" />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Wear" isEnabled={filters.enabled.wear} onToggle={() => onToggleFilter('wear')}>
        <div className="range-inputs">
            <div className="input-group">
                <label>Minimum</label>
                {/* O manipulador de 'wear' já estava a usar a lógica correta */}
                <input type="number" step="0.01" value={filters.wear[0]} onChange={(e) => handleRangeChange('wear', 0, e.target.value)} />
            </div>
            <div className="input-group">
                <label>Maximum</label>
                <input type="number" step="0.01" value={filters.wear[1]} onChange={(e) => handleRangeChange('wear', 1, e.target.value)} />
            </div>
        </div>
      </FilterSection>

      <FilterSection title="Patterns" isEnabled={filters.enabled.paintSeed} onToggle={() => onToggleFilter('paintSeed')}>
         <div className="input-group vertical">
            <label>Paint Seed</label>
            <input type="number" name="paintSeed" value={filters.paintSeed} onChange={handleInputChange} />
        </div>
      </FilterSection>
      
      <FilterSection title="Stickers" isEnabled={false} onToggle={() => {}} defaultOpen={false}>
        {/* Este componente é um placeholder e não necessita de alterações */}
      </FilterSection>

      <div className="filter-actions">
        <button className="apply-button" onClick={onApplyFilters}>
          Apply Filters
        </button>
        <button className="reset-button" onClick={onResetFilters}>
          <span role="img" aria-label="reset">⟳</span> Reset All Filters
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;