import { MdLock, MdEmojiEvents } from 'react-icons/md';
import './AdminHeader.css';

const AdminHeader = () => {
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <span className="header-logo-text">UNACH</span>
          <span className="header-admin-text">ADMIN</span>
        </div>
        <div className="admin-header-center">
          <h1 className="header-title">
            Facultad de Medicina Humana "Dr. Manuel Velasco Suárez"
          </h1>
          <p className="header-motto">Educación que transforma</p>
        </div>
        <div className="admin-header-right">
          <button className="admin-btn">
            <MdLock className="btn-icon" />
            Administración
          </button>
          <div className="jubileo-badge">
            <MdEmojiEvents className="badge-icon" />
            <span>Jubileo 50 años</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

