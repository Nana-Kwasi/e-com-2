import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Seller } from '../types';

export class AuthService {
  static async signIn(email: string, password: string): Promise<User | Seller> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data() as User | Seller;
  }

  static async signUp(userData: Partial<User | Seller> & { password: string }): Promise<User | Seller> {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email!, 
      userData.password
    );
    
    const user: any = {
      id: userCredential.user.uid,
      email: userData.email!,
      name: userData.name!,
      phone: userData.phone || null,
      address: userData.address || null,
      role: userData.role || 'buyer',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Object.keys(userData).forEach(key => {
      if (key !== 'password' && userData[key as keyof typeof userData] !== undefined) {
        user[key] = userData[key as keyof typeof userData];
      }
    });

    Object.keys(user).forEach(key => {
      if (user[key] === undefined) {
        delete user[key];
      }
    });

    await setDoc(doc(db, 'users', user.id), user);
    return user as User | Seller;
  }

  static async signOut(): Promise<void> {
    await signOut(auth);
  }

  static onAuthStateChange(callback: (user: User | Seller | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as User | Seller);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  static async updateProfile(userId: string, updates: Partial<User | Seller>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date()
    });
  }
}
