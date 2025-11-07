import { useState } from 'react';
import UserLayout from '../../components/user/UserLayout';
import { MdSend, MdCheckCircle, MdError } from 'react-icons/md';
import './Contacto.css';

const Contacto = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!formData.correo.trim() || !formData.correo.includes('@')) {
        throw new Error('El correo electrónico debe ser válido');
      }
      if (!formData.mensaje.trim() || formData.mensaje.length < 10) {
        throw new Error('El mensaje debe tener al menos 10 caracteres');
      }

      // Simular envío (puede implementarse con backend después)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aquí se podría enviar a un endpoint del backend
      // await contactoService.send(formData);

      setMessage({ 
        type: 'success', 
        text: '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.' 
      });

      // Limpiar formulario
      setFormData({
        nombre: '',
        correo: '',
        mensaje: '',
      });

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="contacto-container">
        <h1>Contacto</h1>
        <p className="contacto-subtitle">
          ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ayudarte.
        </p>
        
        {message && (
          <div className={`contacto-message ${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <MdCheckCircle /> : <MdError />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="contacto-form-card">
          <form onSubmit={handleSubmit} className="contacto-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo *</label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre completo"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo electrónico *</label>
              <input
                type="email"
                id="correo"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="tucorreo@ejemplo.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mensaje">Mensaje *</label>
              <textarea
                id="mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                rows={6}
                placeholder="Escribe tu mensaje aquí..."
                required
                disabled={loading}
              />
              <small>Mínimo 10 caracteres</small>
            </div>

            <button 
              type="submit" 
              className="btn-enviar"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Enviando...
                </>
              ) : (
                <>
                  <MdSend />
                  Enviar Mensaje
                </>
              )}
            </button>
          </form>

          <div className="contacto-nota">
            <p><strong>Información de contacto directo:</strong></p>
            <p className="contacto-email">
              Email: <strong>quejasysugerenciasfmht@unach.mx</strong>
            </p>
            <p className="contacto-info">
              También puedes usar el buzón de quejas, sugerencias y reconocimientos 
              para enviar tu mensaje de forma oficial.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Contacto;
