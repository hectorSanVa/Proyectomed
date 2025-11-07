import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { MdSettings, MdSave, MdCheckCircle, MdError } from 'react-icons/md';
import './GestionComunicaciones.css';

interface ConfigData {
  nombreSistema: string;
  emailContacto: string;
  tiempoRespuesta: number;
  notificacionesEmail: boolean;
}

const Configuracion = () => {
  const [config, setConfig] = useState<ConfigData>({
    nombreSistema: 'Buzón de Quejas, Sugerencias y Reconocimientos',
    emailContacto: 'quejasysugerenciasfmht@unach.mx',
    tiempoRespuesta: 10,
    notificacionesEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem('sistema_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }, []);

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

      // Guardar en localStorage (puede mejorarse con backend)
      localStorage.setItem('sistema_config', JSON.stringify(config));
      
      // Simular guardado en backend (puede implementarse después)
      await new Promise(resolve => setTimeout(resolve, 500));

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      
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
                />
              </div>

              <div className="form-group">
                <label>Email de Contacto</label>
                <input
                  type="email"
                  value={config.emailContacto}
                  onChange={(e) => setConfig({ ...config, emailContacto: e.target.value })}
                  placeholder="email@ejemplo.com"
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
                />
                <small>Días hábiles esperados para responder a una comunicación</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.notificacionesEmail}
                    onChange={(e) => setConfig({ ...config, notificacionesEmail: e.target.checked })}
                  />
                  <span>Habilitar notificaciones por email</span>
                </label>
              </div>

              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <MdSave />
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="config-section">
            <h2>Información del Sistema</h2>
            <div className="info-box">
              <p><strong>Versión:</strong> 1.0.0</p>
              <p><strong>Base de Datos:</strong> PostgreSQL</p>
              <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX')}</p>
              <p><strong>Nota:</strong> La configuración se guarda localmente. Para persistencia en servidor, se requiere implementar el backend correspondiente.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Configuracion;
