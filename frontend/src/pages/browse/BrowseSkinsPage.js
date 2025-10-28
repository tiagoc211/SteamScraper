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
  
  const isInitialMount = useRef(true);
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

  // Efeito para buscar dados quando a página muda
  useEffect(() => {
    if (isInitialMount.current && page === 1) return; // Não busca na primeira renderização da página
    setLoading(true);
    const params = { ...filters, page, limit: 100 };
    getBrowseItemsFromDB(params).then(data => {
      if (data && data.items) {
        setItems(prev => [...prev, ...data.items]);
        setHasMore(page < (data.pagination.totalPages || 0));
      }
      setLoading(false);
    });
  }, [page]);

  // Efeito para buscar dados quando os filtros mudam
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    const params = { ...filters, page: 1, limit: 100 };
    getBrowseItemsFromDB(params).then(data => {
        if (data && data.items) {
            setItems(data.items);
            setHasMore(1 < (data.pagination.totalPages || 0));
        }
        setLoading(false);
    });
    
    if (isInitialMount.current) {
        isInitialMount.current = false;
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
          {items.map((item, index) => (
            <BrowseSkinCard
              ref={items.length === index + 1 ? lastItemElementRef : null}
              key={`${item.id}-${index}`}
              item={item}
            />
          ))}
        </div>
        {loading && <div className="loader">Loading more items...</div>}
        {!loading && !hasMore && items.length > 0 && <div className="end-of-results">You've reached the end!</div>}
        {!loading && items.length === 0 && <div className="no-results-message">No items found matching your criteria.</div>}
      </main>
    </div>
  );
};

export default BrowseSkinsPage;