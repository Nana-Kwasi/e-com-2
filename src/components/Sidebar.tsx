import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, HelpCircle } from 'lucide-react';
import { useDrawer } from '../contexts/DrawerContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, closeDrawer } = useDrawer();

  const hideSidebar = ['/login', '/signup'].includes(location.pathname);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (hideSidebar) return null;

  const categories = [
    'Electronics', 'Clothing', 'Shoes', 'Food', 'Home & Garden',
    'Sports', 'Books', 'Beauty', 'Automotive'
  ];

  const menuItems = [
    { icon: HelpCircle, label: 'Support', path: '/support' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background border-r z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDrawer}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories Section */}
          <div>
            <h3 className="text-sm font-semibold mb-2 px-2 text-muted-foreground">CATEGORIES</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={isActive(`/category/${category.toLowerCase()}`) ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavigate(`/category/${category.toLowerCase()}`)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2 px-2 text-muted-foreground">HELP</h3>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

