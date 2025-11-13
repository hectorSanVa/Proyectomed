import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserLayout from '../components/user/UserLayout';
import { comunicacionService } from '../services/comunicacionService';
import { seguimientoService } from '../services/seguimientoService';
import { estadoService } from '../services/estadoService';
import type { Comunicacion, Estado, Seguimiento } from '../types';
import './ConsultaFolio.css';

const ConsultaFolio = () => {
  const [searchParams] = useSearchParams();
  const folioFromUrl = searchParams.get('folio') || '';
  
  const [folio, setFolio] = useState(folioFromUrl);
  const [comunicacion, setComunicacion] = useState<Comunicacion | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar automáticamente si viene el folio en la URL
  useEffect(() => {
    if (folioFromUrl && folioFromUrl.trim()) {
      handleBuscar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = async () => {
    if (!folio.trim()) {
      setError('Por favor, ingrese un folio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await comunicacionService.getByFolio(folio.trim());
      
      if (resultado) {
        setComunicacion(resultado);
        
        // Obtener estado real del seguimiento
        try {
          const seguimientoData = await seguimientoService.getByComunicacionId(resultado.id_comunicacion!);
          if (seguimientoData) {
            setSeguimiento(seguimientoData);
            const estados = await estadoService.getAll();
            const estadoEncontrado = estados.find((e: Estado) => e.id_estado === seguimientoData.id_estado);
            setEstado(estadoEncontrado || null);
          } else {
            // Si no hay seguimiento, buscar estado "Pendiente"
            setSeguimiento(null);
            const estados = await estadoService.getAll();
            const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
            setEstado(pendiente || null);
          }
        } catch {
          // Si hay error al cargar el estado, usar "Pendiente" por defecto
          setSeguimiento(null);
          const estados = await estadoService.getAll();
          const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
          setEstado(pendiente || null);
        }
      } else {
        setError('No se encontró ninguna comunicación con ese folio');
        setComunicacion(null);
        setEstado(null);
        setSeguimiento(null);
      }
    } catch (err: any) {
      setError('Error al buscar el folio. Por favor, intente nuevamente.');
      setComunicacion(null);
      setEstado(null);
      setSeguimiento(null);
    } finally {
      setLoading(false);
    }
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

  return (
    <UserLayout>
      <div className="consulta-container">
        <div className="consulta-main">
        <div className="consulta-wrapper">
          <h1 className="consulta-title">Consulta de Folio</h1>
          <p className="consulta-subtitle">
            Ingrese su folio para consultar el estado de su queja, sugerencia o reconocimiento
          </p>

          <div className="busqueda-section">
            <div className="busqueda-input-group">
              <input
                type="text"
                placeholder="Ej: D0001/01/FMHT/25"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                className="folio-input"
              />
              <button
                onClick={handleBuscar}
                disabled={loading}
                className="btn-buscar"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {comunicacion && (
            <div className="resultado-section">
              <h2 className="resultado-title">Información de su Comunicación</h2>
              
              <div className="resultado-card">
                <div className="resultado-row">
                  <span className="resultado-label">Folio:</span>
                  <span className="resultado-value folio">{comunicacion.folio}</span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Tipo:</span>
                  <span className="resultado-value tipo">{comunicacion.tipo}</span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Fecha de Recepción:</span>
                  <span className="resultado-value">
                    {comunicacion.fecha_recepcion 
                      ? new Date(comunicacion.fecha_recepcion).toLocaleDateString('es-MX')
                      : 'No disponible'}
                  </span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Estado:</span>
                  <span className={`resultado-value estado ${estado?.nombre_estado?.toLowerCase().replace(' ', '-') || 'pendiente'}`}>
                    {estado?.nombre_estado || 'Pendiente'}
                  </span>
                </div>

                {comunicacion.area_involucrada && (
                  <div className="resultado-row">
                    <span className="resultado-label">Área Involucrada:</span>
                    <span className="resultado-value">{comunicacion.area_involucrada}</span>
                  </div>
                )}

                <div className="resultado-row full-width">
                  <span className="resultado-label">Descripción:</span>
                  <div className="resultado-description">
                    {comunicacion.descripcion}
                  </div>
                </div>

                {/* Mostrar notas/comentarios si el estado es Atendida o Cerrada y hay notas */}
                {estado && (estado.nombre_estado === 'Atendida' || estado.nombre_estado === 'Cerrada') && 
                 seguimiento?.notas && seguimiento.notas.trim().length > 0 && (
                  <div className="resultado-row full-width">
                    <span className="resultado-label">Respuesta/Comentarios:</span>
                    <div className="resultado-respuesta">
                      <div className="respuesta-content">
                        {seguimiento.notas}
                      </div>
                      {seguimiento.fecha_resolucion && (
                        <div className="respuesta-fecha">
                          Resuelto el: {formatFecha(seguimiento.fecha_resolucion)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mostrar mensaje si está atendida/cerrada pero sin notas */}
                {estado && (estado.nombre_estado === 'Atendida' || estado.nombre_estado === 'Cerrada') && 
                 (!seguimiento?.notas || !seguimiento.notas.trim()) && (
                  <div className="resultado-row full-width">
                    <span className="resultado-label">Respuesta/Comentarios:</span>
                    <div className="resultado-sin-respuesta">
                      Sin comentarios disponibles aún.
                    </div>
                  </div>
                )}
              </div>

              <div className="resultado-nota">
                <p>
                  <strong>Nota:</strong> Para más información sobre el seguimiento de su caso, 
                  puede comunicarse al correo: <strong>quejasysugerenciasfmht@unach.mx</strong>
                </p>
              </div>
            </div>
          )}

          <div className="consulta-info">
            <h3>¿No tiene su folio?</h3>
            <p>
              Si no recuerda su folio, puede contactarnos directamente al correo: 
              <strong> quejasysugerenciasfmht@unach.mx</strong>
            </p>
          </div>
        </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ConsultaFolio;

