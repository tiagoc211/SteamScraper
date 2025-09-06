import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import pLimit from 'p-limit';
import { getSkinDetails, getSkinPage, inspectSkin } from '../api/Skins';
import TiltSkinCard from '../components/TiltSkinCard';
import FilterSidebar from '../components/FilterSidebar';
import PaginationControls from '../components/PaginationControls';
import './SkinDetailPage.css';

// --- CONFIGURAÇÃO ESTRATÉGICA ---
const ITEMS_PER_PAGE = 24;
// << A ESTRATÉGIA IDEAL >>: Um limite de concorrência que é rápido, mas não agressivo.
const CONCURRENT_REQUEST_LIMIT = 100;

const initialFilters = {
    priceNumber: ['', ''], wear: ['', ''], paintSeed: '',
    enabled: { priceNumber: false, wear: false, paintSeed: false }
};

const FullPageLoader = () => (
    <div className="loader">A preparar as melhores skins para si...</div>
);

const SkinDetailPage = () => {
    const { marketHashName } = useParams();

    const [allListings, setAllListings] = useState([]);
    const [inspectedData, setInspectedData] = useState({});
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState('priceNumber');
    const [currentPage, setCurrentPage] = useState(1);

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
        // << A ESTRATÉGIA IDEAL >>: Criar a nossa fila de "caixas rápidas".
        const limit = pLimit(CONCURRENT_REQUEST_LIMIT);

        const fetchAllSkinData = async () => {
            // Resetar estados para uma nova pesquisa
            setIsInitialLoad(true);
            setError(null);
            setAllListings([]);
            setInspectedData({});
            setCurrentPage(1);
            setLoadingProgress({ loaded: 0, total: 0 });

            try {
                // 1. Buscar a primeira página para obter os totais
                const firstPageData = await getSkinDetails(marketHashName, controller.signal);
                if (!firstPageData || !firstPageData.success) {
                    throw new Error("Não foi possível carregar os dados desta skin.");
                }

                const initialListings = firstPageData.listings || [];
                const { totalPages, totalListings } = firstPageData.pagination;
                
                setAllListings(initialListings);
                initialListings.forEach(listing => inspectListing(listing));
                setLoadingProgress({ loaded: initialListings.length, total: totalListings });

                // 2. Se houver mais páginas, buscá-las em paralelo controlado
                if (totalPages > 1) {
                    // Criar uma tarefa para cada página restante
                    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
                        .map(pageNumber => 
                            // Adicionar a tarefa à nossa fila de "caixas rápidas"
                            limit(async () => {
                                const pageData = await getSkinPage(marketHashName, pageNumber, controller.signal);
                                if (pageData?.success && pageData.listings) {
                                    setLoadingProgress(prev => ({ ...prev, loaded: prev.loaded + pageData.listings.length }));
                                    pageData.listings.forEach(listing => inspectListing(listing));
                                    return pageData.listings;
                                }
                                return []; // Retornar array vazio em caso de falha
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
    }, [marketHashName, inspectListing]);

    // Efeito para controlar o fim do carregamento inicial (sem alterações)
    useEffect(() => {
        if (!isInitialLoad) return;
        const inspectedCount = Object.keys(inspectedData).length;
        const totalFetched = allListings.length;
        const targetCount = Math.min(ITEMS_PER_PAGE, loadingProgress.total > 0 ? loadingProgress.total : totalFetched);

        if (!loadingProgress.total && totalFetched > 0 && inspectedCount >= totalFetched) {
            setIsInitialLoad(false);
        } else if (targetCount > 0 && inspectedCount >= targetCount) {
            setIsInitialLoad(false);
        }
    }, [inspectedData, allListings.length, loadingProgress.total, isInitialLoad]);
    
    // Lógica de filtragem, ordenação e paginação (sem alterações)
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
                    <div className="skin-cards-grid">
                        {paginatedListings.length > 0 ? (
                            paginatedListings.map(listing => (
                                <TiltSkinCard key={listing.listingid} listing={listing} inspectedData={inspectedData} />
                            ))
                        ) : (
                            !isLoadingInBackground && <div>Nenhum listing encontrado para os filtros selecionados.</div>
                        )}
                    </div>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

export default SkinDetailPage;