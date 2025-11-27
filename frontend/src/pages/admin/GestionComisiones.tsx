import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { comisionService } from '../../services/comisionService';
import type { Comision } from '../../types';
import ConfirmModal from '../../components/common/ConfirmModal';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { MdAdd, MdEdit, MdDelete, MdPeople, MdCalendarToday } from 'react-icons/md';
import './GestionComisiones.css';

// Estado inicial para un formulario
const initialState: Omit<Comision, 'id_miembro'> = {
  nombre: '',
  rol: 'Representante Docente',
  periodo_inicio: '',
  periodo_fin: '',
};

const GestionComisiones: React.FC = () => {
  usePageTitle('Gestión de Comisiones');

  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Estados para el formulario
  const [currentComision, setCurrentComision] = useState<Omit<Comision, 'id_miembro'> | Comision>(initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [comisionToDelete, setComisionToDelete] = useState<Comision | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadComisiones();
  }, []);

  const loadComisiones = async () => {
    try {
      setLoading(true);
      const data = await comisionService.getAll();
      setComisiones(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar las comisiones. Intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // --- Manejadores de Modales ---

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentComision(initialState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comision: Comision) => {
    setIsEditing(true);
    setCurrentComision(comision);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (comision: Comision) => {
    setComisionToDelete(comision);
    setIsConfirmOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setComisionToDelete(null);
  };
  
  // --- Manejadores de CRUD ---

  const handleDelete = async () => {
    if (!comisionToDelete || !comisionToDelete.id_miembro) return;
    try {
      await comisionService.delete(comisionToDelete.id_miembro);
      setComisiones(comisiones.filter(c => c.id_miembro !== comisionToDelete.id_miembro));
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      setError('Error al eliminar la comisión.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...currentComision };
      
      if (isEditing && 'id_miembro' in currentComision && currentComision.id_miembro) {
        // Lógica de Actualización
        const updatedComision = await comisionService.update(currentComision.id_miembro, dataToSubmit);
        setComisiones(comisiones.map(c => (c.id_miembro === updatedComision.id_miembro ? updatedComision : c)));
      } else if (!isEditing) {
        // Lógica de Creación
        const createData = dataToSubmit as Omit<Comision, 'id_miembro'>;
        const newComision = await comisionService.create(createData);
        setComisiones([...comisiones, newComision]);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar la comisión.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentComision(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="gestion-comisiones-container admin-page-content">
      <header className="admin-page-header">
        <div className="header-title">
          <MdPeople className="header-icon" />
          <h1>Gestión de Comisiones</h1>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <MdAdd />
          <span>Nuevo Miembro</span>
        </button>
      </header>

      {loading && (
        <div className="loading-container">
          <SkeletonLoader width="100%" height="3rem" />
          <SkeletonLoader width="100%" height="3rem" />
          <SkeletonLoader width="100%" height="3rem" />
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="comisiones-content">
          {comisiones.length === 0 ? (
            <div className="empty-state">
              <MdPeople className="empty-icon" />
              <h3>No hay miembros de comisión registrados</h3>
              <p>Comienza agregando un nuevo miembro de la comisión.</p>
              <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                <MdAdd />
                <span>Agregar Primer Miembro</span>
              </button>
            </div>
          ) : (
            <div className="comisiones-grid">
              {comisiones.map(comision => (
                <div key={comision.id_miembro} className="comision-card">
                  <div className="comision-card-header">
                    <div className="comision-info">
                      <h3 className="comision-nombre">{comision.nombre}</h3>
                      <span className="comision-rol">{comision.rol}</span>
                    </div>
                    <div className="comision-actions">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleOpenEditModal(comision)}
                        title="Editar"
                      >
                        <MdEdit />
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleOpenDeleteModal(comision)}
                        title="Eliminar"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                  <div className="comision-card-body">
                    {(comision.periodo_inicio || comision.periodo_fin) && (
                      <div className="comision-periodo">
                        <MdCalendarToday className="periodo-icon" />
                        <div className="periodo-dates">
                          {comision.periodo_inicio && (
                            <div className="periodo-item">
                              <span className="periodo-label">Inicio:</span>
                              <span className="periodo-value">{formatDate(comision.periodo_inicio)}</span>
                            </div>
                          )}
                          {comision.periodo_fin && (
                            <div className="periodo-item">
                              <span className="periodo-label">Fin:</span>
                              <span className="periodo-value">{formatDate(comision.periodo_fin)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={handleCloseModal} 
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro de que desea eliminar a "${comisionToDelete?.nombre}" de la comisión?`}
        type="danger"
      />

      {/* Modal de Creación/Edición */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Editar' : 'Nuevo'} Miembro de Comisión</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="comision-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={currentComision.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Dr. Juan Pérez López"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol en la Comisión *</label>
                <select 
                  id="rol" 
                  name="rol" 
                  value={currentComision.rol} 
                  onChange={handleChange} 
                  required
                >
                  <option value="Presidente">Presidente</option>
                  <option value="Secretario Técnico">Secretario Técnico</option>
                  <option value="Representante Docente">Representante Docente</option>
                  <option value="Representante Estudiantil">Representante Estudiantil</option>
                  <option value="Representante Administrativo">Representante Administrativo</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="periodo_inicio">Periodo de Inicio</label>
                  <input
                    type="date"
                    id="periodo_inicio"
                    name="periodo_inicio"
                    value={currentComision.periodo_inicio || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="periodo_fin">Periodo de Fin</label>
                  <input
                    type="date"
                    id="periodo_fin"
                    name="periodo_fin"
                    value={currentComision.periodo_fin || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionComisiones;

