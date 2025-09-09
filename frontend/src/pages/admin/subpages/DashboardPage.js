// src/pages/admin/subpages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { 
  getActiveSubscriptionTypes, 
  getTotalSubscriptions, 
  getTotalActiveSubscriptions, 
  getSubscriptionCountsByType,
  getTotalRevenue
} from '../../../api/adminApi';
import './DashboardPage.css';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [types, setTypes] = useState([]);
  const [countsByType, setCountsByType] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, tActive, tTypes, counts, revenue] = await Promise.all([
          getTotalSubscriptions(),
          getTotalActiveSubscriptions(),
          getActiveSubscriptionTypes(),
          getSubscriptionCountsByType(),
          getTotalRevenue()
        ]);

        setTotal(t);
        setTotalActive(tActive);
        setTypes(tTypes);
        setCountsByType(counts);
        setTotalRevenue(revenue);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loader">A carregar dashboard...</div>;

  return (
    <div className="dashboard-page">
      <h1>Dashboard de Subscrições</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card total">
          <h2>Total de Subscrições</h2>
          <p>{total}</p>
        </div>
        <div className="dashboard-card active">
          <h2>Total Ativas</h2>
          <p>{totalActive}</p>
        </div>
        <div className="dashboard-card revenue">
          <h2>Total Receita</h2>
          <p>{totalRevenue.toFixed(2)}€</p>
        </div>
      </div>

      <div className="dashboard-table-container">
        <h2>Subscrições por Tipo</h2>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Preço Mensal</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {types.map(type => {
              const count = countsByType.find(c => c.type_id === type.id)?.total_subscriptions || 0;
              return (
                <tr key={type.id}>
                  <td>{type.name}</td>
                  <td>{type.price_monthly.toFixed(2)}€</td>
                  <td>{count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
