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
  
  const triggerFetch = useRef(true); // Usado para forçar a busca quando os filtros mudam

  // Lógica de "Scroll Infinito"
  const observer = useRef();
  const lastItemElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Efeito principal para buscar dados
  useEffect(() => {
    // Não faz nada se não houver mais páginas para carregar
    if (!hasMore && !triggerFetch.current) return;

    const fetchItems = async () => {
      setLoading(true);
      // Se for uma nova busca (triggerFetch), começa na página 1
      const currentPage = triggerFetch.current ? 1 : page;
      const params = { ...filters, page: currentPage, limit: 100 };
      
      const data = await getBrowseItemsFromDB(params);
      
      // CORREÇÃO: Verificação robusta para evitar o crash
      if (data && data.items && data.pagination) {
        setItems(prevItems => triggerFetch.current ? data.items : [...prevItems, ...data.items]);
        // Usa optional chaining (?.) para segurança máxima
        setHasMore(currentPage < (data.pagination.totalPages || 0)); 
      } else {
        // Em caso de erro na API, para de tentar carregar mais
        setHasMore(false);
      }

      setLoading(false);
      triggerFetch.current = false; // Reseta o gatilho
    };

    fetchItems();
  }, [page, filters]); // Executa quando a página ou os filtros mudam

  // Efeito para resetar o estado quando os filtros mudam
  useEffect(() => {
    // Ignora a primeira renderização
    const initialRender = page === 1 && items.length === 0;
    if (!initialRender) {
        setPage(1);
        setItems([]);
        setHasMore(true);
        triggerFetch.current = true; // Ativa o gatilho para forçar a busca
    }
  }, [filters]);


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
          {items.map((item, index) => {
            if (items.length === index + 1) {
              return <BrowseSkinCard ref={lastItemElementRef} key={`${item.id}-${index}`} item={item} />;
            } else {
              return <BrowseSkinCard key={`${item.id}-${index}`} item={item} />;
            }
          })}
        </div>
        {loading && <div className="loader">Loading more items...</div>}
        {!loading && !hasMore && items.length > 0 && <div className="end-of-results">You've reached the end!</div>}
        {!loading && items.length === 0 && <div className="no-results-message">No items found matching your criteria.</div>}
      </main>
    </div>
  );
};

export default BrowseSkinsPage;