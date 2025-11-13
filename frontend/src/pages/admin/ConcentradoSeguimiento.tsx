import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../components/common/ToastContainer';
import { MdRefresh } from 'react-icons/md';
import { comunicacionService } from '../../services/comunicacionService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import { categoriaService } from '../../services/categoriaService';
import type { Comunicacion, Estado, Seguimiento, Categoria } from '../../types';
import { usePageTitle } from '../../hooks/usePageTitle';
import './ConcentradoSeguimiento.css';

interface ComunicacionConSeguimiento extends Comunicacion {
  estado?: Estado;
  seguimiento?: Seguimiento;
  categoria?: Categoria;
}

const ConcentradoSeguimiento = () => {
  usePageTitle('Concentrado de Seguimiento');
  const { showToast } = useToast();
  const [comunicaciones, setComunicaciones] = useState<ComunicacionConSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Queja' | 'Sugerencia'>('Todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comData, estadosData, categoriasData] = await Promise.all([
        comunicacionService.getAll(),
        estadoService.getAll(),
        categoriaService.getAll()
      ]);
      
      // Cargar seguimientos y estados para cada comunicación
      const comunicacionesConSeguimiento = await Promise.all(
        comData.map(async (com: Comunicacion) => {
          try {
            const seguimiento = await seguimientoService.getByComunicacionId(com.id_comunicacion!);
            const estado = seguimiento 
              ? estadosData.find((e: Estado) => e.id_estado === seguimiento.id_estado)
              : estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente');
            const categoria = categoriasData.find((c: Categoria) => c.id_categoria === com.id_categoria);
            
            return {
              ...com,
              estado: estado || undefined,
              seguimiento: seguimiento || undefined,
              categoria: categoria || undefined
            };
          } catch {
            const estado = estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente');
            const categoria = categoriasData.find((c: Categoria) => c.id_categoria === com.id_categoria);
            return {
              ...com,
              estado: estado || undefined,
              categoria: categoria || undefined
            };
          }
        })
      );
      
      setComunicaciones(comunicacionesConSeguimiento);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar el concentrado de seguimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredComunicaciones = (): ComunicacionConSeguimiento[] => {
    let filtered = comunicaciones;
    
    // Filtrar por tipo (solo Quejas y Sugerencias)
    if (filterTipo !== 'Todos') {
      filtered = filtered.filter(c => c.tipo === filterTipo);
    } else {
      filtered = filtered.filter(c => c.tipo === 'Queja' || c.tipo === 'Sugerencia');
    }
    
    // Ordenar por fecha de recepción (más recientes primero)
    return filtered.sort((a, b) => {
      const fechaA = a.fecha_recepcion ? new Date(a.fecha_recepcion).getTime() : 0;
      const fechaB = b.fecha_recepcion ? new Date(b.fecha_recepcion).getTime() : 0;
      return fechaB - fechaA;
    });
  };

  const getEstadoBadgeClass = (estadoNombre?: string): string => {
    if (!estadoNombre) return 'badge-estado badge-pendiente';
    
    const estado = estadoNombre.toLowerCase();
    if (estado === 'pendiente') return 'badge-estado badge-pendiente';
    if (estado === 'en proceso') return 'badge-estado badge-en-proceso';
    if (estado === 'atendida') return 'badge-estado badge-atendida';
    if (estado === 'cerrada') return 'badge-estado badge-cerrada';
    return 'badge-estado badge-pendiente';
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'DD/MM/AAAA';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'DD/MM/AAAA';
    }
  };

  const filteredComunicaciones = getFilteredComunicaciones();

  return (
    <AdminLayout>
      <div className="concentrado-container">
        <div className="concentrado-header">
          <div className="header-content">
            <h1>Concentrado de Seguimiento de Quejas y Sugerencias</h1>
            <div className="header-actions">
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value as 'Todos' | 'Queja' | 'Sugerencia')}
                className="filter-select"
              >
                <option value="Todos">Todos</option>
                <option value="Queja">Quejas</option>
                <option value="Sugerencia">Sugerencias</option>
              </select>
              <button className="btn-refresh" onClick={loadData} title="Actualizar datos">
                <MdRefresh />
              </button>
            </div>
          </div>
        </div>

        <div className="concentrado-card">
          {loading ? (
            <div className="loading-message">
              <div>Cargando concentrado de seguimiento...</div>
            </div>
          ) : filteredComunicaciones.length === 0 ? (
            <div className="no-data-message">
              <p>No hay comunicaciones para mostrar con los filtros seleccionados.</p>
            </div>
          ) : (
            <table className="concentrado-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha de Recepción</th>
                  <th>Tipo (Queja/Sugerencia)</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Fecha de Resolución</th>
                </tr>
              </thead>
              <tbody>
                {filteredComunicaciones.map((comunicacion) => (
                  <tr key={comunicacion.id_comunicacion}>
                    <td className="folio-cell">{comunicacion.folio || 'N/A'}</td>
                    <td>{formatDate(comunicacion.fecha_recepcion)}</td>
                    <td>{comunicacion.tipo || 'N/A'}</td>
                    <td>{comunicacion.categoria?.nombre_categoria || 'N/A'}</td>
                    <td>
                      <span className={getEstadoBadgeClass(comunicacion.estado?.nombre_estado)}>
                        {comunicacion.estado?.nombre_estado || 'Pendiente'}
                      </span>
                    </td>
                    <td>{formatDate(comunicacion.seguimiento?.fecha_resolucion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConcentradoSeguimiento;




