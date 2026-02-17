// src/components/admin/AdminSideBar.js
import React from 'react';
import './AdminSideBar.css';

const AdminSideBar = ({ selectedTab, onSelectTab }) => {
  const tabs = [
    { id: 'users', label: 'Utilizadores' },
    { id: 'roles', label: 'Roles' },
    { id: 'dashboard', label: 'Dashboard'},
    { id: 'logs', label: 'Logs'},
    { id: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="admin-sidebar glass-panel">
      <h2>Admin</h2>
      <ul className="sidebar-tabs">
        {tabs.map(tab => (
          <li
            key={tab.id}
            className={`sidebar-tab ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminSideBar;
