// src/components/admin/AdminSideBar.js
import React from 'react';
import './AdminSideBar.css';

const AdminSideBar = ({ selectedTab, onSelectTab }) => {
  const tabs = [
    { id: 'users', label: 'Utilizadores' },
    { id: 'roles', label: 'Roles' },
    { id: 'settings', label: 'Configurações' }, // podes adicionar mais depois
  ];

  return (
    <div className="admin-sidebar">
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
