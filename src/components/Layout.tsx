import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex relative">
      <Sidebar />
      <main className="flex-1 container mx-auto px-4 py-8 w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;

