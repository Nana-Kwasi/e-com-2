import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  setDoc,
} from 'firebase/firestore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'payment' | 'promotion' | 'system' | 'seller_announcement';
  targetAudience: 'all' | 'buyers' | 'sellers' | string[];
  createdBy?: string;
  isRead?: boolean;
  userId?: string;
  data?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export const NotificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const notificationData = {
      ...notification,
      createdAt: Timestamp.now(),
      expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
    };
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    const notificationId = docRef.id;
    
    if (notification.targetAudience === 'all' || notification.targetAudience === 'buyers' || notification.targetAudience === 'sellers') {
      await this.broadcastToUsers({ ...notificationData, id: notificationId }, notification.targetAudience);
    }
    
    return notificationId;
  },

  async broadcastToUsers(notification: any, audience: string | string[]): Promise<void> {
    if (audience === 'all') {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const batch = usersSnapshot.docs.map(userDoc => {
        const userNotification = {
          ...notification,
          userId: userDoc.id,
          isRead: false,
        };
        return setDoc(doc(db, 'userNotifications', `${userDoc.id}_${notification.id}`), userNotification);
      });
      
      await Promise.all(batch);
    } else if (audience === 'buyers' || audience === 'sellers') {
      const role = audience === 'buyers' ? 'buyer' : 'seller';
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', role)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      const batch = usersSnapshot.docs.map(userDoc => {
        const userNotification = {
          ...notification,
          userId: userDoc.id,
          isRead: false,
        };
        return setDoc(doc(db, 'userNotifications', `${userDoc.id}_${notification.id}`), userNotification);
      });
      
      await Promise.all(batch);
    }
  },

  async getUserNotifications(userId: string, limitCount?: number): Promise<Notification[]> {
    let q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id.split('_')[1] || doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate(),
    })) as Notification[];
    
    return notifications.filter(n => !n.expiresAt || n.expiresAt > new Date());
  },

  async getSellerNotifications(sellerId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('createdBy', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate(),
    })) as Notification[];
  },

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notificationRef = doc(db, 'userNotifications', `${userId}_${notificationId}`);
    const notificationDoc = await getDoc(notificationRef);
    if (notificationDoc.exists()) {
      await updateDoc(notificationRef, { isRead: true });
    } else {
      const q = query(
        collection(db, 'userNotifications'),
        where('userId', '==', userId),
        where('id', '==', notificationId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, { isRead: true });
      }
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    await Promise.all(updates);
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, 'notifications', notificationId));
    
    const q = query(collection(db, 'userNotifications'));
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs
      .filter(doc => doc.id.endsWith(`_${notificationId}`) || doc.data().id === notificationId)
      .map(doc => deleteDoc(doc.ref));
    await Promise.all(deletes);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};

