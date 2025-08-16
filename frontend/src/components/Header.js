import React from 'react';
import { Link } from 'react-router-dom';
import TrueFocus from './TrueFocus';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo-container">
          <TrueFocus 
            sentence="CS:MARKET GLASSES"
            manualMode={false}
            blurAmount={5}
            borderColor="rgba(102, 192, 244, 0.7)"
            glowColor="rgba(102, 192, 244, 0.5)"
            animationDuration={6}
            pauseBetweenAnimations={1.5}
          />
        </Link>
        <nav>
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Sobre</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;