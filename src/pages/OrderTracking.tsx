import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle2, Circle } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { Order } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
      const unsubscribe = OrderService.subscribeToOrder(id, (updatedOrder) => {
        setOrder(updatedOrder);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const result = await OrderService.getOrder(id!);
      setOrder(result);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(price);
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'order_received', label: 'Order Received' },
      { key: 'processing', label: 'Processing' },
      { key: 'on_the_way', label: 'On the Way' },
      { key: 'delivered', label: 'Delivered' },
    ];

    const currentIndex = steps.findIndex(s => s.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">Go to Orders</Button>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Tracking</h1>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Order Status</h3>
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : step.current ? (
                      <Circle className="h-6 w-6 text-primary fill-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${step.current ? 'text-primary' : step.completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                {order.shippingAddress.zipCode}, {order.shippingAddress.country}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Payment Method:</span> {order.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                <p>
                  <span className="text-muted-foreground">Payment Status:</span>{' '}
                  <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'outline'} className="ml-2">
                    {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus?.toUpperCase() || 'Pending'}
                  </Badge>
                </p>
                <p><span className="text-muted-foreground">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                {order.trackingNumber && (
                  <p><span className="text-muted-foreground">Tracking:</span> {order.trackingNumber}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">Products</h3>
            <div className="space-y-2">
              {order.products.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.images[0] || '/placeholder-image.jpg'}
                      alt={item.product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <p className="font-semibold">{item.product.title}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t">
              <p className="text-lg font-bold">Total:</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;

