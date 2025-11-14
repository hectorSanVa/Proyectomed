import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { MdSave, MdCheckCircle, MdError, MdCloud, MdStorage, MdUpdate } from 'react-icons/md';
import { configuracionService } from '../../services/configuracionService';
import type { ConfigData } from '../../types';
import './GestionComunicaciones.css';

const Configuracion = () => {
  const [config, setConfig] = useState<ConfigData>({
    nombreSistema: 'Buzón de Quejas, Sugerencias y Reconocimientos',
    emailContacto: 'quejasysugerenciasfmht@unach.mx',
    tiempoRespuesta: 10,
    notificacionesEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemInfo, setSystemInfo] = useState<{
    version: string;
    database: string;
    backendUrl: string;
    lastUpdate: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
    loadSystemInfo();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await configuracionService.getConfigData();
      setConfig(data);
    } catch (error: any) {
      console.error('Error al cargar configuración:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al cargar la configuración desde el servidor. Usando valores por defecto.' 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadSystemInfo = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'https://buzon-unach-backend.onrender.com';
    setSystemInfo({
      version: '1.0.0',
      database: 'PostgreSQL',
      backendUrl: backendUrl,
      lastUpdate: new Date().toLocaleDateString('es-MX'),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Validaciones
      if (!config.nombreSistema.trim()) {
        throw new Error('El nombre del sistema es requerido');
      }
      if (!config.emailContacto.trim() || !config.emailContacto.includes('@')) {
        throw new Error('El email de contacto debe ser válido');
      }
      if (config.tiempoRespuesta < 1 || config.tiempoRespuesta > 365) {
        throw new Error('El tiempo de respuesta debe estar entre 1 y 365 días');
      }

      // Guardar en el servidor
      const updatedConfig = await configuracionService.updateConfigData(config);
      setConfig(updatedConfig);

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente en el servidor' });
      
      // Actualizar fecha de última actualización
      setSystemInfo(prev => prev ? {
        ...prev,
        lastUpdate: new Date().toLocaleDateString('es-MX')
      } : null);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="gestion-container">
        <div className="gestion-header">
          <h1>Configuración</h1>
          <p>Configura los parámetros del sistema</p>
        </div>

        {message && (
          <div className={`config-message ${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <MdCheckCircle /> : <MdError />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="config-content">
          <div className="config-section">
            <h2>Configuración General</h2>
            <div className="config-form">
              <div className="form-group">
                <label>Nombre del Sistema</label>
                <input
                  type="text"
                  value={config.nombreSistema}
                  onChange={(e) => setConfig({ ...config, nombreSistema: e.target.value })}
                  placeholder="Nombre del sistema"
                  disabled={loadingConfig}
                />
              </div>

              <div className="form-group">
                <label>Email de Contacto</label>
                <input
                  type="email"
                  value={config.emailContacto}
                  onChange={(e) => setConfig({ ...config, emailContacto: e.target.value })}
                  placeholder="email@ejemplo.com"
                  disabled={loadingConfig}
                />
              </div>

              <div className="form-group">
                <label>Tiempo de Respuesta (días hábiles)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={config.tiempoRespuesta}
                  onChange={(e) => setConfig({ ...config, tiempoRespuesta: parseInt(e.target.value) || 10 })}
                  disabled={loadingConfig}
                />
                <small>Días hábiles esperados para responder a una comunicación</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.notificacionesEmail}
                    onChange={(e) => setConfig({ ...config, notificacionesEmail: e.target.checked })}
                    disabled={loadingConfig}
                  />
                  <span>Habilitar notificaciones por email</span>
                </label>
              </div>

              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={loading || loadingConfig}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Guardando en el servidor...
                  </>
                ) : (
                  <>
                    <MdSave />
                    Guardar Configuración en el Servidor
                  </>
                )}
              </button>
              {loadingConfig && (
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Cargando configuración desde el servidor...
                </p>
              )}
            </div>
          </div>

          <div className="config-section">
            <h2>Información del Sistema</h2>
            <div className="info-box">
              <p>
                <strong><MdUpdate style={{ marginRight: '8px', verticalAlign: 'middle' }} />Versión:</strong> 
                {' '}{systemInfo?.version || '1.0.0'}
              </p>
              <p>
                <strong><MdStorage style={{ marginRight: '8px', verticalAlign: 'middle' }} />Base de Datos:</strong> 
                {' '}{systemInfo?.database || 'PostgreSQL'}
              </p>
              <p>
                <strong><MdCloud style={{ marginRight: '8px', verticalAlign: 'middle' }} />Backend:</strong> 
                {' '}
                <a href={systemInfo?.backendUrl} target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#1976d2', textDecoration: 'none' }}>
                  {systemInfo?.backendUrl || 'https://buzon-unach-backend.onrender.com'}
                </a>
              </p>
              <p>
                <strong>Última actualización:</strong> 
                {' '}{systemInfo?.lastUpdate || new Date().toLocaleDateString('es-MX')}
              </p>
              <p style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: '#e8f5e9', 
                borderRadius: '6px', 
                borderLeft: '4px solid #4caf50',
                fontSize: '0.9rem',
                color: '#2e7d32'
              }}>
                <strong>✅ Estado:</strong> La configuración se guarda en el servidor (base de datos PostgreSQL). 
                Todos los cambios son persistentes y se sincronizan automáticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Configuracion;
