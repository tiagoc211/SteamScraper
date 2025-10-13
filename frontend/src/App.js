import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import SkinDetailPage from './pages/skin/SkinDetailPage';
import SkinSelectorPage from './pages/skin/SkinSelectorPage';
import SubscriptionPage from './pages/subscriptions/SubscriptionPage';
import AdminPage from './pages/admin/AdminPage';
import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';
import UserSettingsPage from './pages/settings/UserSettingsPage';

import './App.css';

import PrivateRoute from './utils/PrivateRoute';
import AdminRoute from './utils/AdminRoute';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/skins" element={<SkinSelectorPage />} />
            <Route path="/skin/:marketHashName" element={<SkinDetailPage />} />
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
