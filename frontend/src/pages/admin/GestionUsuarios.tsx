import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { MdSearch, MdRefresh, MdFileDownload, MdVisibility, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import { usuarioService } from '../../services/usuarioService';
import { comunicacionService } from '../../services/comunicacionService';
import type { Usuario, Comunicacion } from '../../types';
import './GestionComunicaciones.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [comunicacionesUsuario, setComunicacionesUsuario] = useState<Comunicacion[]>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState<{
    nombre: string;
    correo: string;
    telefono: string;
    semestre_area: string;
    tipo_usuario: 'Estudiante' | 'Docente' | 'Administrativo' | 'Servicios Generales' | '';
    sexo: 'Mujer' | 'Hombre' | 'Prefiero no responder' | '';
    confidencial: boolean;
    autorizo_contacto: boolean;
  }>({
    nombre: '',
    correo: '',
    telefono: '',
    semestre_area: '',
    tipo_usuario: '',
    sexo: '',
    confidencial: false,
    autorizo_contacto: false,
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [searchTerm, usuarios]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getAll();
      // Filtrar solo usuarios NO confidenciales (los confidenciales no deberían existir, pero por seguridad)
      const usuariosNoConfidenciales = data.filter((u: Usuario) => !u.confidencial);
      setUsuarios(usuariosNoConfidenciales);
      setFilteredUsuarios(usuariosNoConfidenciales);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    let filtered = usuarios.filter((u: Usuario) => {
      const matchesSearch = 
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.telefono?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    setFilteredUsuarios(filtered);
  };

  const handleVer = async (usuario: Usuario) => {
    try {
      // Cargar comunicaciones del usuario
      if (usuario.id_usuario) {
        try {
          const comunicaciones = await comunicacionService.getByUsuarioId(usuario.id_usuario);
          setComunicacionesUsuario(comunicaciones);
        } catch (error) {
          console.error('Error al cargar comunicaciones:', error);
          setComunicacionesUsuario([]);
        }
      }
      setSelectedUsuario(usuario);
      setModalMode('view');
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditForm({
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      telefono: usuario.telefono || '',
      semestre_area: usuario.semestre_area || '',
      tipo_usuario: usuario.tipo_usuario || '',
      sexo: usuario.sexo || '',
      confidencial: usuario.confidencial || false,
      autorizo_contacto: usuario.autorizo_contacto || false,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleGuardarEdicion = async () => {
    if (!selectedUsuario?.id_usuario) return;
    
    try {
      await usuarioService.update(selectedUsuario.id_usuario, editForm as Partial<Usuario>);
      setShowModal(false);
      loadUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar el usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await usuarioService.delete(id);
        loadUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar usuario');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="gestion-container">
        <div className="gestion-header">
          <h1>Gestión de Usuarios</h1>
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Nota: El sistema está configurado para garantizar el anonimato total. 
            No se crean registros de usuarios para proteger la identidad de quienes envían comunicaciones.
            Esta sección se mantiene solo para casos administrativos especiales.
          </p>
        </div>

        <div className="gestion-toolbar">
          <div className="search-box">
            <MdSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button className="btn-secondary" onClick={loadUsuarios}>
              <MdRefresh />
              Actualizar
            </button>
            <button className="btn-secondary">
              <MdFileDownload />
              Exportar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <div className="gestion-table-container">
            {filteredUsuarios.length === 0 ? (
              <div className="empty-state">
                <p>No hay usuarios registrados</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem', maxWidth: '600px', margin: '1rem auto' }}>
                  <strong>El sistema está configurado para garantizar el anonimato total.</strong><br />
                  No se crean registros de usuarios para proteger la identidad de quienes envían comunicaciones 
                  y evitar cualquier miedo a represalias. Todas las comunicaciones se procesan de forma anónima.
                </p>
              </div>
            ) : (
              <table className="gestion-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Tipo de Usuario</th>
                    <th>Semestre/Área</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id_usuario}>
                      <td>{usuario.id_usuario}</td>
                      <td><strong>{usuario.nombre}</strong></td>
                      <td>{usuario.correo}</td>
                      <td>{usuario.telefono || 'N/A'}</td>
                      <td>{usuario.tipo_usuario || 'N/A'}</td>
                      <td>{usuario.semestre_area || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" title="Ver detalles" onClick={() => handleVer(usuario)}>
                            <MdVisibility />
                          </button>
                          <button className="btn-icon" title="Editar" onClick={() => handleEditar(usuario)}>
                            <MdEdit />
                          </button>
                          <button 
                            className="btn-icon btn-danger" 
                            title="Eliminar"
                            onClick={() => handleDelete(usuario.id_usuario!)}
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="gestion-stats">
          <div className="stat-item">
            <span className="stat-label">Total de Usuarios:</span>
            <span className="stat-value">{usuarios.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mostrados:</span>
            <span className="stat-value">{filteredUsuarios.length}</span>
          </div>
        </div>

        {showModal && selectedUsuario && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalMode === 'view' && 'Detalles del Usuario'}
                  {modalMode === 'edit' && 'Editar Usuario'}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {modalMode === 'view' && (
                  <>
                    <div className="modal-section">
                      <div className="modal-info-row">
                        <span className="modal-label">ID:</span>
                        <span className="modal-value">{selectedUsuario.id_usuario}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Nombre:</span>
                        <span className="modal-value">{selectedUsuario.nombre}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Correo:</span>
                        <span className="modal-value">{selectedUsuario.correo}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Teléfono:</span>
                        <span className="modal-value">{selectedUsuario.telefono || 'N/A'}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Tipo de Usuario:</span>
                        <span className="modal-value">{selectedUsuario.tipo_usuario || 'N/A'}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Semestre/Área:</span>
                        <span className="modal-value">{selectedUsuario.semestre_area || 'N/A'}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Sexo:</span>
                        <span className="modal-value">{selectedUsuario.sexo || 'N/A'}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Confidencial:</span>
                        <span className="modal-value">{selectedUsuario.confidencial ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Autoriza Contacto:</span>
                        <span className="modal-value">{selectedUsuario.autorizo_contacto ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                    {comunicacionesUsuario.length > 0 && (
                      <div className="modal-section">
                        <h3>Comunicaciones del Usuario ({comunicacionesUsuario.length})</h3>
                        <div className="comunicaciones-list">
                          {comunicacionesUsuario.map((com) => (
                            <div key={com.id_comunicacion} className="comunicacion-item">
                              <div className="comunicacion-header">
                                <strong>{com.folio}</strong>
                                <span className="comunicacion-tipo">{com.tipo}</span>
                              </div>
                              <div className="comunicacion-fecha">
                                {com.fecha_recepcion 
                                  ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX')
                                  : 'N/A'}
                              </div>
                              <div className="comunicacion-descripcion">
                                {com.descripcion?.substring(0, 100)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {modalMode === 'edit' && (
                  <div className="modal-section">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Correo</label>
                      <input
                        type="email"
                        value={editForm.correo}
                        onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input
                        type="text"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Semestre/Área</label>
                      <input
                        type="text"
                        value={editForm.semestre_area}
                        onChange={(e) => setEditForm({ ...editForm, semestre_area: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tipo de Usuario</label>
                      <select
                        value={editForm.tipo_usuario}
                        onChange={(e) => setEditForm({ ...editForm, tipo_usuario: e.target.value as 'Estudiante' | 'Docente' | 'Administrativo' | 'Servicios Generales' | '' })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Estudiante">Estudiante</option>
                        <option value="Docente">Docente</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Servicios Generales">Servicios Generales</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sexo</label>
                      <select
                        value={editForm.sexo}
                        onChange={(e) => setEditForm({ ...editForm, sexo: e.target.value as 'Mujer' | 'Hombre' | 'Prefiero no responder' | '' })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Mujer">Mujer</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Prefiero no responder">Prefiero no responder</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={editForm.confidencial}
                          onChange={(e) => setEditForm({ ...editForm, confidencial: e.target.checked })}
                        />
                        Confidencial
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={editForm.autorizo_contacto}
                          onChange={(e) => setEditForm({ ...editForm, autorizo_contacto: e.target.checked })}
                        />
                        Autoriza Contacto
                      </label>
                    </div>
                    <div className="modal-actions">
                      <button className="btn-primary" onClick={handleGuardarEdicion}>
                        Guardar Cambios
                      </button>
                      <button className="btn-secondary" onClick={() => setShowModal(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GestionUsuarios;
