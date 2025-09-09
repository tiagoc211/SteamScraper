import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TrueFocus from '../../ui/TrueFocus/TrueFocus';
import './Header.css';
import { FiLogOut, FiSettings } from 'react-icons/fi';


const Header = () => {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(err => console.error(err));
  }, []);

  const togglePopup = () => setShowPopup(!showPopup);

  // Fecha o popup ao clicar fora
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

        <nav className="nav-center">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/skins" className="nav-link">Skins</Link>
          <Link to="/subscriptions" className="nav-link">Subscrições</Link>
        </nav>

        <div className="nav-right">
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
                  <a href="http://localhost:3001/auth/logout" className="nav-link">
                    <FiLogOut style={{ marginRight: '6px' }} />
                    Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <a href="http://localhost:3001/auth/steam" className="nav-link">Login com Steam</a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
