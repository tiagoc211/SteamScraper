import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SkinDetailPage from './pages/SkinDetailPage';
import SkinSelectorPage from './pages/SkinSelectorPage';
import Header from './components/Header';
import { CurrencyProvider } from './context/CurrencyContext'; // <-- IMPORTAR
import './App.css';

function App() {
  return (
    // << ENVOLVER TUDO COM O PROVIDER >>
    <CurrencyProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/skins" element={<SkinSelectorPage />} />
              <Route path="/skin/:marketHashName" element={<SkinDetailPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;