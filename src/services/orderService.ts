import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderItem, Address, CartItem } from '../types';

export class OrderService {
  static async createOrder(
    buyerId: string,
    sellerId: string,
    items: CartItem[],
    shippingAddress: Address,
    paymentMethod: string
  ): Promise<string> {
    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      price: item.product.discount
        ? item.product.price * (1 - item.product.discount / 100)
        : item.product.price,
      totalPrice: (item.product.discount
        ? item.product.price * (1 - item.product.discount / 100)
        : item.product.price) * item.quantity,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Generate unique Order ID: amansan + four digit unique numbers
    const random = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const uniqueOrderId = `amansan${random}`;

    const orderData = {
      buyerId,
      sellerId,
      orderId: uniqueOrderId,
      products: orderItems,
      totalAmount,
      status: 'order_received',
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    await this.createPayment(docRef.id, buyerId, sellerId, totalAmount, paymentMethod);
    
    return docRef.id;
  }

  static async createPayment(
    orderId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    // Create payment record
    await addDoc(collection(db, 'payments'), {
      orderId,
      buyerId,
      sellerId,
      amount,
      status: 'completed',
      paymentMethod,
      createdAt: Timestamp.now(),
      processedAt: Timestamp.now(),
    });
    
    // Update order payment status
    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: 'completed',
      updatedAt: Timestamp.now(),
    });
  }

  static async getOrder(id: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Check payment status from payments collection
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('orderId', '==', id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      let paymentStatus = data.paymentStatus || 'pending';
      if (paymentsSnapshot.docs.length > 0) {
        const paymentData = paymentsSnapshot.docs[0].data();
        paymentStatus = paymentData.status || 'pending';
        
        // Update order if payment status is different
        if (paymentStatus !== data.paymentStatus) {
          await updateDoc(docRef, {
            paymentStatus: paymentStatus,
            updatedAt: Timestamp.now(),
          });
        }
      }
      
      return {
        id: docSnap.id,
        orderId: data.orderId || docSnap.id,
        ...data,
        paymentStatus: paymentStatus,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        estimatedDelivery: data.estimatedDelivery?.toDate(),
      } as Order;
    }
    return null;
  }

  static async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    const snapshot = await getDocs(
      query(collection(db, 'orders'), where('buyerId', '==', buyerId))
    );

    const orders = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        orderId: data.orderId || docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        estimatedDelivery: data.estimatedDelivery?.toDate(),
      } as Order;
    });

    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
    const docRef = doc(db, 'orders', orderId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          orderId: data.orderId || docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          estimatedDelivery: data.estimatedDelivery?.toDate(),
        } as Order);
      } else {
        callback(null);
      }
    });
  }

  static subscribeToBuyerOrders(buyerId: string, callback: (orders: Order[]) => void) {
    const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              estimatedDelivery: data.estimatedDelivery?.toDate(),
            } as Order;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        callback(orders);
      },
      (error) => {
        console.error('Error in order subscription:', error);
      }
    );
  }
}

