// frontend/src/components/skin/FilterSidebar/FilterSidebar.js
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
          <FilterSection title={t('filter.sortBy')}>
            <div className="sort-by-container">
              <select
                  className="filter-select"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                  <option value="floatid">{t('filter.float')}</option>
                  <option value="price">{t('filter.price')}</option>
                  <option value="paintseed">{t('filter.paintSeed')}</option>
                  <option value="checkedtime">{t('filter.checkedTime')}</option>
              </select>
              
              <div className="sort-order-arrows">
                <button
                  className={`arrow-btn ${filters.sortOrder === 'ASC' ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'ASC' }))}
                  title={t('filter.ascending')}
                >
                  ↑
                </button>
                <button
                  className={`arrow-btn ${filters.sortOrder === 'DESC' ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'DESC' }))}
                  title={t('filter.descending')}
                >
                  ↓
                </button>
              </div>
            </div>
          </FilterSection>

          <FilterSection title={t('filter.search')}>
            <input type="text" name="search" placeholder={t('filter.filterByName')} value={filters.search || ''} onChange={handleInputChange} className="filter-input" />
          </FilterSection>

          <FilterSection title={t('filter.rarity')}>
            <select
                className="filter-select"
                value={filters.rarity}
                onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
            >
                <option value="">{t('filter.all')}</option>
                <option value="1">{t('filter.consumerGrade')}</option>
                <option value="2">{t('filter.industrialGrade')}</option>
                <option value="3">{t('filter.milSpec')}</option>
                <option value="4">{t('filter.restricted')}</option>
                <option value="5">{t('filter.classified')}</option>
                <option value="6">{t('filter.covert')}</option>
                <option value="7">{t('filter.contraband')}</option>
            </select>
          </FilterSection>

          <FilterSection title={t('filter.special')}>
             <ToggleSwitch label={t('filter.statTrak')} isChecked={filters.stattrak || false} onToggle={() => handleToggleChange('stattrak')} />
             <ToggleSwitch label={t('filter.souvenir')} isChecked={filters.souvenir || false} onToggle={() => handleToggleChange('souvenir')} />
          </FilterSection>

          <FilterSection title={t('filter.price')}>
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder={t('filter.from')}
                value={filters.priceNumber?.[0] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 0, e.target.value)} 
              />
              <input 
                type="number" 
                placeholder={t('filter.to')}
                value={filters.priceNumber?.[1] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 1, e.target.value)} 
              />
            </div>
          </FilterSection>

          <FilterSection title={t('filter.wear')}>
             <div className="range-inputs">
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder={t('filter.minimum')}
                    value={filters.wear?.[0] || ''} 
                    onChange={(e) => handleRangeChange('wear', 0, e.target.value)} 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder={t('filter.maximum')} 
                    value={filters.wear?.[1] || ''} 
                    onChange={(e) => handleRangeChange('wear', 1, e.target.value)} 
                />
            </div>
          </FilterSection>

          <FilterSection title={t('filter.patterns')}>
            <input 
                type="number" 
                name="paintSeed" 
                placeholder={t('filter.paintSeed')}
                value={filters.paintSeed || ''} 
                onChange={handleInputChange}
                className="filter-input"
            />
          </FilterSection>

          <button 
            className="clear-filters-btn"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                priceNumber: ['', ''],
                wear: ['', ''],
                paintSeed: ''
              }));
            }}
          >
            {t('filter.clearFilters')}
          </button>
        </>
      )}

      {/* ================================================= */}
      {/* FILTROS PARA A PÁGINA DE DETALHES (/skin/:name) */}
      {/* ================================================= */}
      {context === 'detail' && (
        <>
          <FilterSection title={t('filter.price')}>
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder={t('filter.from')}
                // CORREÇÃO: Usa optional chaining (?.) e um fallback para não crashar
                value={filters.priceNumber?.[0] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 0, e.target.value)} 
              />
              <input 
                type="number" 
                placeholder={t('filter.to')}
                value={filters.priceNumber?.[1] || ''} 
                onChange={(e) => handleRangeChange('priceNumber', 1, e.target.value)} 
              />
            </div>
          </FilterSection>

          <FilterSection title={t('filter.wear')}>
             <div className="range-inputs">
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder={t('filter.minimum')}
                    value={filters.wear?.[0] || ''} 
                    onChange={(e) => handleRangeChange('wear', 0, e.target.value)} 
                />
                <input 
                    type="number" 
                    step="0.01"
                    placeholder={t('filter.maximum')} 
                    value={filters.wear?.[1] || ''} 
                    onChange={(e) => handleRangeChange('wear', 1, e.target.value)} 
                />
            </div>
          </FilterSection>

          <FilterSection title={t('filter.patterns')}>
            <input 
                type="number" 
                name="paintSeed" 
                placeholder={t('filter.paintSeed')}
                value={filters.paintSeed || ''} 
                onChange={handleInputChange}
                className="filter-input"
            />
          </FilterSection>

          <button 
            className="apply-filters-btn"
            onClick={filters.onApply}
          >
            {t('filter.applyFilters')}
          </button>
          <button 
            className="clear-filters-btn"
            onClick={filters.onClear}
          >
            {t('filter.clearFilters')}
          </button>
        </>
      )}
    </aside>
  );
};

export default FilterSidebar;