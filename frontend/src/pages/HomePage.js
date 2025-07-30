import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/skins');
  };

  return (
    <div className="homepage">
      <div className="home-landing">
        <h1>Bem-vindo ao Steam Market Scraper</h1>
        <p>Explora o mercado da Steam com detalhe e precisão.</p>
        <button className="start-button" onClick={handleStartClick}>
          Começar
        </button>
      </div>
    </div>
  );
};

export default HomePage;
