// src/pages/admin/subpages/RolePage.js
import React, { useEffect, useState } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '../../../api/adminApi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './RolePage.css';

const MySwal = withReactContent(Swal);

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      console.log('debug: Roles Info - ', data);
      setRoles(data);
    } catch (err) {
      setError('Erro ao carregar roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Criar Nova Role',
      html:
        `<input id="swal-name" class="swal2-input" placeholder="Nome da Role" required>` +
        `<textarea id="swal-permissions" class="swal2-textarea" placeholder="Permissões (JSON) - Ex: {\"read\": true, \"write\": false}" rows="4"></textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Criar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const permissionsText = document.getElementById('swal-permissions').value;
        
        if (!name.trim()) {
          Swal.showValidationMessage('Nome é obrigatório');
          return false;
        }

        let permissions = {};
        if (permissionsText.trim()) {
          try {
            permissions = JSON.parse(permissionsText);
          } catch (e) {
            Swal.showValidationMessage('Formato JSON inválido para permissões');
            return false;
          }
        }

        return { name: name.trim(), permissions };
      }
    });

    if (formValues) {
      try {
        const newRole = await createRole(formValues);
        setRoles(prev => [...prev, newRole]);
        MySwal.fire('Criado!', 'A role foi criada com sucesso.', 'success');
      } catch (err) {
        console.error(err);
        MySwal.fire('Erro', 'Falha ao criar role.', 'error');
      }
    }
  };

  const handleEdit = async (role) => {
    const { value: formValues } = await MySwal.fire({
      title: 'Editar Role',
      html:
        `<input id="swal-name" class="swal2-input" placeholder="Nome da Role" value="${role.name}" required>` +
        `<textarea id="swal-permissions" class="swal2-textarea" placeholder="Permissões (JSON)" rows="4">${JSON.stringify(role.permissions || {}, null, 2)}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Atualizar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const permissionsText = document.getElementById('swal-permissions').value;
        
        if (!name.trim()) {
          Swal.showValidationMessage('Nome é obrigatório');
          return false;
        }

        let permissions = {};
        if (permissionsText.trim()) {
          try {
            permissions = JSON.parse(permissionsText);
          } catch (e) {
            Swal.showValidationMessage('Formato JSON inválido para permissões');
            return false;
          }
        }

        return { name: name.trim(), permissions };
      }
    });

    if (formValues) {
      try {
        const updatedRole = await updateRole(role.id, formValues);
        setRoles(prev => prev.map(r => r.id === role.id ? updatedRole : r));
        MySwal.fire('Atualizado!', 'A role foi atualizada com sucesso.', 'success');
      } catch (err) {
        console.error(err);
        MySwal.fire('Erro', 'Falha ao atualizar role.', 'error');
      }
    }
  };

  const handleDelete = async (id, roleName) => {
    const result = await MySwal.fire({
      title: 'Tem a certeza?',
      text: `Esta ação irá remover a role "${roleName}" permanentemente!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteRole(id);
        setRoles(prev => prev.filter(r => r.id !== id));
        MySwal.fire('Removido!', 'A role foi removida com sucesso.', 'success');
      } catch (err) {
        console.error(err);
        MySwal.fire('Erro', 'Falha ao remover role. Verifique se não há utilizadores associados.', 'error');
      }
    }
  };

  const handleViewPermissions = (role) => {
    const permissions = role.permissions || {};
    const permissionsText = Object.keys(permissions).length === 0 
      ? 'Nenhuma permissão definida' 
      : JSON.stringify(permissions, null, 2);

    MySwal.fire({
      title: `Permissões da Role: ${role.name}`,
      html: `<pre style="text-align: left; background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto; max-height: 400px;">${permissionsText}</pre>`,
      width: '600px',
      showConfirmButton: true,
      confirmButtonText: 'Fechar',
      customClass: {
        popup: 'permissions-popup'
      }
    });
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) return <div className="loader">A carregar roles...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="roles-page">
      <div className="roles-header">
        <h1>Roles</h1>
        <button onClick={handleCreate} className="create-btn">
          + Nova Role
        </button>
      </div>
      
      <table className="roles-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Permissões</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id}>
              <td>{role.id}</td>
              <td>
                <div className="role-name">
                  <span className="role-badge">{role.name}</span>
                </div>
              </td>
              <td>
                <div className="permissions-cell">
                  <button 
                    onClick={() => handleViewPermissions(role)} 
                    className="view-permissions-btn"
                    title="Clique para ver as permissões completas"
                  >
                    Ver Permissões
                  </button>
                </div>
              </td>
              <td>
                {new Date(role.created_at).toLocaleDateString('pt-PT')}
              </td>
              <td>
                <button onClick={() => handleEdit(role)} className="edit-btn">Editar</button>
                <button onClick={() => handleDelete(role.id, role.name)} className="delete-btn">Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {roles.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma role encontrada.</p>
          <button onClick={handleCreate} className="create-btn">
            Criar Primeira Role
          </button>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
