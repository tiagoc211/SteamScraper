// frontend/src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TrueFocus from '../components/ui/TrueFocus/TrueFocus'; // <-- Caminho corrigido
import StickerPeel from '../components/ui/StickerPeel/StickerPeel'; // <-- Caminho corrigido
import FeaturesSection from '../components/home/FeaturesSection/FeaturesSection'; // <-- Caminho corrigido
import StarBorder from '../components/ui/StarBorder/StarBorder'; // <-- Caminho corrigido
import './HomePage.css';

const stickerIBP = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20iBUYPOWER%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerTitan = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Titan%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerDignitas = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Team%20Dignitas%20(Holo)%20-%20Katowice%202014_240x152.webp';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/skins');
  };

  return (
    <>
      <div className="homepage">
        <div className="sticker-background-container">
          <StickerPeel
            imageSrc={stickerIBP}
            width={220}
            rotate={-25}
            initialPosition={{ x: 100, y: 150 }}
            peelDirection={45}
          />
          <StickerPeel
            imageSrc={stickerTitan}
            width={260}
            rotate={15}
            initialPosition={{ x: window.innerWidth - 300, y: 120 }}
            peelDirection={-30}
          />
          <StickerPeel
            imageSrc={stickerDignitas}
            width={240}
            rotate={-5}
            initialPosition={{ x: window.innerWidth - 450, y: window.innerHeight - 300 }}
            peelDirection={180}
          />
        </div>

        <div className="home-landing">
          <div className="home-title-container">
            <TrueFocus 
              sentence="CS:MARKET GLASSES"
              manualMode={true}
              blurAmount={4}
              borderColor="rgba(102, 192, 244, 0.9)"
              glowColor="rgba(102, 192, 244, 0.6)"
              animationDuration={0.3}
            />
          </div>
          <p>Explora o mercado da Steam com detalhe e precisão.</p>
          
          {/* Botão antigo substituído pelo StarBorder */}
          <StarBorder
            as="button"
            className="start-button-star"
            color="var(--color-accent)"
            speed="4s"
            onClick={handleStartClick}
          >
            Começar
          </StarBorder>
        </div>

        <div className="scroll-down-indicator">
          <span className="scroll-down-text">Scroll</span>
          <span></span>
        </div>
      </div>
      
      <FeaturesSection />
    </>
  );
};

export default HomePage;