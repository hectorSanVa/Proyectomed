import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import UserLayout from '../../components/user/UserLayout';
import './RegisterUsuario.css';

const RegisterUsuario = () => {
  const navigate = useNavigate();
  const { login } = useUsuarioAuth();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(correo);
      navigate('/buzon');
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="register-usuario-container">
        <div className="register-card">
          <h1>Registrarse</h1>
          <p className="register-subtitle">Ingresa tu correo electrónico para acceder al formulario</p>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                type="email"
                id="correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="tucorreo@unach.mx"
              />
            </div>

            <button
              type="submit"
              className="btn-register"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Continuar'}
            </button>
          </form>

          <div className="register-footer">
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
            <p className="register-info">
              Nota: Ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx).
              Tu información se guardará automáticamente cuando envíes un formulario.
              También puedes enviar de forma anónima sin registrarte.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default RegisterUsuario;
