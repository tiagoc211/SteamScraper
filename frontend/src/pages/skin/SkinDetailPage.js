// frontend/src/pages/skin/SkinDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinDetails, getSkinPage } from '../../api/api';
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
    
    const [filters, setFilters] = useState({
        priceNumber: ['', ''], wear: ['', ''], paintSeed: '', sortBy: 'price',
    });

    const fetchPageData = useCallback(async (pageNum) => {
        setLoading(true);
        // Não reseta o erro aqui para o utilizador ver o erro se acontecer
        try {
            const data = pageNum === 1
                ? await getSkinDetails(marketHashName)
                : await getSkinPage(marketHashName, pageNum);

            if (data && data.success) {
                setAllListings(prev => pageNum === 1 ? data.listings : [...prev, ...data.listings]);
                setPagination(data.pagination);
                setError(null); // Limpa o erro em caso de sucesso
            } else {
                throw new Error(data.message || "Failed to load listings.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [marketHashName]);

    useEffect(() => {
        fetchPageData(1);
    }, [fetchPageData]);

    const processedListings = useMemo(() => {
        let processed = [...allListings];
        // Lógica de filtragem e ordenação...
        processed.sort((a, b) => {
            switch (filters.sortBy) {
                case 'float': return (a.raw?.floatvalue || 1) - (b.raw?.floatvalue || 1);
                case 'pattern': return (a.raw?.paintseed || 0) - (b.raw?.paintseed || 0);
                case 'price': default: return (a.priceNumber || 0) - (b.priceNumber || 0);
            }
        });
        return processed;
    }, [allListings, filters.sortBy]);

    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="skin-detail-page">
            <FilterSidebar context="detail" filters={filters} setFilters={setFilters} />
            <div className="main-content-column">
                <h1>{decodeURIComponent(marketHashName)}</h1>
                <div className="skin-listings-section">
                    <div className="listings-header">
                        <h2>{`Showing ${processedListings.length} of ${pagination.totalListings || 0} listings`}</h2>
                        <div className="sort-bar">
                            <span>Sort by:</span>
                            <button className={`sort-button ${filters.sortBy === 'price' ? 'active' : ''}`} onClick={() => setFilters(f => ({...f, sortBy: 'price'}))}>Price</button>
                            <button className={`sort-button ${filters.sortBy === 'float' ? 'active' : ''}`} onClick={() => setFilters(f => ({...f, sortBy: 'float'}))}>Float</button>
                            <button className={`sort-button ${filters.sortBy === 'pattern' ? 'active' : ''}`} onClick={() => setFilters(f => ({...f, sortBy: 'pattern'}))}>Pattern</button>
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