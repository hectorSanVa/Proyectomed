import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdWarning, 
  MdLightbulb, 
  MdStar, 
  MdBarChart, 
  MdSettings,
  MdHome,
  MdExitToApp
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text">UNACH</span>
          <span className="logo-admin">ADMIN</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdDashboard className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/quejas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdWarning className="nav-icon" />
          <span>Gestión de Quejas</span>
        </NavLink>

        <NavLink to="/admin/sugerencias" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdLightbulb className="nav-icon" />
          <span>Gestión de Sugerencias</span>
        </NavLink>

        <NavLink to="/admin/reconocimientos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdStar className="nav-icon" />
          <span>Gestión de Reconocimientos</span>
        </NavLink>

        <NavLink to="/admin/reportes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdBarChart className="nav-icon" />
          <span>Reportes y Estadísticas</span>
        </NavLink>

        <NavLink to="/admin/configuracion" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MdSettings className="nav-icon" />
          <span>Configuración</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="nav-item">
          <MdHome className="nav-icon" />
          <span>Volver al Sitio</span>
        </NavLink>
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <MdExitToApp className="nav-icon" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

