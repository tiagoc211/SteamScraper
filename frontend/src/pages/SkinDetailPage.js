import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinDetails } from '../api/Skins';
import SkinCardListening from '../components/SkinCardListening';
import FilterSidebar from '../components/FilterSidebar';
import './SkinDetailPage.css';

const initialFilters = {
    priceNumber: ['', ''],
    wear: [0, 1],
    paintSeed: '',
    fade: [80, 100],
    enabled: {
        // CORREÇÃO: A chave aqui deve ser 'priceNumber' para corresponder ao resto do código.
        priceNumber: false, 
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
  const [sortBy, setSortBy] = useState('priceNumber');

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
            case 'priceNumber':
            default:
                // Assegura que ambos os valores são números antes de subtrair
                return (a.priceNumber || 0) - (b.priceNumber || 0);
        }
    });
    return sorted;
  };

  const handleApplyFilters = () => {
    let filteredListings = [...originalListings];

    if (filters.enabled.priceNumber) {
        const minPrice = parseFloat(filters.priceNumber[0]);
        const maxPrice = parseFloat(filters.priceNumber[1]);
        if (!isNaN(minPrice)) {
            filteredListings = filteredListings.filter(l => (l.priceNumber || 0) >= minPrice);
        }
        if (!isNaN(maxPrice)) {
            filteredListings = filteredListings.filter(l => (l.priceNumber || 0) <= maxPrice);
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
        setListings(currentListings => sortListings(currentListings));
    }
  }, [sortBy, inspectedData]);


  useEffect(() => {
    const fetchSkinData = async () => {
      setLoading(true);
      setError(null);
      const data = await getSkinDetails(marketHashName);
      if (data && data.success) {
        const listingsData = data.listings || [];
        // Ordena os dados assim que chegam
        const sortedData = sortListings(listingsData);
        setOriginalListings(sortedData);
        setListings(sortedData);
        
        // Inicia o processo de inspeção para cada item
        for (const listing of listingsData) {
          const inspectUrl = listing.inspectLink;
          if (inspectUrl) {
            try {
              // NOTA: O endpoint 'http://localhost/' parece ser um proxy local. 
              // Assumindo que está a funcionar como esperado.
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
              <button className={`sort-button ${sortBy === 'priceNumber' ? 'active' : ''}`} onClick={() => setSortBy('priceNumber')}>Preço</button>
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