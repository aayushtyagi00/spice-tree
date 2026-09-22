export type CategoryId = 
  | 'thalis'
  | 'starters'
  | 'mains'
  | 'breads'
  | 'chinese'
  | 'continental'
  | 'snacks'
  | 'beverages';

export type ActiveTab = 'home' | 'menu' | 'checkout' | 'confirmation' | 'orders' | 'about' | 'admin';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  isBestseller: boolean;
  isJainFriendly: boolean;
  image: string;
  isAvailable?: boolean;
  spicyLevel?: 'mild' | 'medium' | 'spicy';
  portion?: string;
  tags?: string[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincode: string;
  isServiceable: boolean;
  minOrder: number;
  deliveryFee: number;
  estimatedMins: string;
  areaDescription?: string;
}

export interface CartItem {
  menuItemId: string;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isJainFriendly?: boolean;
}

export type OrderType = 'delivery' | 'takeaway' | 'dinein';

export type PaymentMethod = 'upi' | 'card' | 'cod';

export type OrderStatus = 'Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  userId?: string | null;
  customerEmail?: string | null;
  customerName: string;
  phone: string;
  orderType: OrderType;
  address?: string;
  locality?: string;
  pincode?: string;
  houseNo?: string;
  street?: string;
  landmark?: string;
  deliveryInstructions?: string;
  tableNumber?: string;
  numberOfGuests?: string;
  expectedArrivalTime?: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  promoCode?: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
  estimatedDeliveryTime?: string;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  isJainMeal: boolean;
  specialRequests?: string;
  status?: 'pending' | 'confirmed' | 'declined';
  createdAt: number;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface AdminRecord {
  id: string;
  email: string;
  role?: string;
  name?: string;
  addedAt?: number;
}

export interface RestaurantSettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  taxRate: number; // in percent (e.g. 5 for 5%)
  isStoreOpen: boolean;
  closedNotice?: string;
}

