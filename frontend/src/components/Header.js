import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import TrueFocus from './TrueFocus';
import './Header.css';
import { FiLogOut } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext'; // Importar o hook de contexto
import { steamCurrencies } from '../data/currencies'; // Importar a lista de moedas

const Header = () => {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  // Obter o estado e a função para alterar a moeda do nosso contexto
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    // Lógica para buscar o utilizador autenticado (exemplo)
    fetch('http://localhost:3001/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(err => console.error("Erro ao buscar dados do utilizador:", err));
  }, []);

  const togglePopup = () => setShowPopup(!showPopup);

  // Lógica para fechar o popup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função para lidar com a mudança de moeda
  const handleCurrencyChange = (event) => {
    const newCurrencyId = parseInt(event.target.value, 10);
    const newCurrency = steamCurrencies.find(c => c.id === newCurrencyId);
    if (newCurrency) {
      setCurrency(newCurrency); // Atualiza o estado global e o localStorage
      // Recarrega a página para que os dados sejam buscados com a nova moeda
      window.location.reload(); 
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo-container">
          <TrueFocus 
            sentence="CS:MARKET GLASSES"
            manualMode={true}
            blurAmount={4}
            borderColor="rgba(102, 192, 244, 0.9)"
            glowColor="rgba(102, 192, 244, 0.6)"
            animationDuration={0.3}
          />
        </Link>

        <nav className="nav-center">
          <Link to="/" className="nav-link">Home</Link>
          <a href="#" className="nav-link">Sobre</a>
        </nav>

        <div className="nav-right">
          {/* O Dropdown Seletor de Moeda */}
          <div className="currency-selector">
            <select value={currency.id} onChange={handleCurrencyChange} title="Select Currency">
              {steamCurrencies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Lógica de Autenticação do Utilizador */}
          {user ? (
            <div className="user-info" onClick={togglePopup} ref={popupRef} style={{ cursor: 'pointer', position: 'relative' }}>
              <img
                src={user.photos[2].value}
                alt={user.displayName}
                width={32}
                height={32}
                style={{ borderRadius: '50%' }}
              />
              {showPopup && (
                <div className="user-popup">
                  <a href="http://localhost:3001/auth/logout" className="nav-link">
                    <FiLogOut style={{ marginRight: '8px' }} />
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