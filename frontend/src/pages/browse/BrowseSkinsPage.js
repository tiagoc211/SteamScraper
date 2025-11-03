// src/pages/browse/BrowseSkinsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowseItemsFromDB } from '../../api/api';
import FilterSidebar from '../../components/skin/FilterSidebar/FilterSidebar';
import BrowseSkinCard from '../../components/skin/BrowseSkinCard/BrowseSkinCard';
import './BrowseSkinsPage.css';

const CategoryNav = ({ categories, selected, onSelect }) => (
    <nav className="category-nav">{categories.map(cat => (<button key={cat} className={`category-btn ${selected === cat ? 'active' : ''}`} onClick={() => onSelect(cat)}>{cat}</button>))}</nav>
);

const BrowseSkinsPage = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '', category: 'Rifles', stattrak: false, souvenir: false,
    sortBy: 'floatid', sortOrder: 'ASC', rarity: ''
  });
  
  const observer = useRef();
  const isInitialLoadForFilters = useRef(true);

  // Função para buscar dados, agora isolada
  const fetchItems = useCallback((currentPage, currentFilters) => {
    setLoading(true);
    const params = { ...currentFilters, page: currentPage, limit: 100 };
    
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
    <div className="browse-page-container">
      <FilterSidebar filters={filters} setFilters={setFilters} context="browse" />
      <main className="browse-main-content">
        <CategoryNav 
            categories={categories} 
            selected={filters.category} 
            onSelect={(cat) => setFilters(prev => ({...prev, category: cat}))} 
        />
        <div className="skins-grid">
          {items.map((item, index) => (
            <BrowseSkinCard
              key={`${item.id}-${index}`}
              item={item}
              variant="browse"
            />
          ))}
        </div>

        {/* CORREÇÃO: O "gatilho" para carregar mais e as mensagens de estado */}
        <div ref={loadMoreTriggerRef} className="load-trigger" />
        {loading && <div className="loader">Loading more items...</div>}
        {!loading && !hasMore && items.length > 0 && <div className="end-of-results">You've reached the end!</div>}
        {!loading && items.length === 0 && <div className="no-results-message">No items found matching your criteria.</div>}
      </main>
    </div>
  );
};

export default BrowseSkinsPage;