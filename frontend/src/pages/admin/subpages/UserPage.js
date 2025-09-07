// src/pages/admin/subpages/UsersPage.js
import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, updateUser, getRoles } from '../../../api/adminApi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './UserPage.css';

const MySwal = withReactContent(Swal);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      console.log('debug: Users Info - ', data);
      setUsers(data);

      // Carregar roles para o dropdown do edit
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (err) {
      setError('Erro ao carregar utilizadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: 'Tem a certeza?',
      text: "Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        MySwal.fire('Removido!', 'O utilizador foi removido com sucesso.', 'success');
      } catch (err) {
        console.error(err);
        MySwal.fire('Erro', 'Falha ao remover utilizador.', 'error');
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
        return { display_name, email, roleId };
      }
    });

    if (formValues) {
      try {
        const updatedUser = await updateUser(user.id, formValues);
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
              <td>
                <button onClick={() => handleEdit(user)} className="edit-btn">Editar</button>
                <button onClick={() => handleDelete(user.id)} className="delete-btn">Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
