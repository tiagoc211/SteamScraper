import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinDetails } from '../api/Skins';
import SkinCardListening from '../components/SkinCardListening';
import FilterSidebar from '../components/FilterSidebar';
import './SkinDetailPage.css';

const initialFilters = {
    price: ['', ''],
    wear: [0, 1],
    paintSeed: '',
    enabled: {
        price: false,
        wear: false,
        paintSeed: false,
    }
};

const SkinDetailPage = () => {
  const { marketHashName } = useParams();
  const [inspectedData, setInspectedData] = useState({});
  const [originalListings, setOriginalListings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('price');

  const handleToggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [filterName]: !prev.enabled[filterName],
      }
    }));
  };

  const sortListings = (list) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
        switch (sortBy) {
            case 'float':
                return (inspectedData[a.listingid]?.floatvalue || 1) - (inspectedData[b.listingid]?.floatvalue || 1);
            case 'pattern':
                return (inspectedData[a.listingid]?.paintseed || 1001) - (inspectedData[b.listingid]?.paintseed || 1001);
            case 'price':
            default:
                // CORREÇÃO: Usa a propriedade 'price', que agora é um número
                return a.price - b.price;
        }
    });
    return sorted;
  };

  const handleApplyFilters = () => {
    let filteredListings = [...originalListings];

    if (filters.enabled.price) {
        const minPrice = parseFloat(filters.price[0]);
        const maxPrice = parseFloat(filters.price[1]);
        if (!isNaN(minPrice)) {
            // CORREÇÃO: Usa 'price'
            filteredListings = filteredListings.filter(l => l.price >= minPrice);
        }
        if (!isNaN(maxPrice)) {
            // CORREÇÃO: Usa 'price'
            filteredListings = filteredListings.filter(l => l.price <= maxPrice);
        }
    }

    if (filters.enabled.wear) {
        const minWear = parseFloat(filters.wear[0]) || 0;
        const maxWear = parseFloat(filters.wear[1]) || 1;
        filteredListings = filteredListings.filter(l => {
            const float = inspectedData[l.listingid]?.floatvalue;
            return float === undefined ? true : (float >= minWear && float <= maxWear);
        });
    }

    if (filters.enabled.paintSeed && filters.paintSeed) {
        const seed = parseInt(filters.paintSeed, 10);
        filteredListings = filteredListings.filter(l => inspectedData[l.listingid]?.paintseed === seed);
    }
    
    setListings(sortListings(filteredListings));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setListings(sortListings(originalListings));
  };

  useEffect(() => {
    if (listings.length > 0) {
        setListings(sortListings(listings));
    }
  }, [sortBy]);

  useEffect(() => {
    const fetchSkinData = async () => {
      setLoading(true);
      setError(null);
      const data = await getSkinDetails(marketHashName);
      if (data && data.success) {
        // CORREÇÃO: A conversão no frontend foi removida, pois o backend já envia um número
        const listingsData = data.listings || [];
        
        setOriginalListings(listingsData);
        setListings(listingsData);
        
        for (const listing of listingsData) {
          const inspectUrl = listing.inspectLink;
          if (inspectUrl) {
            try {
              const res = await fetch(`http://localhost/?url=${encodeURIComponent(inspectUrl)}`);
              const json = await res.json();
              if (json && json.iteminfo) {
                setInspectedData(prev => ({ ...prev, [listing.listingid]: json.iteminfo }));
              }
            } catch (e) {
              console.error(`Erro ao inspecionar item ${listing.listingid}`, e);
            }
          }
        }
      } else {
        setError("Não foi possível carregar os dados desta skin.");
      }
      setLoading(false);
    };
    fetchSkinData();
  }, [marketHashName]);

  if (loading && originalListings.length === 0) {
    return <div className="loader">A carregar detalhes da skin...</div>;
  }
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="skin-detail-page">
      <FilterSidebar 
        filters={filters} 
        setFilters={setFilters} 
        onApplyFilters={handleApplyFilters}
        onToggleFilter={handleToggleFilter}
        onResetFilters={handleResetFilters}
      />
      <div className="main-content-column">
        <h1>{decodeURIComponent(marketHashName)}</h1>
        <div className="skin-listings-section">
          <div className="listings-header">
            <h2>Listings no Mercado</h2>
            <div className="sort-bar">
              <span>Ordenar por:</span>
              <button className={`sort-button ${sortBy === 'price' ? 'active' : ''}`} onClick={() => setSortBy('price')}>Preço</button>
              <button className={`sort-button ${sortBy === 'float' ? 'active' : ''}`} onClick={() => setSortBy('float')}>Float</button>
              <button className={`sort-button ${sortBy === 'pattern' ? 'active' : ''}`} onClick={() => setSortBy('pattern')}>Pattern</button>
            </div>
          </div>
          <div className="skin-cards-grid">
            {listings.length > 0 ? (
              listings.map(listing => (
                <SkinCardListening key={listing.listingid} listing={listing} inspectedData={inspectedData} marketHashName={marketHashName}/>
              ))
            ) : (
              <div>Nenhum listing encontrado para os filtros selecionados.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinDetailPage;