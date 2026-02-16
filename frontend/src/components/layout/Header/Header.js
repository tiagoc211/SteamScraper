// src/components/layout/Header/Header.js
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TrueFocus from '../../ui/TrueFocus/TrueFocus';
// CORREÇÃO 1: Importar FiSearch em vez de FaSearch da biblioteca 'fi'
import { FiSearch, FiLogOut, FiSettings } from 'react-icons/fi';
import './Header.css';

// Componente para a barra inativa, que ativa o overlay
const InactiveSearchBar = ({ onClick }) => (
  <div className="search-bar-inactive" onClick={onClick}>
    {/* CORREÇÃO 2: Usar o componente FiSearch que foi importado corretamente */}
    <FiSearch className="search-icon-inactive" />
    <span>Procurar skins...</span>
  </div>
);

const Header = ({ setIsSearchActive }) => { // Recebe apenas a função para ativar
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(err => console.error(err));
  }, [BACKEND_URL]);

  const togglePopup = () => setShowPopup(!showPopup);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo-container">
          <TrueFocus 
            sentence="CS:MARKET GLASSES"
            manualMode={true}
            blurAmount={5}
            borderColor="rgba(102, 192, 244, 0.7)"
            glowColor="rgba(102, 192, 244, 0.5)"
            animationDuration={0.3}
          />
        </Link>

        {/* Navegação principal no centro */}
        <nav className="nav-center">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/skins" className="nav-link">DataBase</Link>
          <Link to="/analytics" className="nav-link">Analytics</Link>
          <Link to="/subscriptions" className="nav-link">Subscrições</Link>
        </nav>

        <div className="nav-right">
          {/* Barra de pesquisa inativa */}
          <InactiveSearchBar onClick={() => setIsSearchActive(true)} />

          {/* Informação do utilizador */}
          {user ? (
            <div className="user-info" onClick={togglePopup} ref={popupRef} style={{ cursor: 'pointer', position: 'relative' }}>
              <img
                src={user.photos[2].value}
                alt={user.displayName}
                width={32}
                height={32}
                style={{ borderRadius: '50%', marginRight: '8px' }}
              />
              <span>{user.displayName}</span>
              {showPopup && (
                <div className="user-popup">
                  <Link to="/settings" className="nav-link">
                    <FiSettings style={{ marginRight: '6px' }} />
                    Settings
                  </Link>
                  <a href={`${BACKEND_URL}/auth/logout`} className="nav-link">
                    <FiLogOut style={{ marginRight: '6px' }} />
                    Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <a href={`${BACKEND_URL}/auth/steam`} className="nav-link">Login com Steam</a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;