import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SkinDetailPage from './pages/SkinDetailPage';
import SkinSelectorPage from './pages/SkinSelectorPage';
import AdminPage from './pages/admin/AdminPage'; 
import Header from './components/Header';
import './App.css';
import PrivateRoute from './utils/PrivateRoute';

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
            <Route path="/admin" element={<PrivateRoute> <AdminPage /> </PrivateRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
