import React from 'react';
import { useNavigate } from 'react-router-dom';
import TrueFocus from '../components/TrueFocus';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/skins');
  };

  return (
    <div className="homepage">
      <div className="home-landing">
        {/* Substituímos o h1 pelo componente TrueFocus */}
        <div className="home-title-container">
          <TrueFocus 
            sentence="CS:MARKET GLASSES"
            manualMode={true} // Ativa o efeito apenas no hover
            blurAmount={4}
            borderColor="rgba(102, 192, 244, 0.9)" // Cor de destaque do site
            glowColor="rgba(102, 192, 244, 0.6)"
            animationDuration={0.3} // Animação rápida para o hover
          />
        </div>

        <p>Explora o mercado da Steam com detalhe e precisão.</p>
        <button className="start-button" onClick={handleStartClick}>
          Começar
        </button>
      </div>
    </div>
  );
};

export default HomePage;