/**
 * HyperCon Core TypeScript Interfaces & Types
 */

export interface GuestUser {
  guestId: string;
  guestName: string;
  createdAt: string;
}

export interface CartItem {
  storeId: string;
  productId?: string | null;
  productName: string;
  storeName: string;
  price: number;
  unit: string;
  imageUrl?: string;
  hasLiveVerification?: boolean;
  quantity: number;
}

export interface OrderItem {
  storeId: string;
  productId?: string | null;
  productName: string;
  storeName: string;
  price: number;
  unit: string;
  imageUrl?: string;
  quantity: number;
}

export type OrderStatus = "Pending" | "Confirmed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export interface Order {
  orderId: string;
  guestId: string;
  guestName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderTime: string;
  estimatedDelivery: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  transactionId?: string;
}

export interface PaymentDetails {
  orderId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  timestamp: string;
  message?: string;
}

export interface StoreLocation {
  lat: number;
  lng: number;
}

export interface Store {
  _id: string;
  name: string;
  location: StoreLocation;
  address: string;
  cameraStreamId: string;
  contact: string;
  rating?: number;
}
