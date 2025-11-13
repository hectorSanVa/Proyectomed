import './Semaforo.css';

export type EstadoSemaforo = 'recibido' | 'pendiente' | 'atendido';

interface SemaforoProps {
  estado: EstadoSemaforo;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Componente de semáforo visual para mostrar el estado de las comunicaciones
 * - Recibido (rojo): La comunicación ha sido recibida pero no revisada
 * - Pendiente (amarillo): La comunicación está en proceso de revisión
 * - Atendido (verde): La comunicación ha sido atendida o cerrada
 */
const Semaforo = ({ estado, showLabel = true, size = 'medium', className = '' }: SemaforoProps) => {
  const estados: Record<EstadoSemaforo, { label: string; color: string }> = {
    recibido: { label: 'Recibido', color: '#dc3545' }, // Rojo
    pendiente: { label: 'Pendiente', color: '#ffc107' }, // Amarillo
    atendido: { label: 'Atendido', color: '#28a745' }, // Verde
  };

  const estadoInfo = estados[estado];

  return (
    <div className={`semaforo-container ${size} ${className}`}>
      <div className="semaforo-visual">
        <div 
          className={`semaforo-luz luz-roja ${estado === 'recibido' ? 'activa' : 'inactiva'}`}
          title="Recibido"
        />
        <div 
          className={`semaforo-luz luz-amarilla ${estado === 'pendiente' ? 'activa' : 'inactiva'}`}
          title="Pendiente"
        />
        <div 
          className={`semaforo-luz luz-verde ${estado === 'atendido' ? 'activa' : 'inactiva'}`}
          title="Atendido"
        />
      </div>
      {showLabel && (
        <span className="semaforo-label" style={{ color: estadoInfo.color }}>
          {estadoInfo.label}
        </span>
      )}
    </div>
  );
};

/**
 * Función auxiliar para mapear estados de la base de datos a estados del semáforo
 */
export const mapEstadoToSemaforo = (nombreEstado: string): EstadoSemaforo => {
  const estadoLower = nombreEstado.toLowerCase();
  
  if (estadoLower === 'pendiente') {
    return 'recibido';
  } else if (estadoLower === 'en proceso') {
    return 'pendiente';
  } else if (estadoLower === 'atendida' || estadoLower === 'cerrada') {
    return 'atendido';
  }
  
  // Por defecto, si no se reconoce, se considera recibido
  return 'recibido';
};

export default Semaforo;




