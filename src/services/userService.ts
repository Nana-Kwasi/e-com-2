import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Seller } from '../types';

export class UserService {
  /**
   * Search sellers by business name
   * @param businessName - The business name to search for
   * @returns Array of sellers matching the business name
   */
  static async searchSellersByBusinessName(businessName: string): Promise<Seller[]> {
    try {
      // Get all sellers
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'seller')
      );

      const snapshot = await getDocs(q);
      const sellers = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Seller;
        })
        .filter(seller => {
          // Case-insensitive search for business name
          const sellerBusinessName = seller.businessName?.toLowerCase() || '';
          const searchTerm = businessName.toLowerCase();
          return sellerBusinessName.includes(searchTerm);
        });

      return sellers;
    } catch (error: any) {
      console.error('Error searching sellers:', error);
      if (error.code === 'failed-precondition') {
        // Fallback: get all sellers and filter in memory
        console.warn('Firestore index might be required. Using fallback search...');
        const q = query(collection(db, 'users'), where('role', '==', 'seller'));
        const snapshot = await getDocs(q);
        const sellers = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Seller;
          })
          .filter(seller => {
            const sellerBusinessName = seller.businessName?.toLowerCase() || '';
            const searchTerm = businessName.toLowerCase();
            return sellerBusinessName.includes(searchTerm);
          });
        return sellers;
      }
      throw error;
    }
  }

  /**
   * Get seller by ID
   * @param sellerId - The seller ID
   * @returns Seller or null if not found
   */
  static async getSellerById(sellerId: string): Promise<Seller | null> {
    try {
      const docRef = doc(db, 'users', sellerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Seller;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting seller:', error);
      return null;
    }
  }
}

