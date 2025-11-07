import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import { comunicacionService } from '../../services/comunicacionService';
import { categoriaService } from '../../services/categoriaService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import UserLayout from '../../components/user/UserLayout';
import type { Comunicacion, Categoria, Estado, Seguimiento } from '../../types';
import './Seguimiento.css';

interface ComunicacionConEstado extends Comunicacion {
  estado?: Estado;
}

const Seguimiento = () => {
  const navigate = useNavigate();
  const { isAuthenticated, session, loading: authLoading } = useUsuarioAuth();
  const [comunicaciones, setComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && session?.id_usuario) {
      loadComunicaciones();
      loadCategorias();
    }
  }, [isAuthenticated, session, authLoading]);

  const loadComunicaciones = async () => {
    if (!session?.id_usuario) {
      console.warn('⚠️ No hay id_usuario en la sesión');
      setError('No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Buscando comunicaciones para usuario:', session.id_usuario);
      const data = await comunicacionService.getByUsuarioId(session.id_usuario);
      console.log('✅ Comunicaciones encontradas:', data.length);
      
      if (data.length === 0) {
        console.log('ℹ️ No se encontraron comunicaciones para este usuario');
        setComunicaciones([]);
        setLoading(false);
        return;
      }
      
      // Obtener estados para cada comunicación
      const estados = await estadoService.getAll();
      const comunicacionesConEstado = await Promise.all(
        data.map(async (com) => {
          try {
            const seguimiento = await seguimientoService.getByComunicacionId(com.id_comunicacion!);
            if (seguimiento) {
              const estado = estados.find((e: Estado) => e.id_estado === seguimiento.id_estado);
              return { ...com, estado: estado || undefined };
            } else {
              // Si no hay seguimiento, usar estado "Pendiente"
              const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
              return { ...com, estado: pendiente || undefined };
            }
          } catch {
            // Si hay error, usar estado "Pendiente"
            const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
            return { ...com, estado: pendiente || undefined };
          }
        })
      );
      
      console.log('✅ Comunicaciones procesadas con estados:', comunicacionesConEstado.length);
      setComunicaciones(comunicacionesConEstado);
    } catch (err: any) {
      console.error('❌ Error al cargar comunicaciones:', err);
      setError(err.message || 'Error al cargar las comunicaciones');
    } finally {
      setLoading(false);
    }
  };

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
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX');
  };

  const getEstadoBadge = (comunicacion: ComunicacionConEstado) => {
    const estadoNombre = comunicacion.estado?.nombre_estado || 'Pendiente';
    const estadoClass = estadoNombre.toLowerCase().replace(/\s+/g, '-');
    
    // Mapeo de estados a abreviaciones
    const estadoAbreviaciones: { [key: string]: string } = {
      'Pendiente': 'P',
      'En Proceso': 'EP',
      'En proceso': 'EP',
      'Atendida': 'A',
      'Cerrada': 'C',
      'Resuelta': 'R'
    };
    
    const abreviacion = estadoAbreviaciones[estadoNombre] || estadoNombre.substring(0, 2).toUpperCase();
    
    return (
      <span className={`badge-estado badge-${estadoClass}`} title={estadoNombre}>
        {abreviacion}
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
            <p>Para consultar el seguimiento de tus quejas y sugerencias, necesitas iniciar sesión en el sistema.</p>
            <div className="acceso-buttons">
              <button 
                className="btn-primary-acceso"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </button>
              <button 
                className="btn-secondary-acceso"
                onClick={() => navigate('/register')}
              >
                Registrarse
              </button>
            </div>
            <div className="acceso-links">
              <p>¿Ya tienes una cuenta? <span onClick={() => navigate('/login')}>Inicia sesión aquí</span></p>
              <p>¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate aquí</span></p>
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
        <h1>Seguimiento de Quejas y Sugerencias</h1>
        <p className="seguimiento-subtitle">Aquí puedes consultar el estado de tus comunicaciones</p>
        
        {loading && <p>Cargando...</p>}
        {error && <div className="error-message"><p>{error}</p></div>}
        
        {!loading && !error && (
          <>
            {comunicaciones.length === 0 ? (
              <div className="no-comunicaciones">
                <p>No tienes comunicaciones registradas aún.</p>
                <button 
                  className="btn-primary-acceso"
                  onClick={() => navigate('/buzon')}
                >
                  Enviar una queja o sugerencia
                </button>
              </div>
            ) : (
              <div className="seguimiento-tabla">
                <table>
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Fecha de Recepción</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Área Involucrada</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comunicaciones.map((com) => (
                      <tr key={com.id_comunicacion}>
                        <td><strong>{com.folio}</strong></td>
                        <td>{formatFecha(com.fecha_recepcion)}</td>
                        <td>{com.tipo}</td>
                        <td>{getCategoriaNombre(com.id_categoria)}</td>
                        <td>{getEstadoBadge(com)}</td>
                        <td>{com.area_involucrada || 'N/A'}</td>
                        <td className="descripcion-cell">{com.descripcion.substring(0, 100)}{com.descripcion.length > 100 ? '...' : ''}</td>
                      </tr>
                    ))}
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
      </div>
    </UserLayout>
  );
};

export default Seguimiento;

