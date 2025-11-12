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
} from 'firebase/firestore';

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  orderId?: string;
  rating: number;
  comment: string;
  sellerRating?: number;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewService = {
  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount'>): Promise<string> {
    const reviewData = {
      ...review,
      helpfulCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    return docRef.id;
  },

  async getProductReviews(productId: string, limitCount?: number): Promise<Review[]> {
    let q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Review[];
  },

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productIds = productsSnapshot.docs.map(doc => doc.id);
    
    if (productIds.length === 0) return [];
    
    const reviews: Review[] = [];
    for (const productId of productIds) {
      const productReviews = await this.getProductReviews(productId);
      reviews.push(...productReviews);
    }
    
    return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getBuyerReviews(buyerId: string): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Review[];
  },

  async getProductAverageRating(productId: string): Promise<number> {
    const reviews = await this.getProductReviews(productId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  },

  async markHelpful(reviewId: string): Promise<void> {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);
    if (reviewDoc.exists()) {
      const currentCount = reviewDoc.data().helpfulCount || 0;
      await updateDoc(reviewRef, { helpfulCount: currentCount + 1 });
    }
  },

  async updateReview(reviewId: string, updates: Partial<Review>): Promise<void> {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteReview(reviewId: string): Promise<void> {
    await deleteDoc(doc(db, 'reviews', reviewId));
  },
};

