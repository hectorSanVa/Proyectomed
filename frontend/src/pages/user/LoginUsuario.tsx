import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import UserLayout from '../../components/user/UserLayout';
import './LoginUsuario.css';

const LoginUsuario = () => {
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
      console.log('🚀 Iniciando proceso de login...');
      await login(correo);
      console.log('✅ Login exitoso, redirigiendo...');
      navigate('/buzon');
    } catch (err: any) {
      console.error('❌ Error en handleSubmit:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="login-usuario-container">
        <div className="login-card">
          <h1>Iniciar Sesión</h1>
          <p className="login-subtitle">Ingresa tu correo electrónico para acceder al formulario</p>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
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
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-info">
              Ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx) para acceder al sistema.
              También puedes enviar comunicaciones de forma anónima sin iniciar sesión.
            </p>
            <p className="admin-link">
              <Link to="/admin/login">Acceso Administrativo</Link>
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default LoginUsuario;
