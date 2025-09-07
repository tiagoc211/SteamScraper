import React, { useState } from 'react';
import AdminSideBar from '../../components/admin/AdminSideBar';
import UsersPage from './subpages/UserPage';
import RolesPage from './subpages/RolePage';

import './AdminPage.css';

const AdminPage = () => {
  const [selectedTab, setSelectedTab] = useState('users');

  return (
    <div className="admin-page">
      <AdminSideBar selectedTab={selectedTab} onSelectTab={setSelectedTab} />
      <div className="admin-content">
        {selectedTab === 'users' && <UsersPage />}
        {selectedTab === 'roles' && <RolesPage />}
        {selectedTab === 'settings' && <div>Configurações aqui</div>}
      </div>
    </div>
  );
};

export default AdminPage;
