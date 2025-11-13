import { useState, useEffect } from 'react';
import UserLayout from '../../components/user/UserLayout';
import { comunicacionService } from '../../services/comunicacionService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import type { Comunicacion, Estado } from '../../types';
import './Reconocimientos.css';

// Componente Reconocimientos

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
      
      // Obtener reconocimientos públicos directamente desde el endpoint
      const reconocimientosData = await comunicacionService.getReconocimientosPublicos();
      
      // Si no hay reconocimientos, retornar array vacío
      if (!reconocimientosData || !Array.isArray(reconocimientosData)) {
        setReconocimientos([]);
        return;
      }
      
      // Cargar estados para cada reconocimiento
      const estadosData = await estadoService.getAll();
      
      const reconocimientosConEstado = await Promise.all(
        reconocimientosData.map(async (reconocimiento: Comunicacion) => {
          try {
            if (!reconocimiento.id_comunicacion) {
              return {
                ...reconocimiento,
                estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente')
              };
            }
            
            const seguimiento = await seguimientoService.getByComunicacionId(reconocimiento.id_comunicacion);
            if (seguimiento && seguimiento.id_estado) {
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
            console.warn('Error al cargar seguimiento para reconocimiento:', err);
            return {
              ...reconocimiento,
              estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente')
            };
          }
        })
      );
      
      setReconocimientos(reconocimientosConEstado);
    } catch (error: any) {
      console.error('Error al cargar reconocimientos:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al cargar los reconocimientos';
      setError(errorMessage);
      setReconocimientos([]);
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
        <h1>Felicitaciones y Reconocimientos</h1>
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
          <>
            <div className="reconocimientos-gallery">
              {reconocimientos.map((reconocimiento) => {
                // Extraer información del reconocimiento
                const descripcion = reconocimiento.descripcion || '';
                const lineas = descripcion.split('\n');
                const primeraLinea = lineas[0] || '';
                
                // Intentar extraer nombre (puede estar en diferentes formatos)
                let nombreReconocido = 'Reconocimiento';
                let tipoReconocimiento = reconocimiento.area_involucrada || 'Reconocimiento especial';
                
                // Mejorar la extracción del nombre
                if (primeraLinea.includes('a ') || primeraLinea.includes('al ') || primeraLinea.includes('para ')) {
                  const match = primeraLinea.match(/(?:a|al|para)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/);
                  if (match) {
                    nombreReconocido = match[1];
                  }
                } else if (primeraLinea.match(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+/)) {
                  // Si la primera línea parece un nombre, usarlo
                  const match = primeraLinea.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/);
                  if (match) {
                    nombreReconocido = match[1];
                  }
                }
                
                // Determinar tipo de reconocimiento basado en área o descripción
                if (reconocimiento.area_involucrada) {
                  tipoReconocimiento = reconocimiento.area_involucrada;
                } else if (descripcion.toLowerCase().includes('docente') || descripcion.toLowerCase().includes('profesor')) {
                  tipoReconocimiento = 'Docente destacado';
                } else if (descripcion.toLowerCase().includes('estudiante')) {
                  tipoReconocimiento = 'Estudiante ejemplar';
                } else {
                  tipoReconocimiento = 'Reconocimiento especial';
                }
                
                // Obtener iniciales para el avatar
                const iniciales = nombreReconocido.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                // Determinar color del badge según el tipo
                const badgeColors = [
                  { class: 'logro-verde', text: 'Por su dedicación y excelencia académica' },
                  { class: 'logro-azul', text: 'Por su participación en proyectos sociales' },
                  { class: 'logro-amarillo', text: 'Por innovación en métodos de enseñanza' }
                ];
                const badgeIndex = reconocimiento.id_comunicacion! % badgeColors.length;
                const badgeColor = badgeColors[badgeIndex];
                
                return (
                  <div key={reconocimiento.id_comunicacion} className="reconocimiento-card">
                    <div className="reconocimiento-header">
                      <h3 className="reconocimiento-nombre">{nombreReconocido}</h3>
                      <div className="reconocimiento-avatar">
                        {iniciales || 'R'}
                      </div>
                    </div>
                    <p className="reconocimiento-rol">
                      {tipoReconocimiento}
                    </p>
                    <div className={`reconocimiento-logro ${badgeColor.class}`}>
                      {descripcion.length > 120 ? descripcion.substring(0, 120) + '...' : descripcion}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="reconocimientos-nota">
              <strong>Nota:</strong> Esta galería muestra los reconocimientos seleccionados por el administrador. 
              Aquí aparecerán los reconocimientos reales que hayan sido aprobados y marcados para mostrar públicamente.
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default Reconocimientos;
