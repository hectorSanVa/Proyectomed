import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import AdminLayout from '../../components/admin/AdminLayout';
import Semaforo, { mapEstadoToSemaforo } from '../../components/common/Semaforo';
import { MdWarning, MdLightbulb, MdStar, MdSchedule, MdVisibility, MdTrendingUp, MdError, MdCheckCircle, MdRefresh } from 'react-icons/md';
import { comunicacionService } from '../../services/comunicacionService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import { categoriaService } from '../../services/categoriaService';
import type { Comunicacion, Estado, Categoria, Seguimiento } from '../../types';
import './Dashboard.css';

interface ComunicacionConEstado extends Comunicacion {
  estado?: Estado;
  seguimiento?: Seguimiento;
}

interface StatsByCategory {
  categoria: string;
  total: number;
  quejas: number;
  sugerencias: number;
  reconocimientos: number;
}

const Dashboard = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    totalQuejas: 0,
    totalSugerencias: 0,
    totalReconocimientos: 0,
    pendientes: 0,
    enProceso: 0,
    atendidas: 0,
    cerradas: 0,
    total: 0,
  });
  const [statsByCategory, setStatsByCategory] = useState<StatsByCategory[]>([]);
  const [statsByEstado, setStatsByEstado] = useState<{ estado: string; cantidad: number }[]>([]);
  const [ultimasComunicaciones, setUltimasComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [tiempoPromedio, setTiempoPromedio] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }
        const [comunicaciones, estados, categorias] = await Promise.all([
          comunicacionService.getAll(),
          estadoService.getAll(),
          categoriaService.getAll()
        ]);
        
        const quejas = comunicaciones.filter((c: Comunicacion) => c.tipo === 'Queja');
        const sugerencias = comunicaciones.filter((c: Comunicacion) => c.tipo === 'Sugerencia');
        const reconocimientos = comunicaciones.filter((c: Comunicacion) => c.tipo === 'Reconocimiento');
        
        // Cargar estados y seguimientos para todas las comunicaciones
        const comunicacionesConEstado = await Promise.all(
          comunicaciones.map(async (com: Comunicacion) => {
            try {
              const seguimiento = await seguimientoService.getByComunicacionId(com.id_comunicacion!);
              if (seguimiento) {
                const estado = estados.find((e: Estado) => e.id_estado === seguimiento.id_estado);
                return { 
                  ...com, 
                  estado,
                  seguimiento // Incluir el seguimiento completo para tener acceso a la prioridad
                };
              }
              return { 
                ...com, 
                estado: estados.find((e: Estado) => e.nombre_estado === 'Pendiente'),
                seguimiento: undefined
              };
            } catch {
              return { 
                ...com, 
                estado: estados.find((e: Estado) => e.nombre_estado === 'Pendiente'),
                seguimiento: undefined
              };
            }
          })
        );

        // Calcular estadísticas por estado
        const pendientes = comunicacionesConEstado.filter(c => c.estado?.nombre_estado === 'Pendiente').length;
        const enProceso = comunicacionesConEstado.filter(c => c.estado?.nombre_estado === 'En Proceso').length;
        const atendidas = comunicacionesConEstado.filter(c => c.estado?.nombre_estado === 'Atendida').length;
        const cerradas = comunicacionesConEstado.filter(c => c.estado?.nombre_estado === 'Cerrada').length;

        // Estadísticas por categoría
        const statsCat: StatsByCategory[] = categorias.map((cat: Categoria) => {
          const coms = comunicacionesConEstado.filter((c: ComunicacionConEstado) => c.id_categoria === cat.id_categoria);
          return {
            categoria: cat.nombre_categoria,
            total: coms.length,
            quejas: coms.filter((c: ComunicacionConEstado) => c.tipo === 'Queja').length,
            sugerencias: coms.filter((c: ComunicacionConEstado) => c.tipo === 'Sugerencia').length,
            reconocimientos: coms.filter((c: ComunicacionConEstado) => c.tipo === 'Reconocimiento').length,
          };
        }).filter((s: StatsByCategory) => s.total > 0);

        // Estadísticas por estado
        const statsEst: { estado: string; cantidad: number }[] = [
          { estado: 'Pendiente', cantidad: pendientes },
          { estado: 'En Proceso', cantidad: enProceso },
          { estado: 'Atendida', cantidad: atendidas },
          { estado: 'Cerrada', cantidad: cerradas },
        ];

        // Calcular tiempo promedio de resolución
        let tiempoTotal = 0;
        let casosResueltos = 0;
        comunicacionesConEstado.forEach(com => {
          if (com.estado?.nombre_estado === 'Cerrada' || com.estado?.nombre_estado === 'Atendida') {
            if (com.fecha_recepcion) {
              const fechaRecepcion = new Date(com.fecha_recepcion);
              const fechaActual = new Date();
              const dias = Math.floor((fechaActual.getTime() - fechaRecepcion.getTime()) / (1000 * 60 * 60 * 24));
              tiempoTotal += dias;
              casosResueltos++;
            }
          }
        });
        const tiempoProm = casosResueltos > 0 ? Math.round(tiempoTotal / casosResueltos) : 0;
        
        // Últimas comunicaciones
        const ultimas = comunicacionesConEstado
          .sort((a, b) => {
            const fechaA = a.fecha_recepcion ? new Date(a.fecha_recepcion).getTime() : 0;
            const fechaB = b.fecha_recepcion ? new Date(b.fecha_recepcion).getTime() : 0;
            return fechaB - fechaA;
          })
          .slice(0, 5);
        
        setStats({
          totalQuejas: quejas.length,
          totalSugerencias: sugerencias.length,
          totalReconocimientos: reconocimientos.length,
          pendientes,
          enProceso,
          atendidas,
          cerradas,
          total: comunicaciones.length,
        });
        setStatsByCategory(statsCat);
        setStatsByEstado(statsEst);
        setUltimasComunicaciones(ultimas);
        setTiempoPromedio(tiempoProm);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  // Cargar datos al montar
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Recargar cuando se navega de vuelta al Dashboard
  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      loadStats(false);
    }
  }, [location.pathname, loadStats]);

  // Recargar cuando la página se vuelve visible (usuario vuelve de otra pestaña)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (location.pathname === '/admin' || location.pathname === '/admin/')) {
        loadStats(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats(true);
  };

  const getMaxValue = (data: { cantidad: number }[]) => {
    return Math.max(...data.map(d => d.cantidad), 1);
  };

  const getMaxCategoryValue = (data: StatsByCategory[]) => {
    return Math.max(...data.map(d => d.total), 1);
  };

  const getPrioridadBadge = (prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente') => {
    const prioridadActual = prioridad || 'Media';
    const prioridadClass = prioridadActual.toLowerCase();
    return <span className={`badge badge-prioridad badge-${prioridadClass}`}>{prioridadActual}</span>;
  };

  const getEstadoSemaforo = (comunicacion: ComunicacionConEstado) => {
    const estadoNombre = comunicacion.estado?.nombre_estado || 'Pendiente';
    const estadoSemaforo = mapEstadoToSemaforo(estadoNombre);
    return <Semaforo estado={estadoSemaforo} showLabel={true} size="small" className="horizontal" />;
  };

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Panel de Administración</h1>
            <p>Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV</p>
          </div>
          <button 
            className="btn-refresh-dashboard" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title={refreshing ? 'Actualizando...' : 'Actualizar estadísticas'}
          >
            <MdRefresh className={refreshing ? 'spinning' : ''} />
          </button>
        </div>

        {/* Alertas */}
        {stats.pendientes > 0 && (
          <div className="dashboard-alert alert-warning">
            <MdError />
            <div>
              <strong>{stats.pendientes} comunicación(es) pendiente(s)</strong>
              <p>Requieren atención inmediata</p>
            </div>
            <button onClick={() => navigate('/admin/quejas')} className="btn-alert">
              Ver Quejas
            </button>
          </div>
        )}

        {/* Estadísticas principales */}
        <div className="stats-grid">
          <div className="stat-card stat-quejas">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : stats.totalQuejas}</h3>
                <p>Total Quejas</p>
                <span className="stat-change">
                  {stats.total > 0 ? Math.round((stats.totalQuejas / stats.total) * 100) : 0}% del total
                </span>
              </div>
              <div className="stat-icon">
                <MdWarning />
              </div>
            </div>
          </div>

          <div className="stat-card stat-sugerencias">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : stats.totalSugerencias}</h3>
                <p>Total Sugerencias</p>
                <span className="stat-change">
                  {stats.total > 0 ? Math.round((stats.totalSugerencias / stats.total) * 100) : 0}% del total
                </span>
              </div>
              <div className="stat-icon">
                <MdLightbulb />
              </div>
            </div>
          </div>

          <div className="stat-card stat-reconocimientos">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : stats.totalReconocimientos}</h3>
                <p>Total Reconocimientos</p>
                <span className="stat-change">
                  {stats.total > 0 ? Math.round((stats.totalReconocimientos / stats.total) * 100) : 0}% del total
                </span>
              </div>
              <div className="stat-icon">
                <MdStar />
              </div>
            </div>
          </div>

          <div className="stat-card stat-pendientes">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : stats.pendientes}</h3>
                <p>Pendientes</p>
                <span className="stat-change warning">
                  {stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}% sin atender
                </span>
              </div>
              <div className="stat-icon">
                <MdSchedule />
              </div>
            </div>
          </div>

          <div className="stat-card stat-tiempo">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : tiempoPromedio}</h3>
                <p>Días Promedio</p>
                <span className="stat-change">
                  Tiempo de resolución
                </span>
              </div>
              <div className="stat-icon">
                <MdTrendingUp />
              </div>
            </div>
          </div>

          <div className="stat-card stat-resueltas">
            <div className="stat-content">
              <div className="stat-info">
                <h3>{loading ? '...' : stats.atendidas + stats.cerradas}</h3>
                <p>Resueltas</p>
                <span className="stat-change success">
                  {stats.total > 0 ? Math.round(((stats.atendidas + stats.cerradas) / stats.total) * 100) : 0}% completadas
                </span>
              </div>
              <div className="stat-icon">
                <MdCheckCircle />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="charts-grid">
          <div className="dashboard-section">
            <h2>Distribución por Estado</h2>
            <div className="chart-container">
              {loading ? (
                <p className="placeholder-text">Cargando...</p>
              ) : (
                <div className="bar-chart">
                  {statsByEstado.map((item, index) => {
                    const maxValue = getMaxValue(statsByEstado);
                    const percentage = (item.cantidad / maxValue) * 100;
                    const colors = ['#ffc107', '#17a2b8', '#28a745', '#6c757d'];
                    return (
                      <div key={index} className="bar-item">
                        <div className="bar-label">{item.estado}</div>
                        <div className="bar-wrapper">
                          <div
                            className="bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length],
                            }}
                          >
                            <span className="bar-value">{item.cantidad}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Estadísticas por Categoría</h2>
            <div className="chart-container">
              {loading ? (
                <p className="placeholder-text">Cargando...</p>
              ) : statsByCategory.length === 0 ? (
                <p className="placeholder-text">No hay datos por categoría</p>
              ) : (
                <div className="category-chart">
                  {statsByCategory.slice(0, 5).map((item, index) => {
                    const maxValue = getMaxCategoryValue(statsByCategory);
                    const percentage = (item.total / maxValue) * 100;
                    return (
                      <div key={index} className="category-item">
                        <div className="category-label">
                          <span>{item.categoria}</span>
                          <span className="category-total">{item.total}</span>
                        </div>
                        <div className="category-bar-wrapper">
                          <div
                            className="category-bar"
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="category-breakdown">
                              <span style={{ width: `${(item.quejas / item.total) * 100}%`, backgroundColor: '#dc3545' }}></span>
                              <span style={{ width: `${(item.sugerencias / item.total) * 100}%`, backgroundColor: '#ffc107' }}></span>
                              <span style={{ width: `${(item.reconocimientos / item.total) * 100}%`, backgroundColor: '#28a745' }}></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Últimas comunicaciones */}
        <div className="dashboard-section full-width">
          <h2>Últimas Comunicaciones</h2>
          <div className="section-content">
            {loading ? (
              <p className="placeholder-text">Cargando...</p>
            ) : ultimasComunicaciones.length === 0 ? (
              <p className="placeholder-text">No hay comunicaciones registradas</p>
            ) : (
              <div className="comunicaciones-list">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasComunicaciones.map((com) => (
                      <tr key={com.id_comunicacion}>
                        <td className="folio-cell">{com.folio}</td>
                        <td>
                          {com.tipo === 'Queja' && <MdWarning style={{ color: '#dc3545' }} />}
                          {com.tipo === 'Sugerencia' && <MdLightbulb style={{ color: '#ffc107' }} />}
                          {com.tipo === 'Reconocimiento' && <MdStar style={{ color: '#28a745' }} />}
                          {' '}{com.tipo}
                        </td>
                        <td>
                          {com.fecha_recepcion
                            ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX')
                            : 'N/A'}
                        </td>
                        <td>
                          {getPrioridadBadge(com.seguimiento?.prioridad)}
                        </td>
                        <td>
                          {getEstadoSemaforo(com)}
                        </td>
                        <td className="descripcion-cell">
                          {com.descripcion.substring(0, 50)}
                          {com.descripcion.length > 50 ? '...' : ''}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => {
                              if (com.tipo === 'Queja') navigate('/admin/quejas');
                              else if (com.tipo === 'Sugerencia') navigate('/admin/sugerencias');
                              else navigate('/admin/reconocimientos');
                            }}
                            title="Ver detalles"
                          >
                            <MdVisibility />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
