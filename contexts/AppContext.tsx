import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItem, RestaurantTable, Order, OrderItem, Settings } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_TABLES, DEFAULT_MENU, DEFAULT_ADMIN } from '@/constants/defaults';

const STORAGE_KEYS = {
  MENU: 'velan_menu',
  TABLES: 'velan_tables',
  ORDERS: 'velan_orders',
  SETTINGS: 'velan_settings',
  IS_LOGGED_IN: 'velan_logged_in',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MENU);
      if (stored) return JSON.parse(stored) as MenuItem[];
      await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DEFAULT_MENU));
      return DEFAULT_MENU;
    },
  });

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TABLES);
      if (stored) return JSON.parse(stored) as RestaurantTable[];
      await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(DEFAULT_TABLES));
      return DEFAULT_TABLES;
    },
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) return JSON.parse(stored) as Order[];
      return [] as Order[];
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        if (parsed.lastBillNumber === undefined) {
          const updated = {
            ...parsed,
            lastBillNumber: 0,
            lastBillMonth: new Date().getMonth(),
            lastBillYear: new Date().getFullYear(),
          };
          await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
          return updated;
        }
        return parsed;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    const checkLogin = async () => {
      const logged = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      setIsLoggedIn(logged === 'true');
      setIsInitialized(true);
    };
    checkLogin();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const hashedPassword = await hashPassword(password);
      if (username === DEFAULT_ADMIN.username && hashedPassword === DEFAULT_ADMIN.passwordHash) {
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        return true;
      }
      throw new Error('Invalid credentials');
    },
    onSuccess: () => {
      setIsLoggedIn(true);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'false');
    },
    onSuccess: () => {
      setIsLoggedIn(false);
    },
  });

  const saveMenuMutation = useMutation({
    mutationFn: async (menu: MenuItem[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
      return menu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  const saveTablesMutation = useMutation({
    mutationFn: async (tables: RestaurantTable[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
      return tables;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const saveOrdersMutation = useMutation({
    mutationFn: async (orders: Order[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return orders;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Settings) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const { mutate: saveMenu } = saveMenuMutation;
  const { mutate: saveTables } = saveTablesMutation;
  const { mutate: saveOrders } = saveOrdersMutation;
  const { mutate: saveSettings } = saveSettingsMutation;

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id' | 'createdAt'>) => {
    const newItem: MenuItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const currentMenu = menuQuery.data || [];
    saveMenu([...currentMenu, newItem]);
  }, [menuQuery.data, saveMenu]);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    const currentMenu = menuQuery.data || [];
    const updated = currentMenu.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    saveMenu(updated);
  }, [menuQuery.data, saveMenu]);

  const deleteMenuItem = useCallback((id: string) => {
    const currentMenu = menuQuery.data || [];
    saveMenu(currentMenu.filter(item => item.id !== id));
  }, [menuQuery.data, saveMenu]);

  const updateTableStatus = useCallback((id: string, status: 'vacant' | 'active') => {
    const currentTables = tablesQuery.data || [];
    const updated = currentTables.map(t => 
      t.id === id ? { ...t, status } : t
    );
    saveTables(updated);
  }, [tablesQuery.data, saveTables]);

  const addTable = useCallback(() => {
    const currentTables = tablesQuery.data || [];
    const maxNumber = Math.max(0, ...currentTables.map(t => t.tableNumber));
    const newTable: RestaurantTable = {
      id: generateId(),
      tableNumber: maxNumber + 1,
      status: 'vacant',
      createdAt: new Date().toISOString(),
    };
    saveTables([...currentTables, newTable]);
  }, [tablesQuery.data, saveTables]);

  const deleteTable = useCallback((id: string) => {
    const currentTables = tablesQuery.data || [];
    saveTables(currentTables.filter(t => t.id !== id));
  }, [tablesQuery.data, saveTables]);

  const updateTableNumber = useCallback((id: string, newTableNumber: number) => {
    const currentTables = tablesQuery.data || [];
    const updated = currentTables.map(t => 
      t.id === id ? { ...t, tableNumber: newTableNumber } : t
    );
    saveTables(updated);
  }, [tablesQuery.data, saveTables]);

  const createOrder = useCallback((orderType: 'table' | 'takeaway', tableId?: string, tableNumber?: number) => {
    const newOrder: Order = {
      id: generateId(),
      billNumber: null,
      orderType,
      tableId: tableId || null,
      tableNumber: tableNumber || null,
      status: 'active',
      items: [],
      subtotal: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const currentOrders = ordersQuery.data || [];
    saveOrders([...currentOrders, newOrder]);
    
    if (tableId) {
      updateTableStatus(tableId, 'active');
    }
    
    return newOrder.id;
  }, [ordersQuery.data, saveOrders, updateTableStatus]);

  const addItemToOrder = useCallback((orderId: string, menuItem: MenuItem, quantity: number = 1) => {
    const currentOrders = ordersQuery.data || [];
    
    const updated = currentOrders.map(order => {
      if (order.id !== orderId) return order;
      
      const existingItemIndex = order.items.findIndex(i => i.menuItemId === menuItem.id);
      let newItems: OrderItem[];
      
      if (existingItemIndex >= 0) {
        newItems = order.items.map((item, idx) => {
          if (idx !== existingItemIndex) return item;
          const newQuantity = item.quantity + quantity;
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.priceAtTime,
          };
        });
      } else {
        const newItem: OrderItem = {
          id: generateId(),
          orderId,
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity,
          priceAtTime: menuItem.price,
          total: quantity * menuItem.price,
        };
        newItems = [...order.items, newItem];
      }
      
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...order,
        items: newItems,
        subtotal,
        total: subtotal,
      };
    });
    
    saveOrders(updated);
  }, [ordersQuery.data, saveOrders]);

  const updateItemQuantity = useCallback((orderId: string, itemId: string, quantity: number) => {
    const currentOrders = ordersQuery.data || [];
    
    const updated = currentOrders.map(order => {
      if (order.id !== orderId) return order;
      
      let newItems: OrderItem[];
      
      if (quantity <= 0) {
        newItems = order.items.filter(item => item.id !== itemId);
      } else {
        newItems = order.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            quantity,
            total: quantity * item.priceAtTime,
          };
        });
      }
      
      const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...order,
        items: newItems,
        subtotal,
        total: subtotal,
      };
    });
    
    saveOrders(updated);
  }, [ordersQuery.data, saveOrders]);

  const removeItemFromOrder = useCallback((orderId: string, itemId: string) => {
    updateItemQuantity(orderId, itemId, 0);
  }, [updateItemQuantity]);

  const getNextBillNumber = useCallback(async (): Promise<number> => {
    const settings = settingsQuery.data || DEFAULT_SETTINGS;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextNumber: number;
    
    if (currentMonth !== settings.lastBillMonth || currentYear !== settings.lastBillYear) {
      nextNumber = 1;
    } else {
      nextNumber = settings.lastBillNumber + 1;
    }
    
    const updatedSettings = {
      ...settings,
      lastBillNumber: nextNumber,
      lastBillMonth: currentMonth,
      lastBillYear: currentYear,
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    
    return nextNumber;
  }, [settingsQuery.data, queryClient]);

  const completeOrder = useCallback(async (orderId: string): Promise<number> => {
    const currentOrders = ordersQuery.data || [];
    const order = currentOrders.find(o => o.id === orderId);
    
    if (order?.tableId) {
      updateTableStatus(order.tableId, 'vacant');
    }
    
    const billNumber = await getNextBillNumber();
    
    const updated = currentOrders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        billNumber,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };
    });
    
    saveOrders(updated);
    return billNumber;
  }, [ordersQuery.data, saveOrders, updateTableStatus, getNextBillNumber]);

  const cancelOrder = useCallback((orderId: string) => {
    const currentOrders = ordersQuery.data || [];
    const order = currentOrders.find(o => o.id === orderId);
    
    if (order?.tableId) {
      updateTableStatus(order.tableId, 'vacant');
    }
    
    saveOrders(currentOrders.filter(o => o.id !== orderId));
  }, [ordersQuery.data, saveOrders, updateTableStatus]);

  const reopenOrder = useCallback((orderId: string) => {
    const currentOrders = ordersQuery.data || [];
    const updated = currentOrders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: 'active' as const,
        completedAt: null,
      };
    });
    saveOrders(updated);
  }, [ordersQuery.data, saveOrders]);

  const updateCompletedOrder = useCallback((orderId: string, items: OrderItem[]) => {
    const currentOrders = ordersQuery.data || [];
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const updated = currentOrders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items,
        subtotal,
        total: subtotal,
      };
    });
    saveOrders(updated);
  }, [ordersQuery.data, saveOrders]);

  const getActiveOrderForTable = useCallback((tableId: string): Order | undefined => {
    const orders = ordersQuery.data || [];
    return orders.find(o => o.tableId === tableId && o.status === 'active');
  }, [ordersQuery.data]);

  const getOrderById = useCallback((orderId: string): Order | undefined => {
    const orders = ordersQuery.data || [];
    return orders.find(o => o.id === orderId);
  }, [ordersQuery.data]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const currentSettings = settingsQuery.data || DEFAULT_SETTINGS;
    saveSettings({ ...currentSettings, ...updates });
  }, [settingsQuery.data, saveSettings]);

  const completedOrders = useMemo(() => {
    return (ordersQuery.data || []).filter(o => o.status === 'completed');
  }, [ordersQuery.data]);

  const activeOrders = useMemo(() => {
    return (ordersQuery.data || []).filter(o => o.status === 'active');
  }, [ordersQuery.data]);

  const activeTakeawayOrders = useMemo(() => {
    return activeOrders.filter(o => o.orderType === 'takeaway');
  }, [activeOrders]);

  return {
    isLoggedIn,
    isInitialized,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginPending: loginMutation.isPending,
    
    menu: menuQuery.data || [],
    menuLoading: menuQuery.isLoading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    
    tables: tablesQuery.data || [],
    tablesLoading: tablesQuery.isLoading,
    addTable,
    deleteTable,
    updateTableNumber,
    updateTableStatus,
    
    orders: ordersQuery.data || [],
    ordersLoading: ordersQuery.isLoading,
    completedOrders,
    activeOrders,
    activeTakeawayOrders,
    createOrder,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    completeOrder,
    cancelOrder,
    reopenOrder,
    updateCompletedOrder,
    getActiveOrderForTable,
    getOrderById,
    
    settings: settingsQuery.data || DEFAULT_SETTINGS,
    settingsLoading: settingsQuery.isLoading,
    updateSettings,
  };
});
