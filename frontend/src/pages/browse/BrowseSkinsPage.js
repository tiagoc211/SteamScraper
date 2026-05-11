// src/pages/browse/BrowseSkinsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getBrowseItemsFromDB } from '../../api/api';
import FilterSidebar from '../../components/skin/FilterSidebar/FilterSidebar';
import BrowseSkinCard from '../../components/skin/BrowseSkinCard/BrowseSkinCard';
import AdBanner from '../../components/ui/AdBanner/AdBanner';
import './BrowseSkinsPage.css';

const CategoryNav = ({ categories, selected, onSelect, t }) => {
  const categoryKeys = {
    'All': 'browse.all',
    'Rifles': 'browse.rifles',
    'Pistols': 'browse.pistols',
    'SMGs': 'browse.smgs',
    'Heavy': 'browse.heavy',
    'Knives': 'browse.knives',
    'Gloves': 'browse.gloves'
  };
  return (
    <nav className="category-nav">
      {categories.map(cat => (
        <button 
          key={cat} 
          className={`category-btn ${selected === cat ? 'active' : ''}`} 
          onClick={() => onSelect(cat)}
        >
          {t(categoryKeys[cat] || cat)}
        </button>
      ))}
    </nav>
  );
};

const BrowseSkinsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showDatabaseNotice, setShowDatabaseNotice] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '', category: 'All', stattrak: false, souvenir: false,
    sortBy: 'floatid', sortOrder: 'ASC', rarity: '',
    priceNumber: ['', ''], wear: ['', ''], paintSeed: ''
  });
  
  const observer = useRef();
  const isInitialLoadForFilters = useRef(true);

  // Função para buscar dados, agora isolada
  const fetchItems = useCallback((currentPage, currentFilters) => {
    setLoading(true);
    console.log('🔍 Fetching items:', { page: currentPage, category: currentFilters.category, sortBy: currentFilters.sortBy });
    const params = {
      ...currentFilters,
      page: currentPage,
      limit: 100,
      priceMin: currentFilters.priceNumber?.[0] || undefined,
      priceMax: currentFilters.priceNumber?.[1] || undefined,
      wearMin: currentFilters.wear?.[0] || undefined,
      wearMax: currentFilters.wear?.[1] || undefined,
      paintSeed: currentFilters.paintSeed || undefined,
    };
    // Remove array fields that were already expanded above
    delete params.priceNumber;
    delete params.wear;
    
    getBrowseItemsFromDB(params).then(data => {
      if (data && data.items) {
        setItems(prevItems => (currentPage === 1) ? data.items : [...prevItems, ...data.items]);
        setHasMore(currentPage < (data.pagination?.totalPages || 0));
      } else {
        setHasMore(false); // Para a busca em caso de erro na API
      }
      setLoading(false);
    });
  }, []);

  // Efeito para a busca inicial e para quando os filtros mudam
  useEffect(() => {
    setItems([]); // Limpa os itens anteriores
    setPage(1);   // Reseta a página para 1
    setHasMore(true); // Permite que o scroll infinito recomece
    fetchItems(1, filters); // Busca a primeira página com os novos filtros
    
    if (isInitialLoadForFilters.current) {
        isInitialLoadForFilters.current = false;
    }
  }, [filters, fetchItems]);

  // Efeito APENAS para o scroll infinito (carregar mais páginas)
  useEffect(() => {
    // Não busca a página 1 novamente, pois já foi feito pelo efeito dos filtros
    if (page === 1) return; 
    
    fetchItems(page, filters);
  }, [page, filters, fetchItems]);

  // CORREÇÃO: O observador agora tem um alvo dedicado
  const loadMoreTriggerRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);


  const categories = ['All', 'Rifles', 'Pistols', 'SMGs', 'Heavy', 'Knives', 'Gloves'];

  return (
    <>
      {showDatabaseNotice && (
        <div className="database-notice">
          <span>ⓘ {t('common.databaseNotice')}</span>
          <button className="notice-close-btn" onClick={() => setShowDatabaseNotice(false)}>×</button>
        </div>
      )}
      <div className="browse-page-container">
        <FilterSidebar filters={filters} setFilters={setFilters} context="browse" />
      <main className="browse-main-content">
        <CategoryNav 
            categories={categories} 
            selected={filters.category} 
            onSelect={(cat) => setFilters(prev => ({...prev, category: cat}))}
            t={t}
        />

        {/* Leaderboard ad abaixo da navegação de categorias */}
        <AdBanner variant="leaderboard" adSlot="8971192051" className="browse-ad-top" />

        <div className="skins-grid">
          {items.map((item, index) => (
            <BrowseSkinCard
              key={`${item.id}-${index}`}
              item={item}
              variant="browse"
            />
          ))}
        </div>

        {/* Rectangular ad ao fim da grelha */}
        {!hasMore && items.length > 0 && (
          <AdBanner variant="rectangle" adSlot="6952357789" />
        )}

        <div ref={loadMoreTriggerRef} className="load-trigger" />
        {loading && <div className="loader">{t('common.loading')}</div>}
        {!loading && !hasMore && items.length > 0 && <div className="end-of-results">{t('browse.noResults')}</div>}
        {!loading && items.length === 0 && <div className="no-results-message">{t('browse.noResults')}</div>}
      </main>
      </div>
    </>
  );
};

export default BrowseSkinsPage;