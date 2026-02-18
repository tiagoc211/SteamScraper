// frontend/src/pages/skin/SkinDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinDetails } from '../../api/api';
import BrowseSkinCard from '../../components/skin/BrowseSkinCard/BrowseSkinCard';
import FilterSidebar from '../../components/skin/FilterSidebar/FilterSidebar';
import PaginationControls from '../../components/ui/PaginationControls/PaginationControls';
import './SkinDetailPage.css';

const FullPageLoader = () => <div className="loader">Loading best deals for you...</div>;

const SkinDetailPage = () => {
    const { marketHashName } = useParams();

    const [allListings, setAllListings] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Inputs do sidebar (draft)
    const [filterInputs, setFilterInputs] = useState({
        priceNumber: ['', ''], wear: ['', ''], paintSeed: '', sortBy: 'price',
    });

    // Filtros aplicados (só mudam ao clicar Apply)
    const [activeFilters, setActiveFilters] = useState({
        priceNumber: ['', ''], wear: ['', ''], paintSeed: '', sortBy: 'price',
    });

    const handleApplyFilters = () => {
        setActiveFilters({ ...filterInputs });
    };

    // Carrega listings da Steam uma única vez (sem filtros)
    const fetchPageData = useCallback(async (pageNum) => {
        setLoading(true);
        try {
            const data = await getSkinDetails(marketHashName);
            if (data && data.success) {
                if (pageNum === 1) {
                    setAllListings(data.listings || []);
                } else {
                    setAllListings(prev => [...prev, ...(data.listings || [])]);
                }
                setPagination(data.pagination);
                setError(null);
            } else {
                throw new Error((data && data.message) || 'Failed to load listings.');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }, [marketHashName]);

    useEffect(() => {
        fetchPageData(1);
    }, [fetchPageData]);

    // Filtragem e ordenação 100% client-side
    const processedListings = useMemo(() => {
        let result = [...allListings];

        const minPrice = parseFloat(activeFilters.priceNumber[0]);
        const maxPrice = parseFloat(activeFilters.priceNumber[1]);
        const minWear  = parseFloat(activeFilters.wear[0]);
        const maxWear  = parseFloat(activeFilters.wear[1]);
        const seed     = activeFilters.paintSeed !== '' ? parseInt(activeFilters.paintSeed, 10) : null;

        result = result.filter(listing => {
            const price   = listing.priceNumber || 0;
            const float_v = listing.raw?.floatvalue ?? null;
            const pattern = listing.raw?.paintseed  ?? null;

            if (!isNaN(minPrice) && price < minPrice) return false;
            if (!isNaN(maxPrice) && price > maxPrice) return false;
            if (float_v !== null && !isNaN(minWear) && float_v < minWear) return false;
            if (float_v !== null && !isNaN(maxWear) && float_v > maxWear) return false;
            if (seed !== null && pattern !== seed) return false;

            return true;
        });

        result.sort((a, b) => {
            switch (activeFilters.sortBy) {
                case 'float':   return (a.raw?.floatvalue  ?? 1) - (b.raw?.floatvalue  ?? 1);
                case 'pattern': return (a.raw?.paintseed   ?? 0) - (b.raw?.paintseed   ?? 0);
                case 'price':
                default:        return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });

        return result;
    }, [allListings, activeFilters]);

    if (error) return <div className="error-message">{error}</div>;

    const filtersWithApply = {
        ...filterInputs,
        onApply: handleApplyFilters
    };

    return (
        <div className="skin-detail-page">
            <FilterSidebar context="detail" filters={filtersWithApply} setFilters={setFilterInputs} />
            <div className="main-content-column">
                <h1>{decodeURIComponent(marketHashName)}</h1>
                <div className="skin-listings-section">
                    <div className="listings-header">
                        <h2>{`Showing ${processedListings.length} of ${allListings.length} listings`}</h2>
                        <div className="sort-bar">
                            <span>Sort by:</span>
                            <button className={`sort-button ${filterInputs.sortBy === 'price' ? 'active' : ''}`} onClick={() => setFilterInputs(f => ({...f, sortBy: 'price'}))}>Price</button>
                            <button className={`sort-button ${filterInputs.sortBy === 'float' ? 'active' : ''}`} onClick={() => setFilterInputs(f => ({...f, sortBy: 'float'}))}>Float</button>
                            <button className={`sort-button ${filterInputs.sortBy === 'pattern' ? 'active' : ''}`} onClick={() => setFilterInputs(f => ({...f, sortBy: 'pattern'}))}>Pattern</button>
                        </div>
                    </div>
                    
                    {loading && processedListings.length === 0 ? <FullPageLoader /> : (
                         <div className="skin-cards-grid">
                            {processedListings.map(listing => {
                                // --- CORREÇÃO PRINCIPAL AQUI ---
                                
                                // 1. Constrói o URL da imagem de alta resolução
                                const iconIdentifier = listing.raw?.icon_url_large || listing.raw?.icon_url;
                                const highResImageUrl = iconIdentifier 
                                    ? `https://community.akamai.steamstatic.com/economy/image/${iconIdentifier}/540fx540f`
                                    : listing.image; // Fallback para a imagem pequena

                                // 2. Mapeia os dados completos para o objeto 'item'
                                const cardItem = {
                                    id: listing.listingid,
                                    name: listing.name,
                                    image: highResImageUrl,
                                    rarity: { name: listing.raw?.rarity_name, color: listing.raw?.rarity_color },
                                    price: listing.priceNumber * 100,
                                    float: listing.raw?.floatvalue,
                                    pattern: listing.raw?.paintseed,
                                    stickers: listing.stickers?.map((stickerUrl, index) => ({
                                                name: listing.raw?.stickers?.[index]?.name || 'Sticker',
                                                img: stickerUrl,
                                            })) || [],
                                    keychains: listing.keychains?.map(charm => ({
                                        name: charm.name,
                                        image_url: charm.image_url,
                                    })) || [],
                                    inspectLink: listing.inspectLink,
                                };

                                return (
            <BrowseSkinCard 
                key={listing.listingid} 
                item={cardItem}
                variant="detail" 
            />
        );
    })}
</div>
                    )}
                   
                    <PaginationControls 
                        currentPage={pagination.currentPage} 
                        totalPages={pagination.totalPages} 
                        onPageChange={(newPage) => fetchPageData(newPage)} 
                    />
                </div>
            </div>
        </div>
    );
};

export default SkinDetailPage;