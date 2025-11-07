import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, SearchFilters } from '../types';

export class ProductService {
  static async getProducts(filters?: SearchFilters, lastDoc?: any): Promise<Product[]> {
    try {
      let q = query(collection(db, 'products'), where('isActive', '==', true));
      
      if (filters?.category) {
        // Normalize category to match database format (capitalize first letter)
        const normalizedCategory = filters.category.charAt(0).toUpperCase() + filters.category.slice(1).toLowerCase();
        q = query(q, where('category', '==', normalizedCategory));
      }
      
      if (filters?.minPrice) {
        q = query(q, where('price', '>=', filters.minPrice));
      }
      
      if (filters?.maxPrice) {
        q = query(q, where('price', '<=', filters.maxPrice));
      }
      
      if (filters?.hotDeal) {
        q = query(q, where('isHotDeal', '==', true));
      }
      
      if (filters?.discount) {
        q = query(q, where('discount', '>', 0));
      }
      
      q = query(q, orderBy('createdAt', 'desc'), limit(20));
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn('Firestore index required. Loading products without orderBy...');
        let q = query(collection(db, 'products'), where('isActive', '==', true));
        
        if (filters?.category) {
          q = query(q, where('category', '==', filters.category));
        }
        
        if (filters?.minPrice) {
          q = query(q, where('price', '>=', filters.minPrice));
        }
        
        if (filters?.maxPrice) {
          q = query(q, where('price', '<=', filters.maxPrice));
        }
        
        if (filters?.hotDeal) {
          q = query(q, where('isHotDeal', '==', true));
        }
        
        if (filters?.discount) {
          q = query(q, where('discount', '>', 0));
        }
        
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        // Sort manually by createdAt
        return products.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        }).slice(0, 20);
      }
      throw error;
    }
  }

  static async getProduct(id: string): Promise<Product | null> {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  }

  static async getProductsBySeller(sellerId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'), 
        where('sellerId', '==', sellerId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        // Fallback: get products without orderBy
        console.warn('Firestore index might be required. Loading products without orderBy...');
        const q = query(
          collection(db, 'products'), 
          where('sellerId', '==', sellerId),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        // Sort manually by createdAt
        return products.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
      }
      throw error;
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, 'products', id), {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  }

  static async searchProducts(searchTerm: string, filters?: SearchFilters): Promise<Product[]> {
    // This is a simplified search - in production, you'd want to use Algolia or similar
    const allProducts = await this.getProducts(filters);
    return allProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  static subscribeToProducts(callback: (products: Product[]) => void) {
    const q = query(
      collection(db, 'products'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, 
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        callback(products);
      },
      (error) => {
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index required for real-time products. Using fallback query...');
          const fallbackQ = query(
            collection(db, 'products'), 
            where('isActive', '==', true)
          );
          return onSnapshot(fallbackQ, (snapshot) => {
            const products = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            } as Product));
            // Sort manually by createdAt
            products.sort((a, b) => {
              const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
              const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
              return bDate.getTime() - aDate.getTime();
            });
            callback(products);
          });
        } else {
          console.error('Error in product subscription:', error);
        }
      }
    );
  }
}

