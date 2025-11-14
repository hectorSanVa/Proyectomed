import type { ReactNode } from 'react';
import UserSidebar from './UserSidebar';
import Header from '../Header';
import Footer from '../Footer';
import './UserLayout.css';

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  return (
    <div className="user-layout">
      <UserSidebar />
      <div className="user-content">
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

