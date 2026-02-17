import React, { useState } from 'react';
import AdminSideBar from '../../components/admin/AdminSideBar';
import UsersPage from './subpages/UserPage';
import RolesPage from './subpages/RolePage';
import LogsPage from './subpages/LogsPage';
import DashboardPage from './subpages/DashboardPage';

import './AdminPage.css';

const AdminPage = () => {
  const [selectedTab, setSelectedTab] = useState('users');

  return (
    <div className="admin-page">
      <AdminSideBar selectedTab={selectedTab} onSelectTab={setSelectedTab} />
      <div className="admin-content glass-panel">
        {selectedTab === 'users' && <UsersPage />}
        {selectedTab === 'roles' && <RolesPage />}
        {selectedTab === 'logs' && <LogsPage />}
        {selectedTab === 'dashboard' && <DashboardPage />}
        {selectedTab === 'settings' && <div>Configurações aqui</div>}
      </div>
    </div>
  );
};

export default AdminPage;
