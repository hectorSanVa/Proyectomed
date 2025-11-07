import React from 'react';
import { Link } from 'react-router-dom';
import { MdLock, MdEmojiEvents } from 'react-icons/md';
import './Header.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showAdminButton?: boolean;
}

const Header = ({ title, subtitle, showAdminButton = true }: HeaderProps) => {
  return (
    <header className="header-unach">
      <div className="header-content">
        <div className="header-left">
          <span className="header-logo-text">Logo UNACH</span>
        </div>
        <div className="header-center">
          <h1 className="header-title-text">
            {title || "Facultad de Medicina Humana \"Dr. Manuel Velasco Suárez\""}
          </h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
          <p className="header-motto">Educación que transforma</p>
        </div>
        {showAdminButton && (
          <div className="header-right">
            <Link to="/admin/login" className="admin-button">
              <MdLock className="btn-icon" />
              Administración
            </Link>
            <div className="jubileo-badge">
              <MdEmojiEvents className="badge-icon" />
              <span>Jubileo 50 años</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

