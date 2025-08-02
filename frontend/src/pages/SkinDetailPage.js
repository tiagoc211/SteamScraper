import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinDetails } from '../api/Skins';
import SkinCardListening from '../components/SkinCardListening';
import './SkinDetailPage.css';

const SkinDetailPage = () => {
  const { marketHashName } = useParams();
  const [inspectedData, setInspectedData] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSkinData = async () => {
      setLoading(true);
      setError(null);

      const data = await getSkinDetails(marketHashName);

      if (data && data.success) {
        setListings(data.listings || []);
        //console.log("LISTINGS RECEBIDOS:", data.listings);

        for (const listing of data.listings) {
          const inspectUrl = listing.inspectLink;
          if (inspectUrl) {
            try {
              const res = await fetch(`http://localhost/?url=${encodeURIComponent(inspectUrl)}`);
              const json = await res.json();
              setInspectedData(prev => ({
                ...prev,
                [listing.listingid]: json.iteminfo
              }));
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

  if (loading) {
    return <div className="loader">A carregar detalhes da skin...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="skin-detail-page">
      <div className="skin-info-column">
        <h1>{decodeURIComponent(marketHashName)}</h1>
        {listings[0] && (
          <div className="skin-image-large-container">
            <img 
              src={listings[0].image}
              alt={decodeURIComponent(marketHashName)}
            />
          </div>
        )}
      </div>

      <div className="skin-listings-column">
        <h2>Listings no Mercado</h2>
        <div className="skin-cards-grid">
          {listings.length > 0 ? (
            listings.map(listing => (
              <SkinCardListening
                key={listing.listingid}
                listing={listing}
                inspectedData={inspectedData}
              />
            ))
          ) : (
            <div>Nenhum listing encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkinDetailPage;