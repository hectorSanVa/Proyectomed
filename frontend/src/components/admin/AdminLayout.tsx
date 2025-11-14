import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import Footer from '../Footer';
import { MdMenu, MdClose } from 'react-icons/md';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
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
    <div className="admin-layout">
      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={handleOverlayClick}></div>
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="admin-content-wrapper">
        {/* Botón hamburguesa para móviles */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <MdClose /> : <MdMenu />}
        </button>
        
        <AdminHeader />
        <main className="admin-main">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;



