import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getSkinDetails } from '../api/Skins';
// CORREÇÃO: A importação do novo componente foi adicionada aqui
import TiltSkinCard from '../components/TiltSkinCard'; 
import FilterSidebar from '../components/FilterSidebar';
import './SkinDetailPage.css';

const initialFilters = {
    priceNumber: ['', ''],
    wear: ['', ''],
    paintSeed: '',
    fade: [80, 100],
    enabled: {
        priceNumber: false,
        wear: false,
        paintSeed: false,
    }
};

const SkinDetailPage = () => {
    const { marketHashName } = useParams();
    const [searchParams] = useSearchParams();

    const [inspectedData, setInspectedData] = useState({});
    const [originalListings, setOriginalListings] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState('priceNumber');

    const sortListings = useCallback((list) => {
        const sorted = [...list];
        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'float':
                    return (inspectedData[a.listingid]?.floatvalue || 1) - (inspectedData[b.listingid]?.floatvalue || 1);
                case 'pattern':
                    return (inspectedData[a.listingid]?.paintseed || 1001) - (inspectedData[b.listingid]?.paintseed || 1001);
                case 'priceNumber':
                default:
                    return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });
        return sorted;
    }, [sortBy, inspectedData]);

    const applyFilters = useCallback((listingsToFilter) => {
        let filteredListings = [...listingsToFilter];

        if (filters.enabled.priceNumber) {
            const minPrice = parseFloat(filters.priceNumber[0]);
            const maxPrice = parseFloat(filters.priceNumber[1]);
            if (!isNaN(minPrice)) filteredListings = filteredListings.filter(l => (l.priceNumber || 0) >= minPrice);
            if (!isNaN(maxPrice)) filteredListings = filteredListings.filter(l => (l.priceNumber || 0) <= maxPrice);
        }

        if (filters.enabled.wear) {
            const minWear = parseFloat(filters.wear[0]);
            const maxWear = parseFloat(filters.wear[1]);
            filteredListings = filteredListings.filter(l => {
                const float = inspectedData[l.listingid]?.floatvalue;
                if (float === undefined) return false;
                let match = true;
                if (!isNaN(minWear)) match = match && float >= minWear;
                if (!isNaN(maxWear)) match = match && float <= maxWear;
                return match;
            });
        }

        if (filters.enabled.paintSeed && filters.paintSeed) {
            const seed = parseInt(filters.paintSeed, 10);
            if (!isNaN(seed)) filteredListings = filteredListings.filter(l => inspectedData[l.listingid]?.paintseed === seed);
        }

        setListings(sortListings(filteredListings));
    }, [filters, inspectedData, sortListings]);

    useEffect(() => {
        if (originalListings.length > 0) {
            applyFilters(originalListings);
        }
    }, [originalListings, inspectedData, filters, applyFilters]);

    useEffect(() => {
        const minFloatParam = searchParams.get('minFloat');
        const maxFloatParam = searchParams.get('maxFloat');
        const patternParam = searchParams.get('pattern');

        if (minFloatParam || maxFloatParam || patternParam) {
            const newFilters = { ...initialFilters };
            if (minFloatParam || maxFloatParam) {
                newFilters.enabled.wear = true;
                newFilters.wear = [minFloatParam || '', maxFloatParam || ''];
            }
            if (patternParam) {
                newFilters.enabled.paintSeed = true;
                newFilters.paintSeed = patternParam;
            }
            setFilters(newFilters);
        }

        const fetchSkinData = async () => {
            setLoading(true);
            setError(null);
            const data = await getSkinDetails(marketHashName);
            if (data && data.success) {
                const listingsData = data.listings || [];
                setOriginalListings(listingsData);

                for (const listing of listingsData) {
                    if (listing.inspectLink) {
                        try {
                            const res = await fetch(`http://localhost/?url=${encodeURIComponent(listing.inspectLink)}`);
                            const json = await res.json();
                            if (json && json.iteminfo) {
                                setInspectedData(prev => ({ ...prev, [listing.listingid]: json.iteminfo }));
                            }
                        } catch (e) { console.error(`Erro ao inspecionar item ${listing.listingid}`, e); }
                    }
                }
            } else {
                setError("Não foi possível carregar os dados desta skin.");
            }
            setLoading(false);
        };
        fetchSkinData();
    }, [marketHashName, searchParams]);

    const handleToggleFilter = (filterName) => setFilters(prev => ({ ...prev, enabled: { ...prev.enabled, [filterName]: !prev.enabled[filterName] } }));
    const handleResetFilters = () => setFilters(initialFilters);

    if (loading && originalListings.length === 0) return <div className="loader">A carregar detalhes da skin...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="skin-detail-page">
            <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onApplyFilters={() => applyFilters(originalListings)}
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
                                <TiltSkinCard
                                    key={listing.listingid}
                                    listing={listing}
                                    inspectedData={inspectedData}
                                />
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