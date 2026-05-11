// src/components/ui/SearchBar/SearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiArrowLeft } from 'react-icons/fi'; // Usar Fi para consistência
import { searchSkinsByQuery } from '../../../api/api';
import './SearchBar.css';

const SearchBar = ({ isSearchActive, setIsSearchActive }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSkin, setSelectedSkin] = useState(null); // <-- NOVO: Para controlar a vista de detalhes
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Efeito para focar o input e bloquear o scroll da página
  useEffect(() => {
    if (isSearchActive) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSearchActive]);

  // Lógica da pesquisa com debounce
  useEffect(() => {
    // Não pesquisa se já estivermos na vista de detalhes
    if (selectedSkin) return;

    if (query.length < 2) {
      setResults([]);
      return;
    }
    const fetchAndFilter = async () => {
      setLoading(true);
      const searchResults = await searchSkinsByQuery(query);
      setResults(searchResults);
      setLoading(false);
    };
    const debounceTimeout = setTimeout(fetchAndFilter, 250);
    return () => clearTimeout(debounceTimeout);
  }, [query, selectedSkin]); // Adicionado selectedSkin às dependências

  // Função para gerar as variações de uma skin (StatTrak, Souvenir, etc.)
  const generateVariations = (skin) => {
    const variations = [];
    const baseName = skin.name.replace('★ ', '');
    
    if (!skin.wears || skin.wears.length === 0) {
        variations.push({ name: skin.name, market_hash_name: skin.name });
        if(skin.stattrak) variations.push({ name: `StatTrak™ ${skin.name}`, market_hash_name: `StatTrak™ ${skin.name}` });
        return variations;
    }

    skin.wears.forEach(w => variations.push({ name: `${skin.name} (${w.name})`, market_hash_name: `${baseName} (${w.name})` }));
    if (skin.stattrak) skin.wears.forEach(w => variations.push({ name: `StatTrak™ ${skin.name} (${w.name})`, market_hash_name: `StatTrak™ ${baseName} (${w.name})` }));
    if (skin.souvenir) skin.wears.forEach(w => variations.push({ name: `Souvenir ${skin.name} (${w.name})`, market_hash_name: `Souvenir ${baseName} (${w.name})` }));
    
    return variations;
  };
  
  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setQuery('');
    setResults([]);
    setSelectedSkin(null);
  };

  if (!isSearchActive) return null;

  return (
    <div className="search-overlay" onClick={handleCloseSearch}>
      <div className="search-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper-active">
          {/* CORREÇÃO: Renderização condicional do ícone de busca ou da seta para trás */}
          {selectedSkin ? (
            <FiArrowLeft className="search-icon-active back-arrow" onClick={() => setSelectedSkin(null)} />
          ) : (
            <FiSearch className="search-icon-active" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            // Quando voltamos atrás, limpamos o input para permitir uma nova pesquisa
            onFocus={() => { if(selectedSkin) setQuery('') }}
            onChange={(e) => { 
                setQuery(e.target.value);
                // Se o utilizador começar a escrever, sai da vista de detalhes
                if (selectedSkin) setSelectedSkin(null);
            }}
            placeholder={t('common.searchPlaceholder')}
            className="search-input-active"
          />
        </div>
        <div className="results-container">
          {loading ? ( <div className="result-item-message">{t('common.loading')}</div> ) : 
           // CORREÇÃO: Lógica para mostrar a vista de detalhes ou a lista de resultados
           selectedSkin ? (
            <ul className="search-results-list">
              <li className="result-item-header">
                <img src={selectedSkin.image} alt={selectedSkin.name} className="result-image" />
                <div className="result-info">
                  <span className="result-name">{selectedSkin.name}</span>
                  <span className="result-details" style={{color: selectedSkin.rarity?.color}}>{selectedSkin.rarity?.name}</span>
                </div>
              </li>
              {generateVariations(selectedSkin).map(v => (
                <li key={v.market_hash_name} className="result-item-variation">
                  <Link to={`/skin/${encodeURIComponent(v.market_hash_name)}`} className="result-link" onClick={handleCloseSearch}>
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            results.length > 0 && (
              <ul className="search-results-list">
                {results.map((skin) => (
                  <li key={skin.id} className="result-item" onClick={() => setSelectedSkin(skin)}>
                    <div className="result-link">
                      <div className="rarity-bar" style={{ backgroundColor: skin.rarity?.color || '#3a3a3a' }}></div>
                      <img src={skin.image} alt={skin.name} className="result-image" />
                      <div className="result-info">
                        <span className="result-name">{skin.name}</span>
                        <span className="result-details">{skin.category?.name || skin.rarity?.name}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
          {!loading && query.length > 2 && results.length === 0 && !selectedSkin && (
            <div className="result-item-message">{t('common.noData')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;