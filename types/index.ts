export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  image?: string;
  createdAt: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: number;
  status: 'vacant' | 'active';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  priceAtTime: number;
  total: number;
}

export interface Order {
  id: string;
  billNumber: number | null;
  orderType: 'table' | 'takeaway';
  tableId: string | null;
  tableNumber: number | null;
  status: 'active' | 'completed';
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Settings {
  restaurantName: string;
  address: string;
  gstNumber: string;
  lastBillNumber: number;
  lastBillMonth: number;
  lastBillYear: number;
}

export interface User {
  username: string;
  passwordHash: string;
}

export interface DailySales {
  date: string;
  total: number;
  orderCount: number;
}

export interface MonthlySales {
  month: string;
  total: number;
  orderCount: number;
}

export type MenuCategory = 
  | 'Starters'
  | 'Main Course'
  | 'Drinks'
  | 'Desserts'
  | 'Biryani'
  | 'Chinese'
  | 'Snacks';

export const MENU_CATEGORIES: MenuCategory[] = [
  'Starters',
  'Main Course',
  'Biryani',
  'Chinese',
  'Snacks',
  'Drinks',
  'Desserts',
];
