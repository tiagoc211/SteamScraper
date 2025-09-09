// frontend/src/pages/skin/SkinDetailPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import pLimit from 'p-limit';
import { useVirtualizer } from '@tanstack/react-virtual';

// Componentes e API
import { getSkinDetails, getSkinPage, inspectSkin } from '../../api/api';
import TiltSkinCard from '../../components/skin/TiltSkinCard/TiltSkinCard';
import FilterSidebar from '../../components/skin/FilterSidebar/FilterSidebar';
import PaginationControls from '../../components/ui/PaginationControls/PaginationControls';
import './SkinDetailPage.css';

// --- Constantes de Configuração ---
// Número de itens a mostrar por página na UI
const ITEMS_PER_PAGE = 24;
// Limites de concorrência para otimização de performance da rede
const CONCURRENT_REQUEST_LIMIT = 100;
const INSPECT_CONCURRENT_LIMIT = 33;
const inspectLimit = pLimit(INSPECT_CONCURRENT_LIMIT);

// Estado inicial para os filtros
const initialFilters = {
    priceNumber: ['', ''], wear: ['', ''], paintSeed: '',
    enabled: { priceNumber: false, wear: false, paintSeed: false }
};

// Componente de loading para a carga inicial
const FullPageLoader = () => (
    <div className="loader">A preparar as melhores skins para si...</div>
);

const SkinDetailPage = () => {
    // --- Hooks de Estado ---
    const { marketHashName } = useParams();
    // Estado dos dados
    const [allListings, setAllListings] = useState([]);
    const [inspectedData, setInspectedData] = useState({});
    // Estado da UI (loading, erros, paginação)
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState('priceNumber');
    const [currentPage, setCurrentPage] = useState(1);

    // --- Lógica de Callbacks (Memoizados para performance) ---
    const inspectListing = useCallback(async (listing) => {
        if (listing.inspectLink) {
            const data = await inspectSkin(listing.inspectLink);
            if (data && data.iteminfo) {
                setInspectedData(prev => ({ ...prev, [listing.listingid]: data.iteminfo }));
            }
        }
    }, []);

    const enqueueInspect = useCallback((listing) => {
        inspectLimit(() => inspectListing(listing))
            .catch(err => console.warn(`Erro ao inspecionar ${listing.listingid}:`, err));
    }, [inspectListing]);

    // --- Efeitos (Lifecycle) ---
    // Efeito principal para buscar todos os dados da skin
    useEffect(() => {
        const controller = new AbortController();
        const limit = pLimit(CONCURRENT_REQUEST_LIMIT);

        const fetchAllSkinData = async () => {
            // Reset de todos os estados para uma nova pesquisa
            setIsInitialLoad(true);
            setError(null);
            setAllListings([]);
            setInspectedData({});
            setCurrentPage(1);
            setLoadingProgress({ loaded: 0, total: 0 });

            try {
                const firstPageData = await getSkinDetails(marketHashName, controller.signal);
                if (!firstPageData || !firstPageData.success) throw new Error("Não foi possível carregar os dados desta skin.");

                const initialListings = firstPageData.listings || [];
                const { totalPages, totalListings } = firstPageData.pagination;
                
                setAllListings(initialListings);
                initialListings.forEach(enqueueInspect);
                setLoadingProgress({ loaded: initialListings.length, total: totalListings });

                if (totalPages > 1) {
                    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
                        .map(pageNumber => 
                            limit(async () => {
                                const pageData = await getSkinPage(marketHashName, pageNumber, controller.signal);
                                if (pageData?.success && pageData.listings) {
                                    setLoadingProgress(prev => ({ ...prev, loaded: prev.loaded + pageData.listings.length }));
                                    pageData.listings.forEach(enqueueInspect);
                                    return pageData.listings;
                                }
                                return [];
                            })
                        );
                    
                    const subsequentListingsArrays = await Promise.all(pagePromises);
                    setAllListings(prev => [...prev, ...subsequentListingsArrays.flat()]);
                }
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            }
        };

        fetchAllSkinData();
        return () => controller.abort();
    }, [marketHashName, enqueueInspect]);

    // Efeito para determinar o fim do carregamento inicial
    useEffect(() => {
        if (!isInitialLoad) return;
        const inspectedCount = Object.keys(inspectedData).length;
        const totalFetched = allListings.length;
        if (loadingProgress.total > 0 && inspectedCount >= loadingProgress.total) {
            setIsInitialLoad(false);
        } else if (totalFetched > 0 && inspectedCount >= totalFetched && loadingProgress.loaded >= loadingProgress.total) {
            setIsInitialLoad(false);
        }
    }, [inspectedData, allListings.length, loadingProgress, isInitialLoad]);
    
    // --- Lógica de Derivação de Estado (Memoizada para performance) ---
    // Lista completa, filtrada e ordenada
    const filteredAndSortedListings = useMemo(() => {
        let processed = allListings.filter(l => inspectedData[l.listingid]);
        
        if (filters.enabled.priceNumber) {
            const minPrice = parseFloat(filters.priceNumber[0] || 0);
            const maxPrice = parseFloat(filters.priceNumber[1] || Infinity);
            processed = processed.filter(l => (l.priceNumber || 0) >= minPrice && (l.priceNumber || 0) <= maxPrice);
        }
        if (filters.enabled.wear) {
            const minWear = parseFloat(filters.wear[0] || 0);
            const maxWear = parseFloat(filters.wear[1] || 1);
            processed = processed.filter(l => inspectedData[l.listingid]?.floatvalue >= minWear && inspectedData[l.listingid]?.floatvalue <= maxWear);
        }
        if (filters.enabled.paintSeed && filters.paintSeed) {
            const seed = parseInt(filters.paintSeed, 10);
            processed = processed.filter(l => inspectedData[l.listingid]?.paintseed === seed);
        }
        
        return processed.sort((a, b) => {
            const itemA = inspectedData[a.listingid];
            const itemB = inspectedData[b.listingid];
            switch (sortBy) {
                case 'float': return (itemA?.floatvalue || 1) - (itemB?.floatvalue || 1);
                case 'pattern': return (itemA?.paintseed || 0) - (itemB?.paintseed || 0);
                default: return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });
    }, [allListings, filters, sortBy, inspectedData]);

    // Efeito que reseta a página para 1 quando os filtros mudam
    useEffect(() => { setCurrentPage(1); }, [filters, sortBy]);

    const totalPages = Math.ceil(filteredAndSortedListings.length / ITEMS_PER_PAGE);
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedListings, currentPage]);
    
    // --- Lógica de Virtualização ---
    const parentRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: paginatedListings.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 450,
        overscan: 5,
    });
    
    // SOLUÇÃO PARA O BUG: Chave que força a re-montagem da lista
    const listKey = useMemo(() => `${currentPage}-${sortBy}-${JSON.stringify(filters.enabled)}`, [currentPage, sortBy, filters.enabled]);

    // --- Manipuladores de Eventos ---
    const handleToggleFilter = (filterName) => setFilters(prev => ({ ...prev, enabled: { ...prev.enabled, [filterName]: !prev.enabled[filterName] } }));
    const handleResetFilters = () => setFilters(initialFilters);

    // --- Lógica de Renderização ---
    if (isInitialLoad && allListings.length === 0) return <FullPageLoader />;
    if (error) return <div className="error-message">{error}</div>;

    const isLoadingInBackground = loadingProgress.loaded < loadingProgress.total;
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
                    {isLoadingInBackground && (
                        <div className="loading-progress-container">
                            <div className="progress-bar-background">
                                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                                <div className="progress-text">A carregar skins adicionais... {loadingProgress.loaded} / {loadingProgress.total}</div>
                            </div>
                        </div>
                    )}
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    
                    <div key={listKey} ref={parentRef} className="skin-cards-grid-virtualized">
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualItem => {
                                const listing = paginatedListings[virtualItem.index];
                                if (!listing) return null;

                                return (
                                    <div
                                        key={listing.listingid}
                                        className="virtual-item"
                                        style={{ transform: `translateY(${virtualItem.start}px)` }}
                                    >
                                        <TiltSkinCard
                                            listing={listing}
                                            inspectedData={inspectedData}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

export default SkinDetailPage;