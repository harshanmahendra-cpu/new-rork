import { MenuItem, RestaurantTable, Settings, User } from '@/types';

export const DEFAULT_SETTINGS: Settings = {
  restaurantName: 'Velan Food Court',
  address: '123 Main Street, Chennai, Tamil Nadu - 600001',
  gstNumber: '',
  lastBillNumber: 0,
  lastBillMonth: new Date().getMonth(),
  lastBillYear: new Date().getFullYear(),
};

export const DEFAULT_ADMIN: User = {
  username: 'admin',
  passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin' hashed
};

export const DEFAULT_TABLES: RestaurantTable[] = [
  { id: 't1', tableNumber: 1, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't2', tableNumber: 2, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't3', tableNumber: 3, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't4', tableNumber: 4, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't5', tableNumber: 5, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't6', tableNumber: 6, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't7', tableNumber: 7, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't8', tableNumber: 8, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't9', tableNumber: 9, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't10', tableNumber: 10, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't11', tableNumber: 11, status: 'vacant', createdAt: new Date().toISOString() },
  { id: 't12', tableNumber: 12, status: 'vacant', createdAt: new Date().toISOString() },
];

export const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Chicken 65', category: 'Starters', price: 180, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm2', name: 'Paneer Tikka', category: 'Starters', price: 160, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm3', name: 'Gobi Manchurian', category: 'Starters', price: 140, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm4', name: 'Fish Fry', category: 'Starters', price: 200, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm5', name: 'Mutton Biryani', category: 'Biryani', price: 280, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm6', name: 'Chicken Biryani', category: 'Biryani', price: 220, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm7', name: 'Veg Biryani', category: 'Biryani', price: 160, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm8', name: 'Egg Biryani', category: 'Biryani', price: 180, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm9', name: 'Chicken Fried Rice', category: 'Chinese', price: 180, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm10', name: 'Veg Fried Rice', category: 'Chinese', price: 140, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm11', name: 'Chicken Noodles', category: 'Chinese', price: 170, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm12', name: 'Veg Noodles', category: 'Chinese', price: 130, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm13', name: 'Butter Chicken', category: 'Main Course', price: 260, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm14', name: 'Paneer Butter Masala', category: 'Main Course', price: 200, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm15', name: 'Chicken Curry', category: 'Main Course', price: 220, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm16', name: 'Dal Tadka', category: 'Main Course', price: 120, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm17', name: 'Samosa (2 pcs)', category: 'Snacks', price: 40, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm18', name: 'Vada Pav', category: 'Snacks', price: 30, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm19', name: 'Masala Dosa', category: 'Snacks', price: 80, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm20', name: 'Fresh Lime Soda', category: 'Drinks', price: 50, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm21', name: 'Masala Chai', category: 'Drinks', price: 30, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm22', name: 'Cold Coffee', category: 'Drinks', price: 70, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm23', name: 'Mango Lassi', category: 'Drinks', price: 60, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm24', name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 60, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm25', name: 'Ice Cream', category: 'Desserts', price: 80, isAvailable: true, createdAt: new Date().toISOString() },
  { id: 'm26', name: 'Rasgulla (2 pcs)', category: 'Desserts', price: 50, isAvailable: true, createdAt: new Date().toISOString() },
];
