import { useState, useEffect } from 'react';
import UserLayout from '../../components/user/UserLayout';
import { comunicacionService } from '../../services/comunicacionService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import type { Comunicacion, Estado } from '../../types';
import './Reconocimientos.css';

interface ReconocimientoConEstado extends Comunicacion {
  estado?: Estado;
}

const Reconocimientos = () => {
  const [reconocimientos, setReconocimientos] = useState<ReconocimientoConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReconocimientos();
  }, []);

  const loadReconocimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [comData, estadosData] = await Promise.all([
        comunicacionService.getAll(),
        estadoService.getAll()
      ]);
      
      const reconocimientosData = comData.filter((c: Comunicacion) => c.tipo === 'Reconocimiento');
      
      // Cargar estados para cada reconocimiento
      const reconocimientosConEstado = await Promise.all(
        reconocimientosData.map(async (reconocimiento: Comunicacion) => {
          try {
            const seguimiento = await seguimientoService.getByComunicacionId(reconocimiento.id_comunicacion!);
            if (seguimiento) {
              const estado = estadosData.find((e: Estado) => e.id_estado === seguimiento.id_estado);
              return {
                ...reconocimiento,
                estado
              };
            }
            return {
              ...reconocimiento,
              estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente')
            };
          } catch (err) {
            return {
              ...reconocimiento,
              estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente')
            };
          }
        })
      );
      
      // Filtrar solo los reconocimientos que están "Atendida" o "Cerrada" para mostrar
      const reconocimientosPublicos = reconocimientosConEstado.filter(
        (r) => r.estado?.nombre_estado === 'Atendida' || r.estado?.nombre_estado === 'Cerrada'
      );
      
      setReconocimientos(reconocimientosPublicos);
    } catch (error) {
      console.error('Error al cargar reconocimientos:', error);
      setError('Error al cargar los reconocimientos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoClass = (estadoNombre?: string) => {
    if (!estadoNombre) return 'logro-azul';
    const estado = estadoNombre.toLowerCase();
    if (estado === 'atendida' || estado === 'cerrada') return 'logro-verde';
    return 'logro-azul';
  };

  return (
    <UserLayout>
      <div className="reconocimientos-container">
        <h1>Reconocimientos</h1>
        <p className="reconocimientos-subtitle">
          Reconocimientos destacados de la Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV
        </p>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          borderLeft: '4px solid var(--unach-dorado)'
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--unach-azul-oscuro)', fontSize: '1.1rem' }}>
            ¿Qué son los Reconocimientos?
          </h3>
          <p style={{ marginBottom: '0.5rem', color: '#555', lineHeight: '1.6' }}>
            Los reconocimientos son mensajes positivos enviados por la comunidad universitaria para destacar:
          </p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#555', lineHeight: '1.8' }}>
            <li>El buen trabajo de estudiantes, docentes o personal administrativo</li>
            <li>Acciones positivas que contribuyen al mejoramiento de la facultad</li>
            <li>Logros y contribuciones destacadas de miembros de la comunidad</li>
            <li>Áreas o departamentos que han demostrado excelencia en su servicio</li>
          </ul>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Los reconocimientos son revisados por la Comisión y, una vez aprobados, se publican aquí para que toda la comunidad pueda verlos.
          </p>
        </div>
        
        {loading ? (
          <div className="loading-message">
            <p>Cargando reconocimientos...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : reconocimientos.length === 0 ? (
          <div className="empty-message">
            <p>No hay reconocimientos públicos disponibles en este momento.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Los reconocimientos aparecerán aquí una vez que sean atendidos y aprobados.
            </p>
          </div>
        ) : (
          <div className="reconocimientos-gallery">
            {reconocimientos.map((reconocimiento) => {
              // Extraer nombre del reconocido de la descripción si es posible
              const descripcion = reconocimiento.descripcion || '';
              const lineas = descripcion.split('\n');
              const primeraLinea = lineas[0] || '';
              
              // Intentar extraer nombre (puede estar en diferentes formatos)
              let nombreReconocido = 'Reconocimiento';
              if (primeraLinea.includes('a') || primeraLinea.includes('al') || primeraLinea.includes('para')) {
                const match = primeraLinea.match(/(?:a|al|para)\s+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)/);
                if (match) {
                  nombreReconocido = match[1];
                }
              }
              
              return (
                <div key={reconocimiento.id_comunicacion} className="reconocimiento-card">
                  <div className="reconocimiento-avatar">
                    {nombreReconocido.substring(0, 2).toUpperCase()}
                  </div>
                  <h3>{nombreReconocido}</h3>
                  <p className="reconocimiento-rol">
                    {reconocimiento.area_involucrada || 'Reconocimiento especial'}
                  </p>
                  <div className={`reconocimiento-logro ${getEstadoClass(reconocimiento.estado?.nombre_estado)}`}>
                    {descripcion.length > 150 ? descripcion.substring(0, 150) + '...' : descripcion}
                  </div>
                  {reconocimiento.fecha_recepcion && (
                    <div className="reconocimiento-fecha">
                      {new Date(reconocimiento.fecha_recepcion).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                  {reconocimiento.folio && (
                    <div className="reconocimiento-folio">
                      Folio: {reconocimiento.folio}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Reconocimientos;
