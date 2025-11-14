import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { adminUserService } from '../../services/adminUserService';
// --- 1. Corregido: 'AdminRol' eliminado ---
import type { User } from '../../types';
import ConfirmModal from '../../components/common/ConfirmModal';
// --- 2. Corregido: Importación con llaves {} ---
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import './GestionAdmins.css'; 

// Estado inicial para un formulario (lo usaremos para crear/editar)
const initialState: Omit<User, 'id'> = {
  username: '',
  nombre: '',
  rol: 'moderador', // Rol por defecto al crear
};

const GestionAdmins: React.FC = () => {
  usePageTitle('Gestión de Administradores');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Estados para el formulario
  const [currentUser, setCurrentUser] = useState<Omit<User, 'id'> | User>(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAdminUsers();
      setUsers(data);
      setError(null);
    } catch (err) { // --- 3. Corregido: 'err' se usa ---
      console.error(err);
      setError('Error al cargar los usuarios. Intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // --- Manejadores de Modales ---

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentUser(initialState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setIsEditing(true);
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setUserToDelete(null);
  };
  
  // --- Manejadores de CRUD ---

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminUserService.deleteAdminUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      handleCloseModal();
    } catch (err) { // --- 3. Corregido: 'err' se usa ---
      console.error(err);
      setError('Error al eliminar el usuario.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // --- 4. Corregido: Tipo 'any' eliminado ---
      const dataToSubmit: Partial<User & { password?: string }> = { ...currentUser };
      
      // Si es edición y no se cambió el password, no lo enviamos
      if (isEditing && (dataToSubmit.password === '' || !dataToSubmit.password)) {
        delete dataToSubmit.password;
      }
      
      if (isEditing && 'id' in currentUser) { // Asegurarnos que 'id' exista
        // Lógica de Actualización
        const updatedUser = await adminUserService.updateAdminUser(currentUser.id, dataToSubmit);
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      } else if (!isEditing) {
        // Lógica de Creación
        // Aseguramos que 'create' reciba todos los campos requeridos (sin id)
        const createData = dataToSubmit as Omit<User, 'id'> & { password?: string };
        const newUser = await adminUserService.createAdminUser(createData);
        setUsers([...users, newUser]);
      }
      handleCloseModal();
    } catch (err) { // --- 3. Corregido: 'err' se usa ---
      console.error(err);
      setError('Error al guardar el usuario.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="gestion-admins-container admin-page-content">
      <header className="admin-page-header">
        <h1>Gestión de Usuarios Administrativos</h1>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <i className="fas fa-plus"></i> Crear Nuevo Usuario
        </button>
      </header>

      {loading && <SkeletonLoader />}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.nombre}</td>
                  <td>{user.rol}</td>
                  <td>
                    <button className="btn btn-sm btn-warning" onClick={() => handleOpenEditModal(user)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleOpenDeleteModal(user)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación (reutilizado) */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        // --- 5. Corregido: 'onClose' renombrado a 'onCancel' ---
        onCancel={handleCloseModal} 
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar al usuario "${userToDelete?.username}"?`}
      />

      {/* Modal de Creación/Edición */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Editar' : 'Crear'} Usuario</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={currentUser.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={currentUser.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="rol" value={currentUser.rol} onChange={handleChange} required>
                  <option value="admin">Administrador</option>
                  <option value="monitor">Monitor</option>
                  <option value="moderador">Moderador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder={isEditing ? 'Dejar en blanco para no cambiar' : ''}
                  onChange={handleChange}
                  required={!isEditing}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionAdmins;