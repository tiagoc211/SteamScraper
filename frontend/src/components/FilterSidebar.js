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

const FilterSidebar = ({ filters, setFilters, onApplyFilters, onToggleFilter }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleRangeChange = (name, index, value) => {
    const newRange = [...filters[name]];
    newRange[index] = value;
    setFilters(prev => ({ ...prev, [name]: newRange }));
  };
  const handleReset = () => { /* ... */ };

  return (
    <aside className="filter-sidebar">
      <FilterSection title="Price" isEnabled={filters.enabled.price} onToggle={() => onToggleFilter('price')}>
        <div className="range-inputs">
            {/* ... inputs de preço ... */}
        </div>
      </FilterSection>

      <FilterSection title="Wear" isEnabled={filters.enabled.wear} onToggle={() => onToggleFilter('wear')}>
        <div className="range-inputs">
            <div className="input-group">
                <label>Minimum</label>
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
        {/* Placeholder */}
      </FilterSection>

      <div className="filter-actions">
        <button className="apply-button" onClick={onApplyFilters}>
          Apply Filters
        </button>
        <button className="reset-button" onClick={handleReset}>
          <span role="img" aria-label="reset">⟳</span> Reset All Filters
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;