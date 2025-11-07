import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideSidebar = ['/login', '/signup'].includes(location.pathname);
  
  return (
    <div className="flex relative">
      <Sidebar />
      <main 
        className="flex-1 container mx-auto px-4 py-8 transition-all duration-300"
        style={{ marginLeft: hideSidebar ? '0' : '16rem' }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;

