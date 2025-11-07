import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdMail, 
  MdList, 
  MdStar, 
  MdEmail,
  MdLogin,
  MdPersonAdd,
  MdSearch
} from 'react-icons/md';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import './UserSidebar.css';

const UserSidebar = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading } = useUsuarioAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="user-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text">FMH</span>
          <span className="logo-unach">UNACH</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdHome className="nav-icon" />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/buzon" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdMail className="nav-icon" />
          <span>Buzón</span>
        </NavLink>

        <NavLink to="/seguimiento" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdList className="nav-icon" />
          <span>Seguimiento</span>
        </NavLink>

        <NavLink to="/reconocimientos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdStar className="nav-icon" />
          <span>Reconocimientos</span>
        </NavLink>

        <NavLink to="/contacto" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdEmail className="nav-icon" />
          <span>Contacto</span>
        </NavLink>

        <NavLink to="/consulta-folio" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdSearch className="nav-icon" />
          <span>Consultar Folio</span>
        </NavLink>
      </nav>

      <div className="sidebar-access">
        <div className="access-label">ACCESO</div>
        {loading ? (
          <div className="nav-item">
            <span>Cargando...</span>
          </div>
        ) : isAuthenticated ? (
          <>
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <MdLogin className="nav-icon" />
              <span>Cerrar Sesión</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-item">
              <MdLogin className="nav-icon" />
              <span>Iniciar Sesión</span>
            </NavLink>
            <NavLink to="/register" className="nav-item">
              <MdPersonAdd className="nav-icon" />
              <span>Registrarse</span>
            </NavLink>
          </>
        )}
      </div>
    </aside>
  );
};

export default UserSidebar;

