import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'payment' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: Date;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement notification service
    setNotifications([
      {
        id: '1',
        title: 'Order Update',
        message: 'Your order #12345 has been shipped',
        type: 'order_update',
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: '2',
        title: 'New Promotion',
        message: 'Special discount on all electronics!',
        type: 'promotion',
        isRead: false,
        createdAt: new Date(Date.now() - 86400000),
      },
    ]);
    setLoading(false);
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order_update: 'bg-blue-500',
      payment: 'bg-green-500',
      promotion: 'bg-yellow-500',
      system: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Badge>
          {notifications.filter(n => !n.isRead).length} unread
        </Badge>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.isRead ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Badge className={getTypeColor(notification.type)} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

