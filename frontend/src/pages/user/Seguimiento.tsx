import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import { comunicacionService } from '../../services/comunicacionService';
import { categoriaService } from '../../services/categoriaService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import { usuarioService } from '../../services/usuarioService';
import UserLayout from '../../components/user/UserLayout';
import { MdVisibility, MdClose } from 'react-icons/md';
import type { Comunicacion, Categoria, Estado, Seguimiento } from '../../types';
import './Seguimiento.css';

interface ComunicacionConEstado extends Comunicacion {
  estado?: Estado;
  seguimiento?: Seguimiento;
}

const SeguimientoPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, session, loading: authLoading } = useUsuarioAuth();
  const [comunicaciones, setComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedComunicacion, setSelectedComunicacion] = useState<ComunicacionConEstado | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadComunicaciones = useCallback(async () => {
    if (!session?.correo) {
      console.warn('⚠️ No hay correo en la sesión');
      setError('No se pudo identificar tu correo. Por favor, inicia sesión nuevamente.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Estrategia múltiple para encontrar todas las comunicaciones del usuario
      // 1. Buscar usuario por correo para obtener id_usuario
      let comunicacionesUsuario: Comunicacion[] = [];
      let usuario = null;
      
      try {
        usuario = await usuarioService.getByCorreo(session.correo);
      } catch (err) {
        console.warn('⚠️ No se pudo obtener usuario por correo:', err);
      }
      
      // 2. Estrategia A: Buscar comunicaciones por id_usuario (si existe)
      if (usuario && usuario.id_usuario) {
        try {
          const comunicacionesPorId = await comunicacionService.getByUsuarioId(usuario.id_usuario);
          comunicacionesUsuario = [...comunicacionesUsuario, ...comunicacionesPorId];
          console.log(`✅ Encontradas ${comunicacionesPorId.length} comunicaciones por id_usuario`);
        } catch (err) {
          console.warn('⚠️ Error al buscar comunicaciones por id_usuario:', err);
        }
      }
      
      // 3. Estrategia B: Buscar comunicaciones directamente por correo (hace JOIN con usuarios)
      // Esto encuentra comunicaciones incluso si fueron creadas antes de que el usuario iniciara sesión
      try {
        const comunicacionesPorCorreo = await comunicacionService.getByCorreo(session.correo);
        // Combinar y eliminar duplicados por id_comunicacion
        const comunicacionesMap = new Map<number, Comunicacion>();
        
        // Agregar las que ya teníamos
        comunicacionesUsuario.forEach(com => {
          if (com.id_comunicacion) {
            comunicacionesMap.set(com.id_comunicacion, com);
          }
        });
        
        // Agregar las encontradas por correo
        comunicacionesPorCorreo.forEach((com: Comunicacion) => {
          if (com.id_comunicacion) {
            comunicacionesMap.set(com.id_comunicacion, com);
          }
        });
        
        comunicacionesUsuario = Array.from(comunicacionesMap.values());
        console.log(`✅ Total de comunicaciones únicas encontradas: ${comunicacionesUsuario.length}`);
      } catch (err) {
        console.warn('⚠️ Error al buscar comunicaciones por correo:', err);
      }
      
      if (comunicacionesUsuario.length === 0) {
        console.log('ℹ️ No se encontraron comunicaciones para este correo');
        setComunicaciones([]);
        setLoading(false);
        return;
      }
      
      // 3. Obtener estados y seguimientos para cada comunicación
      const estados = await estadoService.getAll();
      const comunicacionesConEstado: (ComunicacionConEstado | null)[] = await Promise.all(
        comunicacionesUsuario.map(async (com: Comunicacion): Promise<ComunicacionConEstado | null> => {
          try {
            // Obtener estado del seguimiento
            try {
              const seguimiento = await seguimientoService.getByComunicacionId(com.id_comunicacion!);
              if (seguimiento) {
                const estado = estados.find((e: Estado) => e.id_estado === seguimiento.id_estado);
                return { ...com, estado: estado || undefined, seguimiento };
              } else {
                // Si no hay seguimiento, usar estado "Pendiente"
                const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
                return { ...com, estado: pendiente || undefined, seguimiento: undefined };
              }
            } catch {
              // Si hay error, usar estado "Pendiente"
              const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
              return { ...com, estado: pendiente || undefined, seguimiento: undefined };
            }
          } catch (err) {
            console.warn(`⚠️ Error al cargar comunicación ${com.id_comunicacion}:`, err);
            return null;
          }
        })
      );
      
      // Filtrar nulos y ordenar por fecha (más recientes primero)
      const comunicacionesValidas = comunicacionesConEstado
        .filter((com): com is ComunicacionConEstado => com !== null && com !== undefined)
        .sort((a, b) => {
          const fechaA = a.fecha_recepcion ? new Date(a.fecha_recepcion).getTime() : 0;
          const fechaB = b.fecha_recepcion ? new Date(b.fecha_recepcion).getTime() : 0;
          return fechaB - fechaA;
        }) as ComunicacionConEstado[];
      
      console.log('✅ Comunicaciones procesadas con estados:', comunicacionesValidas.length);
      setComunicaciones(comunicacionesValidas);
    } catch (err: unknown) {
      console.error('❌ Error al cargar comunicaciones:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las comunicaciones';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session?.correo]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && session?.correo) {
      loadComunicaciones();
      loadCategorias();
    }
  }, [isAuthenticated, session, authLoading, loadComunicaciones]);

  const loadCategorias = async () => {
    try {
      const data = await categoriaService.getAll();
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const getCategoriaNombre = (idCategoria: number) => {
    const categoria = categorias.find(c => c.id_categoria === idCategoria);
    return categoria?.nombre_categoria || 'N/A';
  };

  const formatFecha = (fecha: string | Date | undefined) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const getEstadoBadge = (comunicacion: ComunicacionConEstado) => {
    const estadoNombre = comunicacion.estado?.nombre_estado || 'Pendiente';
    const estadoClass = estadoNombre.toLowerCase().replace(/\s+/g, '-');
    
    // Mismo formato que en administración: mostrar el nombre completo del estado
    return (
      <span className={`badge-estado badge-${estadoClass}`}>
        {estadoNombre}
      </span>
    );
  };

  // Mostrar carga mientras se verifica la autenticación
  if (authLoading) {
    return (
      <UserLayout>
        <div className="seguimiento-container">
          <p>Cargando...</p>
        </div>
      </UserLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <UserLayout>
        <div className="seguimiento-container">
          <h1>Seguimiento de Quejas y Sugerencias</h1>
          
          <div className="acceso-requerido-card">
            <h2>Iniciar Sesión Requerido</h2>
            <p>Para consultar el seguimiento de tus quejas y sugerencias, necesitas iniciar sesión con tu correo institucional UNACH.</p>
            <p className="acceso-info">
              <strong>Nota:</strong> El sistema es completamente anónimo. Solo necesitas tu correo institucional para consultar las comunicaciones que hayas enviado.
            </p>
            <div className="acceso-buttons">
              <button 
                className="btn-primary-acceso"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión con Correo UNACH
              </button>
              <button 
                className="btn-secondary-acceso"
                onClick={() => navigate('/consulta-folio')}
              >
                Consultar por Folio (Sin sesión)
              </button>
            </div>
            <div className="acceso-links">
              <p>¿Ya enviaste una comunicación? <span onClick={() => navigate('/login')}>Inicia sesión aquí</span> para ver tu seguimiento</p>
              <p>¿Tienes un folio? <span onClick={() => navigate('/consulta-folio')}>Consulta aquí sin iniciar sesión</span></p>
            </div>
          </div>

          <div className="leyenda-card">
            <h3>Leyenda de Estado:</h3>
            <ul>
              <li><strong>Pendiente (P):</strong> La queja/sugerencia ha sido registrada, pero aún no se ha revisado.</li>
              <li><strong>En Proceso (EP):</strong> Se están tomando acciones para evaluar y resolver el caso.</li>
              <li><strong>Atendida (A):</strong> Se ha dado respuesta y/o solución al caso.</li>
              <li><strong>Cerrada (C):</strong> El caso ha sido concluido y archivado.</li>
            </ul>
          </div>

          <div className="notas-card">
            <h3>Notas Adicionales:</h3>
            <ul>
              <li>Este documento debe ser actualizado periódicamente por la comisión encargada de la gestión de quejas y sugerencias.</li>
              <li>Se recomienda generar informes trimestrales sobre el avance y efectividad del sistema.</li>
              <li>La información contenida en este concentrado debe ser tratada con confidencialidad y conforme a las normativas de protección de datos de la Facultad de Medicina Humana Campus IV.</li>
            </ul>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="seguimiento-container">
        <div className="seguimiento-header">
          <h1>Seguimiento de Quejas y Sugerencias</h1>
          <p className="seguimiento-subtitle">Aquí puedes consultar el estado de tus comunicaciones</p>
        </div>
        
        {loading && (
          <div className="loading-message">
            <p>Cargando tus comunicaciones...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <>
            {comunicaciones.length === 0 ? (
              <div className="no-comunicaciones-card">
                <p>No tienes comunicaciones registradas aún.</p>
                <button 
                  className="btn-primary-acceso"
                  onClick={() => navigate('/buzon')}
                >
                  Enviar una queja o sugerencia
                </button>
              </div>
            ) : (
              <div className="seguimiento-card">
                <table className="seguimiento-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Fecha de Recepción</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Área Involucrada</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comunicaciones.map((com) => {
                      return (
                        <tr key={com.id_comunicacion}>
                          <td className="folio-cell">{com.folio || 'N/A'}</td>
                          <td>{formatFecha(com.fecha_recepcion)}</td>
                          <td>{com.tipo || 'N/A'}</td>
                          <td>{getCategoriaNombre(com.id_categoria)}</td>
                          <td>{getEstadoBadge(com)}</td>
                          <td>{com.area_involucrada || 'N/A'}</td>
                          <td className="descripcion-cell">
                            {com.descripcion ? (
                              com.descripcion.length > 100 ? com.descripcion.substring(0, 100) + '...' : com.descripcion
                            ) : 'N/A'}
                          </td>
                          <td className="acciones-cell">
                            <button 
                              className="btn-ver-detalles-tabla"
                              onClick={() => {
                                setSelectedComunicacion(com);
                                setShowModal(true);
                              }}
                              title="Ver detalles completos de la comunicación"
                            >
                              <MdVisibility />
                              <span>Ver detalles</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="leyenda-card">
          <h3>Leyenda de Estado:</h3>
          <ul>
            <li><strong>Pendiente (P):</strong> La queja/sugerencia ha sido registrada, pero aún no se ha revisado.</li>
            <li><strong>En Proceso (EP):</strong> Se están tomando acciones para evaluar y resolver el caso.</li>
            <li><strong>Atendida (A):</strong> Se ha dado respuesta y/o solución al caso.</li>
            <li><strong>Cerrada (C):</strong> El caso ha sido concluido y archivado.</li>
          </ul>
        </div>

        <div className="notas-card">
          <h3>Notas Adicionales:</h3>
          <ul>
            <li>Este documento debe ser actualizado periódicamente por la comisión encargada de la gestión de quejas y sugerencias.</li>
            <li>Se recomienda generar informes trimestrales sobre el avance y efectividad del sistema.</li>
            <li>La información contenida en este concentrado debe ser tratada con confidencialidad y conforme a las normativas de protección de datos de la Facultad de Medicina Humana Campus IV.</li>
          </ul>
        </div>

        {/* Modal para ver detalles completos de la comunicación */}
        {showModal && selectedComunicacion && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content-seguimiento" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-seguimiento">
                <h2>Detalles de la Comunicación</h2>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-body-seguimiento">
                <div className="modal-detail-row">
                  <strong>Folio:</strong>
                  <span>{selectedComunicacion.folio || 'N/A'}</span>
                </div>
                <div className="modal-detail-row">
                  <strong>Fecha de Recepción:</strong>
                  <span>{formatFecha(selectedComunicacion.fecha_recepcion)}</span>
                </div>
                <div className="modal-detail-row">
                  <strong>Tipo:</strong>
                  <span>{selectedComunicacion.tipo || 'N/A'}</span>
                </div>
                <div className="modal-detail-row">
                  <strong>Categoría:</strong>
                  <span>{getCategoriaNombre(selectedComunicacion.id_categoria)}</span>
                </div>
                <div className="modal-detail-row">
                  <strong>Estado:</strong>
                  <span>{getEstadoBadge(selectedComunicacion)}</span>
                </div>
                <div className="modal-detail-row">
                  <strong>Área Involucrada:</strong>
                  <span>{selectedComunicacion.area_involucrada || 'N/A'}</span>
                </div>
                <div className="modal-detail-row full-width">
                  <strong>Descripción Completa:</strong>
                  <div className="modal-descripcion-completa">
                    {selectedComunicacion.descripcion || 'N/A'}
                  </div>
                </div>
                
                {/* Respuesta/Comentarios del Administrador - siempre visible en el modal */}
                <div className="modal-detail-row full-width">
                  <strong>Respuesta/Comentarios del Administrador:</strong>
                  {(() => {
                    const estadoNombre = selectedComunicacion.estado?.nombre_estado || 'Pendiente';
                    const notas = selectedComunicacion.seguimiento?.notas?.trim() || '';
                    
                    // Si hay notas y el estado es Atendida o Cerrada, mostrar las notas completas
                    if (notas && (estadoNombre === 'Atendida' || estadoNombre === 'Cerrada')) {
                      // Filtrar información técnica automática si existe
                      let notasParaUsuario = notas;
                      
                      // Remover notas técnicas automáticas si están al inicio
                      const patronesTecnicos = [
                        /^Comunicación recibida\.\s*/i,
                        /^Prioridad\s+\w+\s+asignada\s+automáticamente/i,
                        /^Propuesta de mejora:/i,
                      ];
                      
                      // Si las notas empiezan con información técnica, intentar extraer solo los comentarios del admin
                      // Buscar si hay un salto de línea o punto que separe la información técnica de los comentarios
                      const lineas = notasParaUsuario.split('\n');
                      const lineasFiltradas = lineas.filter(linea => {
                        // Filtrar líneas que son claramente técnicas
                        return !patronesTecnicos.some(patron => patron.test(linea.trim()));
                      });
                      
                      // Si después de filtrar quedan líneas, usarlas; si no, usar las originales
                      notasParaUsuario = lineasFiltradas.length > 0 
                        ? lineasFiltradas.join('\n').trim()
                        : notasParaUsuario;
                      
                      // Si después de filtrar está vacío, usar las notas originales
                      if (!notasParaUsuario.trim()) {
                        notasParaUsuario = notas;
                      }
                      
                      const seguimiento = selectedComunicacion.seguimiento;
                      return (
                        <div className="modal-respuesta">
                          <div className="respuesta-content">
                            {notasParaUsuario}
                          </div>
                          {seguimiento?.fecha_resolucion && (
                            <div className="modal-respuesta-fecha">
                              Resuelto el: {formatFecha(seguimiento.fecha_resolucion)}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Si hay notas pero el estado no es Atendida/Cerrada, mostrar las notas de todos modos
                    // (puede ser que el admin haya agregado comentarios antes de cambiar el estado)
                    if (notas && notas.length > 0) {
                      return (
                        <div className="modal-respuesta">
                          <div className="respuesta-content">
                            {notas}
                          </div>
                        </div>
                      );
                    }
                    
                    // Si no hay notas
                    if (estadoNombre === 'Atendida' || estadoNombre === 'Cerrada') {
                      return (
                        <div className="modal-sin-respuesta">
                          Sin comentarios disponibles aún.
                        </div>
                      );
                    } else {
                      return (
                        <div className="modal-pendiente-respuesta">
                          Pendiente de revisión por parte del administrador.
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              <div className="modal-footer-seguimiento">
                <button 
                  className="btn-cerrar-modal"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SeguimientoPage;

