import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import Footer from '../Footer';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <AdminHeader />
      <main className="admin-main">
        {children}
        <Footer />
      </main>
    </div>
  );
};

export default AdminLayout;



