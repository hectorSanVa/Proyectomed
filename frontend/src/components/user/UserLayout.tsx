import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import UserSidebar from './UserSidebar';
import Header from '../Header';
import Footer from '../Footer';
import { MdMenu, MdClose } from 'react-icons/md';
import './UserLayout.css';

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar cuando se hace clic fuera en móviles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar al hacer clic en overlay
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="user-layout">
      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={handleOverlayClick}></div>
      )}
      
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="user-content">
        {/* Botón hamburguesa para móviles */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <MdClose /> : <MdMenu />}
        </button>
        
        <Header subtitle="Campus IV" showAdminButton={true} />
        <main className="user-main">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;

