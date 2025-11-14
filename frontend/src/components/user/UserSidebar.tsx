import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdMail, 
  MdList, 
  MdStar, 
  MdEmail,
  MdLogin,
  MdPersonAdd,
  MdSearch,
  MdClose
} from 'react-icons/md';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import logoIzquierdo from '../../assets/img/logosuperiorizquiero.png';
import './UserSidebar.css';

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const UserSidebar = ({ isOpen = false, onClose }: UserSidebarProps) => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading } = useUsuarioAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    // Cerrar sidebar en móviles al hacer clic en un enlace
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`user-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Botón cerrar para móviles */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
        <MdClose />
      </button>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src={logoIzquierdo} 
            alt="Logo UNACH" 
            className="sidebar-logo-img"
          />
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
          <MdHome className="nav-icon" />
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/buzon" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
          <MdMail className="nav-icon" />
          <span>Buzón</span>
        </NavLink>

        <NavLink to="/seguimiento" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
          <MdList className="nav-icon" />
          <span>Seguimiento</span>
        </NavLink>

        <NavLink to="/reconocimientos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
          <MdStar className="nav-icon" />
          <span>Felicitaciones y Reconocimientos</span>
        </NavLink>

        <NavLink to="/contacto" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
          <MdEmail className="nav-icon" />
          <span>Contacto</span>
        </NavLink>

        <NavLink to="/consulta-folio" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleNavClick}>
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
            <NavLink to="/login" className="nav-item" onClick={handleNavClick}>
              <MdLogin className="nav-icon" />
              <span>Iniciar Sesión</span>
            </NavLink>
            <NavLink to="/register" className="nav-item" onClick={handleNavClick}>
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

