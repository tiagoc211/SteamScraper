// frontend/src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TrueFocus from '../../components/ui/TrueFocus/TrueFocus';
import StickerPeel from '../../components/ui/StickerPeel/StickerPeel';
import MarketTrendsPage from '../trends/MarketTrendsPage';
import StarBorder from '../../components/ui/StarBorder/StarBorder';
import AdBanner from '../../components/ui/AdBanner/AdBanner';
import './HomePage.css';

const stickerIBP       = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20iBUYPOWER%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerTitan     = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Titan%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerDignitas  = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Team%20Dignitas%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerVoxEminor = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Vox%20Eminor%20(Holo)%20-%20Katowice%202014_240x152.webp';
const stickerReason    = 'https://cdn.tradeit.gg/csgo%2FSticker%20-%20Reason%20Gaming%20(Holo)%20-%20Katowice%202014_240x152.webp';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/skins');
  };

  return (
    <>
      <div className="homepage">

        {/* === PUBLICIDADE ESQUERDA === */}
        <aside className="side-ad side-ad--left">
          <AdBanner variant="skyscraper" adSlot="9027032370" />
        </aside>

        {/* === PUBLICIDADE DIREITA === */}
        <aside className="side-ad side-ad--right">
          <AdBanner variant="skyscraper" adSlot="2550078344" />
        </aside>

        {/* Stickers — ficam dentro do espaço central entre os ads */}
        <div className="sticker-background-container">
          {/* Esquerda superior */}
          <StickerPeel
            imageSrc={stickerIBP}
            width={220}
            rotate={-25}
            initialPosition={{ x: 60, y: 80 }}
            peelDirection={45}
          />
          {/* Esquerda inferior */}
          <StickerPeel
            imageSrc={stickerVoxEminor}
            width={210}
            rotate={12}
            initialPosition={{ x: 40, y: Math.max(260, window.innerHeight - 360) }}
            peelDirection={-45}
          />
          {/* Direita superior */}
          <StickerPeel
            imageSrc={stickerTitan}
            width={260}
            rotate={15}
            initialPosition={{ x: Math.max(200, window.innerWidth - 660), y: 90 }}
            peelDirection={-30}
          />
          {/* Direita inferior */}
          <StickerPeel
            imageSrc={stickerDignitas}
            width={240}
            rotate={-8}
            initialPosition={{ x: Math.max(180, window.innerWidth - 730), y: Math.max(220, window.innerHeight - 360) }}
            peelDirection={180}
          />
          {/* Direita meio */}
          <StickerPeel
            imageSrc={stickerReason}
            width={220}
            rotate={-15}
            initialPosition={{ x: Math.max(160, window.innerWidth - 690), y: Math.round(window.innerHeight / 2) - 80 }}
            peelDirection={135}
          />
        </div>

        <div className="home-landing">
          <div className="home-title-container">
            <TrueFocus 
              sentence="CS:MARKET GLASSES"
              manualMode={true}
              blurAmount={4}
              borderColor="rgba(255, 255, 255, 0.8)"
              glowColor="rgba(255, 255, 255, 0.6)"
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
      
      <MarketTrendsPage showHeader={false} fixedTimeframe={7} />
    </>
  );
};

export default HomePage;