import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import pLimit from 'p-limit';
import { getSkinDetails } from '../api/Skins';
import TiltSkinCard from '../components/TiltSkinCard'; 
import FilterSidebar from '../components/FilterSidebar';
import PaginationControls from '../components/PaginationControls';
import './SkinDetailPage.css';

const ITEMS_PER_PAGE = 24;
const CONCURRENT_REQUEST_LIMIT = 8;

const initialFilters = {
    priceNumber: ['', ''],
    wear: ['', ''],
    paintSeed: '',
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState('priceNumber');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalListings: 0 });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadedCount, setLoadedCount] = useState(0);

    const inspectListings = useCallback((listingsToInspect) => {
        for (const listing of listingsToInspect) {
            if (listing.inspectLink) {
                fetch(`http://localhost/?url=${encodeURIComponent(listing.inspectLink)}`)
                    .then(res => res.json())
                    .then(json => {
                        if (json && json.iteminfo) {
                            setInspectedData(prev => ({ ...prev, [listing.listingid]: json.iteminfo }));
                        }
                    }).catch(e => console.error(`Erro ao inspecionar item ${listing.listingid}`, e));
            }
        }
    }, []);

    // useEffect para buscar dados iniciais (1ª página)
    useEffect(() => {
        const controller = new AbortController();
        const fetchInitialSkinData = async () => {
            setLoading(true);
            setError(null);
            setOriginalListings([]);
            setInspectedData({});
            const data = await getSkinDetails(marketHashName, controller.signal);
            if (data && data.success) {
                const initialListings = data.listings || [];
                setOriginalListings(initialListings);
                setLoadedCount(initialListings.length);
                setPagination(data.pagination);
                inspectListings(initialListings);
            } else if (data !== null) {
                setError("Não foi possível carregar os dados desta skin.");
            }
            setLoading(false);
        };
        fetchInitialSkinData();
        return () => controller.abort();
    }, [marketHashName, inspectListings]);

    // useEffect para buscar páginas restantes (LÓGICA CORRIGIDA)
    useEffect(() => {
        if (loading || pagination.currentPage >= pagination.totalPages) return;
        
        const fetchRemainingPages = async () => {
            setIsLoadingMore(true);
            const limit = pLimit(CONCURRENT_REQUEST_LIMIT);
            const tasks = [];

            for (let i = pagination.currentPage + 1; i <= pagination.totalPages; i++) {
                tasks.push(limit(async () => {
                    try {
                        const res = await fetch(`http://localhost:3001/api/skin/${encodeURIComponent(marketHashName)}/page/${i}`);
                        const data = await res.json();
                        if (data.success && data.listings) {
                            setLoadedCount(prev => prev + data.listings.length);
                            inspectListings(data.listings);
                            return data.listings;
                        }
                    } catch (e) { 
                        console.error(`Erro ao buscar página ${i}`, e); 
                    }
                    return null;
                }));
            }

            const pagesResults = await Promise.all(tasks);
            const allNewListings = pagesResults.flat().filter(Boolean);
            setOriginalListings(prev => [...prev, ...allNewListings]);

            setPagination(prev => ({ ...prev, currentPage: prev.totalPages }));
            setIsLoadingMore(false);
        };

        fetchRemainingPages();
    }, [loading, pagination, marketHashName, inspectListings]);

    const filteredListings = useMemo(() => {
        let processedListings = originalListings.filter(l => inspectedData[l.listingid]);
        
        if (filters.enabled.priceNumber) {
            const minPrice = parseFloat(filters.priceNumber[0]);
            const maxPrice = parseFloat(filters.priceNumber[1]);
            if (!isNaN(minPrice)) processedListings = processedListings.filter(l => (l.priceNumber || 0) >= minPrice);
            if (!isNaN(maxPrice)) processedListings = processedListings.filter(l => (l.priceNumber || 0) <= maxPrice);
        }
        if (filters.enabled.wear) {
            const minWear = parseFloat(filters.wear[0]);
            const maxWear = parseFloat(filters.wear[1]);
            processedListings = processedListings.filter(l => {
                const float = inspectedData[l.listingid].floatvalue;
                let match = true;
                if (!isNaN(minWear)) match = match && float >= minWear;
                if (!isNaN(maxWear)) match = match && float <= maxWear;
                return match;
            });
        }
        if (filters.enabled.paintSeed && filters.paintSeed) {
            const seed = parseInt(filters.paintSeed, 10);
            if (!isNaN(seed)) processedListings = processedListings.filter(l => inspectedData[l.listingid].paintseed === seed);
        }
        
        processedListings.sort((a, b) => {
            const itemA = inspectedData[a.listingid];
            const itemB = inspectedData[b.listingid];
            switch (sortBy) {
                case 'float': return (itemA?.floatvalue || 1) - (itemB?.floatvalue || 1);
                case 'pattern': return (itemA?.paintseed || 1001) - (itemB?.paintseed || 1001);
                default: return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });

        return processedListings;
    }, [originalListings, filters, sortBy, inspectedData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortBy]);

    const visibleListings = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredListings.slice(startIndex, endIndex);
    }, [filteredListings, currentPage]);
    
    const handleToggleFilter = (filterName) => setFilters(prev => ({ ...prev, enabled: { ...prev.enabled, [filterName]: !prev.enabled[filterName] } }));
    const handleResetFilters = () => setFilters(initialFilters);

    if (loading && originalListings.length === 0) return <div className="loader">A carregar detalhes da skin...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const progress = pagination.totalListings ? (loadedCount / pagination.totalListings) * 100 : 0;
    const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);

    return (
        <div className="skin-detail-page">
            <FilterSidebar filters={filters} setFilters={setFilters} onApplyFilters={() => {}} onToggleFilter={handleToggleFilter} onResetFilters={handleResetFilters} />
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

                    {(isLoadingMore || (progress < 100 && progress > 0)) && pagination.totalPages > 1 && (
                        <div className="loading-progress-container">
                            <div className="progress-bar-background">
                                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                                <div className="progress-text">
                                    A carregar... {loadedCount} / {pagination.totalListings}
                                </div>
                            </div>
                        </div>
                    )}

                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />

                    <div className="skin-cards-grid">
                        {visibleListings.length > 0 ? (
                            visibleListings.map(listing => (
                                <TiltSkinCard
                                    key={listing.listingid}
                                    listing={listing}
                                    inspectedData={inspectedData}
                                />
                            ))
                        ) : (
                            !isLoadingMore && <div>Nenhum listing encontrado para os filtros selecionados.</div>
                        )}
                    </div>

                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
};

export default SkinDetailPage;