import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { Order } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const ordersParam = searchParams.get('orders');
  const [order, setOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId || ordersParam) {
      loadOrders();
    }
  }, [orderId, ordersParam]);

  const loadOrders = async () => {
    try {
      if (ordersParam) {
        // Load all orders if multiple were created
        const orderIds = ordersParam.split(',');
        const orders = await Promise.all(
          orderIds.map(id => OrderService.getOrder(id))
        );
        const validOrders = orders.filter(o => o !== null) as Order[];
        setAllOrders(validOrders);
        if (validOrders.length > 0) {
          setOrder(validOrders[0]);
        }
      } else if (orderId) {
        const result = await OrderService.getOrder(orderId);
        setOrder(result);
        if (result) {
          setAllOrders([result]);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(price);
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
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-green-500">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          {allOrders.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Multiple orders created ({allOrders.length} orders)
              </p>
              <p className="text-xs text-blue-700">
                Your cart contained items from different sellers. Separate orders have been created for each seller.
              </p>
            </div>
          )}
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">Order ID{allOrders.length > 1 ? 's' : ''}</p>
            {allOrders.length > 1 ? (
              <div className="space-y-1 mt-2">
                {allOrders.map((o, idx) => (
                  <p key={o.id} className="font-mono font-bold text-sm">
                    {idx + 1}. {o.id.slice(0, 8)}... ({formatPrice(o.totalAmount)})
                  </p>
                ))}
              </div>
            ) : (
              <p className="font-mono font-bold">{order.id}</p>
            )}
          </div>
          <div className="space-y-2 mb-6">
            {allOrders.length > 1 ? (
              <>
                <p><span className="font-semibold">Total for all orders:</span> {formatPrice(allOrders.reduce((sum, o) => sum + o.totalAmount, 0))}</p>
                <p><span className="font-semibold">Status:</span> {order.status.replace('_', ' ').toUpperCase()}</p>
              </>
            ) : (
              <>
                <p><span className="font-semibold">Total:</span> {formatPrice(order.totalAmount)}</p>
                <p><span className="font-semibold">Status:</span> {order.status.replace('_', ' ').toUpperCase()}</p>
              </>
            )}
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate(`/order/${order.id}`)}>
              Track Order
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/orders')}>
              View All Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmation;

