import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import pLimit from 'p-limit';
import { getSkinDetails, getSkinPage, inspectSkin } from '../api/Skins';
import TiltSkinCard from '../components/TiltSkinCard';
import FilterSidebar from '../components/FilterSidebar';
import PaginationControls from '../components/PaginationControls';
import { useCurrency } from '../context/CurrencyContext';
import './SkinDetailPage.css';

const ITEMS_PER_PAGE = 24;
const FETCH_CONCURRENT_LIMIT = 20;
const INSPECT_CONCURRENT_LIMIT = 30;

const initialFilters = {
    priceNumber: ['', ''], wear: ['', ''], paintSeed: '',
    enabled: { priceNumber: false, wear: false, paintSeed: false }
};

const FullPageLoader = () => (
    <div className="loader">A otimizar a busca pelas melhores skins...</div>
);

const SkinDetailPage = () => {
    const { marketHashName } = useParams();
    const { currency } = useCurrency();

    const [allListings, setAllListings] = useState([]);
    const [inspectedData, setInspectedData] = useState({});
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState('priceNumber');
    const [currentPage, setCurrentPage] = useState(1);

    const inspectQueue = useMemo(() => pLimit(INSPECT_CONCURRENT_LIMIT), []);

    const inspectListing = useCallback(async (listing) => {
        if (listing.inspectLink) {
            const data = await inspectSkin(listing.inspectLink);
            if (data && data.iteminfo) {
                setInspectedData(prev => ({ ...prev, [listing.listingid]: data.iteminfo }));
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const fetchQueue = pLimit(FETCH_CONCURRENT_LIMIT);

        const fetchAllSkinData = async () => {
            setIsInitialLoad(true); setError(null); setAllListings([]);
            setInspectedData({}); setCurrentPage(1); setLoadingProgress({ loaded: 0, total: 0 });

            try {
                const firstPageData = await getSkinDetails(marketHashName, controller.signal, currency.id);
                if (!firstPageData || !firstPageData.success) throw new Error("Não foi possível carregar os dados desta skin.");

                const initialListings = firstPageData.listings || [];
                const { totalPages, totalListings } = firstPageData.pagination;
                
                setAllListings(initialListings);
                setLoadingProgress({ loaded: initialListings.length, total: totalListings });

                if (totalPages > 1) {
                    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
                        .map(pageNumber => fetchQueue(async () => {
                            const pageData = await getSkinPage(marketHashName, pageNumber, controller.signal, currency.id);
                            if (pageData?.success && pageData.listings) {
                                setLoadingProgress(prev => ({ ...prev, loaded: prev.loaded + pageData.listings.length }));
                                return pageData.listings;
                            }
                            return [];
                        }));
                    
                    for (const promise of pagePromises) {
                        const newlistings = await promise;
                        if (controller.signal.aborted) return;
                        setAllListings(prev => [...prev, ...newlistings]);
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            }
        };

        fetchAllSkinData();
        return () => { controller.abort(); inspectQueue.clearQueue(); };
    }, [marketHashName, inspectQueue, currency.id]);

    useEffect(() => {
        const listingsToInspect = allListings.filter(l => l.inspectLink && !inspectedData[l.listingid]);
        listingsToInspect.forEach(listing => { inspectQueue(() => inspectListing(listing)); });
    }, [allListings, inspectedData, inspectQueue, inspectListing]);

    useEffect(() => {
        if (!isInitialLoad) return;
        if (loadingProgress.total === 0) {
            if (allListings.length > 0 && Object.keys(inspectedData).length >= allListings.length) {
                 setIsInitialLoad(false);
            }
            return;
        }
        const inspectedCount = Object.keys(inspectedData).length;
        const targetInspectCount = Math.min(ITEMS_PER_PAGE, loadingProgress.total);
        if (inspectedCount >= targetInspectCount) {
            setIsInitialLoad(false);
        }
    }, [inspectedData, loadingProgress, allListings.length, isInitialLoad]);
    
        const filteredAndSortedListings = useMemo(() => {
        // Passo 1: A defesa mais importante. Começar apenas com listings que já têm dados de inspeção.
        let processed = allListings.filter(l => inspectedData[l.listingid]);
        
        // Passo 2: Aplicar os filtros ativados
        if (filters.enabled.priceNumber) {
            const min = parseFloat(filters.priceNumber[0] || 0);
            const max = parseFloat(filters.priceNumber[1] || Infinity);
            processed = processed.filter(l => (l.priceNumber || 0) >= min && (l.priceNumber || 0) <= max);
        }
        if (filters.enabled.wear) {
            const min = parseFloat(filters.wear[0] || 0);
            const max = parseFloat(filters.wear[1] || 1);
            processed = processed.filter(l => {
                const float = inspectedData[l.listingid]?.floatvalue;
                return float >= min && float <= max;
            });
        }
        if (filters.enabled.paintSeed && filters.paintSeed) {
            const seed = parseInt(filters.paintSeed, 10);
            if (!isNaN(seed)) {
                 processed = processed.filter(l => inspectedData[l.listingid]?.paintseed === seed);
            }
        }
        
        // Passo 3: Ordenar a lista resultante
        return processed.sort((a, b) => {
            const itemA = inspectedData[a.listingid];
            const itemB = inspectedData[b.listingid];
            
            switch (sortBy) {
                case 'float':
                    // Ordenar por float value, ascendente (menor para o maior)
                    return (itemA?.floatvalue || 1) - (itemB?.floatvalue || 1);
                case 'pattern':
                    // Ordenar por pattern ID, ascendente
                    return (itemA?.paintseed || 0) - (itemB?.paintseed || 0);
                default: // 'priceNumber'
                    // Ordenar por preço, ascendente
                    return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });
    }, [allListings, filters, sortBy, inspectedData]);

        useEffect(() => { setCurrentPage(1); }, [filters, sortBy]);

    const totalPages = Math.ceil(filteredAndSortedListings.length / ITEMS_PER_PAGE);
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedListings, currentPage]);
    
    const handleToggleFilter = (filterName) => setFilters(prev => ({ ...prev, enabled: { ...prev.enabled, [filterName]: !prev.enabled[filterName] } }));
    const handleResetFilters = () => setFilters(initialFilters);

    if (isInitialLoad) return <FullPageLoader />;
    if (error) return <div className="error-message">{error}</div>;

    const showProgressBar = loadingProgress.loaded < loadingProgress.total;
    const progressPercent = loadingProgress.total > 0 ? (loadingProgress.loaded / loadingProgress.total) * 100 : 0;

    return (
        <div className="skin-detail-page">
            <FilterSidebar filters={filters} setFilters={setFilters} onToggleFilter={handleToggleFilter} onResetFilters={handleResetFilters} />
            <div className="main-content-column">
                <h1>{decodeURIComponent(marketHashName)}</h1>
                <div className="skin-listings-section">
                    <div className="listings-header">
                        <h2>{`A mostrar ${filteredAndSortedListings.length} de ${loadingProgress.total} listings`}</h2>
                        <div className="sort-bar">
                           <span>Ordenar por:</span>
                            <button className={`sort-button ${sortBy === 'priceNumber' ? 'active' : ''}`} onClick={() => setSortBy('priceNumber')}>Preço</button>
                            <button className={`sort-button ${sortBy === 'float' ? 'active' : ''}`} onClick={() => setSortBy('float')}>Float</button>
                            <button className={`sort-button ${sortBy === 'pattern' ? 'active' : ''}`} onClick={() => setSortBy('pattern')}>Pattern</button>
                        </div>
                    </div>
                    {showProgressBar && (
                        <div className="loading-progress-container">
                            <div className="progress-bar-background">
                                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                                <div className="progress-text">A carregar skins adicionais... {loadingProgress.loaded} / {loadingProgress.total}</div>
                            </div>
                        </div>
                    )}
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    <div className="skin-cards-grid">
                        {paginatedListings.map(listing => (
                            <TiltSkinCard key={listing.listingid} listing={listing} inspectedData={inspectedData} />
                        ))}
                    </div>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

export default SkinDetailPage;