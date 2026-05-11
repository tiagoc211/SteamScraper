// src/pages/subscriptions/SubscriptionPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// A importação de 'useNavigate' foi removida, pois não é necessária.
import { getSubscriptionPlans } from '../../api/api'; // Corrigido o caminho para a API
import ChromaGrid from '../../components/subscriptions/ChromaGrid/ChromaGrid'; // Corrigido o caminho para o componente
import './SubscriptionPage.css';

// Paleta de estilos para os Tiers (Bronze, Prata, Ouro, etc.)
const tierStyles = [
  { tierClass: 'tier-bronze', borderColor: "#CD7F32", gradient: "linear-gradient(145deg, #4d3013, #111)" },
  { tierClass: 'tier-silver', borderColor: "#C0C0C0", gradient: "linear-gradient(145deg, #4a4a4a, #111)" },
  { tierClass: 'tier-gold', borderColor: "#FFD700", gradient: "linear-gradient(145deg, #615202, #111)" },
  { tierClass: 'tier-platinum', borderColor: "#E5E4E2", gradient: "linear-gradient(145deg, #5c6a71, #111)" },
  { tierClass: 'tier-diamond', borderColor: "#b9f2ff", gradient: "linear-gradient(145deg, #3c6c8c, #111)" },
  { tierClass: 'tier-master', borderColor: "#9f7aea", gradient: "linear-gradient(145deg, #4c1d95, #111)" },
];


const SubscriptionPage = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCardHovered, setIsCardHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.body.style.setProperty('--x', `${e.clientX}px`);
      document.body.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.removeProperty('--x');
      document.body.style.removeProperty('--y');
    };
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const data = await getSubscriptionPlans();
      if (data) {
        setPlans(data);
      } else {
        setError(t('common.error'));
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const formattedItems = useMemo(() => {
    return plans.map((plan, index) => {
      const style = tierStyles[index % tierStyles.length];
      return {
        title: plan.name,
        subtitle: plan.description,
        handle: `€${parseFloat(plan.price_monthly).toFixed(2)} /mês`,
        tierClass: style.tierClass,
        features: plan.features || [],
        borderColor: style.borderColor,
        gradient: style.gradient,
        onClick: () => alert(`Iniciando subscrição para o plano: ${plan.name}`),
        onMouseEnter: () => setIsCardHovered(true),
        onMouseLeave: () => setIsCardHovered(false),
      };
    });
  }, [plans]);

  if (loading) return <div className="page-loader">{t('common.loading')}</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className={`subscription-page-wrapper ${isCardHovered ? 'chroma-active' : ''}`}>
      <div className="subscription-page">
        <div className="page-header">
          <h1>{t('subscriptions.title')}</h1>
          <p>{t('subscriptions.plans')}</p>
        </div>
        <div className="plans-container">
          {plans.length > 0 ? (
            <ChromaGrid items={formattedItems} columns={plans.length} />
          ) : (
            <p>{t('subscriptions.title')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;