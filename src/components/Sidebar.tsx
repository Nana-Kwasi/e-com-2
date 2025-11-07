import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Search, Heart, Package, User, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getTotalItems } = useCart();

  // Hide sidebar on auth pages
  const hideSidebar = ['/login', '/signup'].includes(location.pathname);
  
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

  return (
    <aside className="w-64 bg-background border-r min-h-screen fixed left-0 top-16 z-40">
      <div className="p-4 space-y-4">
        {/* Categories Section */}
        <div>
          <h3 className="text-sm font-semibold mb-2 px-2 text-muted-foreground">CATEGORIES</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={isActive(`/category/${category.toLowerCase()}`) ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => navigate(`/category/${category.toLowerCase()}`)}
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
                  onClick={() => navigate(item.path)}
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
  );
};

export default Sidebar;

