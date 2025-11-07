export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  role?: 'buyer' | 'seller';
  createdAt: Date;
  updatedAt: Date;
}

export interface Seller extends User {
  role: 'seller';
  businessName: string;
  license?: string;
  bankDetails?: BankDetails;
  sellerRole: 'super_user' | 'admin' | 'normal_seller';
  isApproved: boolean;
  totalEarnings: number;
  pendingPayout: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  images: string[];
  stock: number;
  isHotDeal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  specifications?: Record<string, string>;
  gender?: 'men' | 'women' | 'unisex';
  // Rating and reviews
  rating?: number; // Average rating (0-5)
  reviewCount?: number; // Number of reviews
  // Additional product information
  brand?: string;
  sku?: string; // Stock Keeping Unit
  model?: string;
  weight?: string; // e.g., "1.5 kg"
  dimensions?: string; // e.g., "10 x 5 x 3 cm"
  material?: string; // For clothing, furniture, etc.
  ingredients?: string; // For food products
  warranty?: string; // e.g., "1 year", "6 months"
  condition?: 'new' | 'used' | 'refurbished';
  shippingInfo?: string; // e.g., "Free shipping", "Ships in 2-3 days"
  returnPolicy?: string;
  size?: string; // For clothing, shoes, some sports items
  color?: string; // For clothing, shoes, some products
  author?: string; // For books
  pages?: string; // For books
  expirationDate?: string; // For food, beauty products
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  products: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'order_received'
  | 'processing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Payment {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  period: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
  processedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_update' | 'payment' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  discount?: boolean;
  hotDeal?: boolean;
  rating?: number;
  searchTerm?: string;
}

