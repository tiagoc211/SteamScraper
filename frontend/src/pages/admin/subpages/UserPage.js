// src/pages/admin/subpages/UsersPage.js
import React, { useEffect, useState } from 'react';
import { getUsers, deactivateUser, activateUser, updateUser, getRoles } from '../../../api/adminApi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './UserPage.css';
import { apiRequestWrapper } from '../../../utils/apiWrapper';

const MySwal = withReactContent(Swal);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiRequestWrapper(() => getUsers());
            if (!data) return; 
            setUsers(data);

            const rolesData = await apiRequestWrapper(() => getRoles());
            if (!rolesData) return;
            setRoles(rolesData);
        } catch (err) {
            setError('Erro ao carregar utilizadores');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user) => {
        const isAtivo = user.status === 'ATIVO';
        const actionText = isAtivo ? 'inativar' : 'ativar';

        const result = await MySwal.fire({
            title: 'Tem a certeza?',
            text: `Esta ação irá ${actionText} o utilizador!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isAtivo ? '#d33' : '#3085d6',
            cancelButtonColor: isAtivo ? '#3085d6' : '#d33',
            confirmButtonText: `Sim, ${actionText}!`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
            const updatedUser = await apiRequestWrapper(() => isAtivo ? deactivateUser(user.id) : activateUser(user.id));
            if (!updatedUser) return; 
            
            setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

            MySwal.fire('Atualizado!', 'O utilizador foi inativado com sucesso.', 'success');
            } catch (err) {
            console.error(err);
            MySwal.fire('Erro', 'Falha ao inativar utilizador.', 'error');
            }
        }
        };


    const handleEdit = async (user) => {
        const { value: formValues } = await MySwal.fire({
            title: 'Editar utilizador',
            html:
            `<input id="swal-display_name" class="swal2-input" placeholder="Nome" value="${user.display_name}">` +
            `<input id="swal-email" class="swal2-input" placeholder="Email" value="${user.email || ''}">` +
            `<select id="swal-role" class="swal2-select">
                ${roles.map(role => `<option value="${role.id}" ${user.role_id === role.id ? 'selected' : ''}>${role.name}</option>`).join('')}
            </select>`,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
            const display_name = document.getElementById('swal-display_name').value;
            const email = document.getElementById('swal-email').value;
            const roleId = parseInt(document.getElementById('swal-role').value, 10);
            console.log('debug: ', roleId);
            return { display_name, email, roleId };
            }
        });

        if (formValues) {
            try {
            const updatedUser = await apiRequestWrapper(() => updateUser(user.id, formValues));
            if (!updatedUser) return; // redirecionamento feito pelo wrapper
            setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
            MySwal.fire('Atualizado!', 'O utilizador foi atualizado com sucesso.', 'success');
            } catch (err) {
            console.error(err);
            MySwal.fire('Erro', 'Falha ao atualizar utilizador.', 'error');
            }
        }
    };


  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="loader">A carregar utilizadores...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="users-page">
      <h1>Utilizadores</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Subscription</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.display_name}</td>
              <td>{user.email || '-'}</td>
              <td>{user.role_name || '-'}</td>
              <td>
                <div className="status-indicator">
                  {user.status === 'ATIVO' && <div className="status-dot active"></div>}
                  {user.status !== 'ATIVO' && <div className="status-dot inactive"></div>}
                  <span className="status-text">{user.status || 'ATIVO'}</span>
                </div>
              </td>
              <td>{user.subscription_id || '-'}</td>
              <td>
                <button onClick={() => handleEdit(user)} className="edit-btn">Editar</button>
                <button onClick={() => handleDelete(user)} className="delete-btn">ATIVAR/DESATIVAR</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
