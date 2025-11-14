import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdWarning,
  MdLightbulb,
  MdStar,
  MdBarChart,
  MdList,
  MdSettings,
  MdHome,
  MdExitToApp,
  MdClose,
  MdPeople, // <-- 1. (Opcional) Icono para 'Gestión de Admins'
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import logoIzquierdo from "../../assets/img/logosuperiorizquiero.png";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  // --- 2. Obtener el 'user' y 'logout' de useAuth ---
  const { logout, user } = useAuth(); // <-- 'user' ha sido añadido

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    // Cerrar sidebar en móviles al hacer clic en un enlace
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "sidebar-open" : ""}`}>
      {/* Botón cerrar para móviles */}{" "}
      <button
        className="sidebar-close-btn"
        onClick={onClose}
        aria-label="Cerrar menú"
      >
        {" "}
        <MdClose />{" "}
      </button>{" "}
      <div className="sidebar-header">
        {" "}
        <div className="sidebar-logo">
          {" "}
          <img
            src={logoIzquierdo}
            alt="Logo UNACH"
            className="sidebar-logo-img"
          />
          <span className="logo-admin">ADMIN</span>{" "}
        </div>{" "}
      </div>{" "}
      <nav className="sidebar-nav">
        {/* --- Estos enlaces son visibles para todos los roles --- */}{" "}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdDashboard className="nav-icon" /> <span>Dashboard</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/admin/quejas"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdWarning className="nav-icon" /> <span>Gestión de Quejas</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/admin/sugerencias"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdLightbulb className="nav-icon" />{" "}
          <span>Gestión de Sugerencias</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/admin/reconocimientos"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdStar className="nav-icon" />{" "}
          <span>Felicitaciones y Reconocimientos</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/admin/reportes"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdBarChart className="nav-icon" />{" "}
          <span>Reportes y Estadísticas</span>{" "}
        </NavLink>{" "}
        <NavLink
          to="/admin/concentrado-seguimiento"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          onClick={handleNavClick}
        >
          <MdList className="nav-icon" />{" "}
          <span>Concentrado de Seguimiento</span>{" "}
        </NavLink>
        {/* --- 3. INICIO: Enlaces solo para 'admin' --- */}
        {/* Verificamos que 'user' exista y que 'user.rol' sea 'admin' */}
        {user && user.rol === "admin" && (
          <>
            {/* Separador visual */}
            <hr className="nav-separator" />{" "}
            <NavLink
              to="/admin/configuracion"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClick}
            >
              <MdSettings className="nav-icon" /> <span>Configuración</span>{" "}
            </NavLink>
            {/* --- 4. AÑADIR EL NUEVO ENLACE AQUÍ --- */}
            <NavLink
              to="/admin/gestion-admins"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClick}
            >
              <MdPeople className="nav-icon" />
              <span>Gestión de Admins</span>
            </NavLink>
          </>
        )}
        {/* --- FIN: Enlaces solo para 'admin' --- */}{" "}
      </nav>{" "}
      <div className="sidebar-footer">
        {" "}
        <NavLink to="/" className="nav-item" onClick={handleNavClick}>
          <MdHome className="nav-icon" /> <span>Volver al Sitio</span>{" "}
        </NavLink>{" "}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <MdExitToApp className="nav-icon" /> <span>Cerrar Sesión</span>{" "}
        </button>{" "}
      </div>{" "}
    </aside>
  );
};

export default Sidebar;
