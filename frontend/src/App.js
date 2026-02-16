// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import SkinDetailPage from './pages/skin/SkinDetailPage';
import BrowseSkinsPage from './pages/browse/BrowseSkinsPage';
import SubscriptionPage from './pages/subscriptions/SubscriptionPage';
import MarketTrendsPage from './pages/trends/MarketTrendsPage';
import AdminPage from './pages/admin/AdminPage';
import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';
import UserSettingsPage from './pages/settings/UserSettingsPage';
import SearchBar from './components/ui/SearchBar/SearchBar';
import './App.css';
import PrivateRoute from './utils/PrivateRoute';
import AdminRoute from './utils/AdminRoute';
import LastSearchesBar from './components/ui/LastSearchesBar/LastSearchesBar';

function App() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  return (
    <Router>
      <div className="app-container">
        <Header setIsSearchActive={setIsSearchActive} />
         <LastSearchesBar />
        <SearchBar isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* CORREÇÃO: A rota /skins agora renderiza a BrowseSkinsPage */}
            <Route path="/skins" element={<BrowseSkinsPage />} /> 
            <Route path="/skin/:marketHashName" element={<SkinDetailPage />} />
            <Route path="/analytics" element={<MarketTrendsPage />} />
            <Route path="/settings" element={<PrivateRoute> <UserSettingsPage/> </PrivateRoute>} />
            <Route path="/subscriptions" element={<SubscriptionPage />} />
            <Route path="/admin" element={<PrivateRoute> <AdminRoute> <AdminPage /> </AdminRoute> </PrivateRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;