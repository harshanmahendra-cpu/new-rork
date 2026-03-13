import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Minus, Printer, ShoppingBag, Trash2, Check, ImageIcon } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { MenuItem, Order, MENU_CATEGORIES } from '@/types';
import { BillPrinter } from '@/components/BillPrinter';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function TakeawayScreen() {
  const { 
    activeTakeawayOrders, menu, settings, 
    createOrder, getOrderById, addItemToOrder,
    updateItemQuantity, completeOrder, cancelOrder
  } = useApp();
  const { t } = useLanguage();
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [completedBillNumber, setCompletedBillNumber] = useState<number | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const handleNewOrder = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const orderId = createOrder('takeaway');
    setSelectedOrderId(orderId);
    setShowNewOrder(true);
    const localOrder: Order = {
      id: orderId,
      billNumber: null,
      orderType: 'takeaway',
      tableId: null,
      tableNumber: null,
      status: 'active',
      items: [],
      subtotal: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setActiveOrder(localOrder);
  };

  const handleSelectOrder = (orderId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOrderId(orderId);
    const order = getOrderById(orderId);
    setActiveOrder(order || null);
    setShowNewOrder(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setActiveOrder(null);
    setShowNewOrder(false);
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const handleCloseBillPreview = () => {
    setShowBillPreview(false);
    setCompletedBillNumber(null);
    setCompletedOrder(null);
  };

  const handleAddItem = (item: MenuItem) => {
    if (!selectedOrderId || !activeOrder) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const existingItemIndex = activeOrder.items.findIndex(i => i.menuItemId === item.id);
    let newItems = [...activeOrder.items];
    
    if (existingItemIndex >= 0) {
      const existingItem = newItems[existingItemIndex];
      const newQuantity = existingItem.quantity + 1;
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * existingItem.priceAtTime,
      };
    } else {
      const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        orderId: activeOrder.id,
        menuItemId: item.id,
        menuItemName: item.name,
        quantity: 1,
        priceAtTime: item.price,
        total: item.price,
      };
      newItems = [...newItems, newItem];
    }
    
    const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const updatedOrder = {
      ...activeOrder,
      items: newItems,
      subtotal,
      total: subtotal,
    };
    
    setActiveOrder(updatedOrder);
    addItemToOrder(selectedOrderId, item);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    if (!activeOrder) return;
    const item = activeOrder.items.find(i => i.id === itemId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    
    let newItems;
    if (newQty <= 0) {
      newItems = activeOrder.items.filter(i => i.id !== itemId);
    } else {
      newItems = activeOrder.items.map(i => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          quantity: newQty,
          total: newQty * i.priceAtTime,
        };
      });
    }
    
    const subtotal = newItems.reduce((sum, i) => sum + i.total, 0);
    const updatedOrder = {
      ...activeOrder,
      items: newItems,
      subtotal,
      total: subtotal,
    };
    
    setActiveOrder(updatedOrder);
    updateItemQuantity(activeOrder.id, itemId, newQty <= 0 ? 0 : newQty);
  };

  const handleGenerateBill = () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      Alert.alert(t('error'), t('emptyBillError'));
      return;
    }
    
    const orderCopy = { ...activeOrder };
    setCompletedOrder(orderCopy);
    setShowBillPreview(true);
    handleCloseModal();
  };

  const handleCompleteAndPrint = async () => {
    if (!completedOrder) return;
    
    try {
      const billNumber = await completeOrder(completedOrder.id);
      setCompletedBillNumber(billNumber);
      
      const updatedOrder = { ...completedOrder, billNumber };
      setCompletedOrder(updatedOrder);
    } catch (error) {
      console.error('Error completing order:', error);
      Alert.alert(t('error'), 'Failed to complete order');
    }
  };

  const handleCancelOrder = () => {
    if (!activeOrder) return;
    
    Alert.alert(
      t('cancelOrder'),
      t('cancelOrderConfirm'),
      [
        { text: t('no'), style: 'cancel' },
        { 
          text: t('yesCancel'), 
          style: 'destructive',
          onPress: () => {
            cancelOrder(activeOrder.id);
            handleCloseModal();
          }
        },
      ]
    );
  };

  const filteredMenu = menu.filter(item => {
    if (!item.isAvailable) return false;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('takeawayOrders')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewOrder}>
          <Plus color={Colors.textWhite} size={20} />
          <Text style={styles.addButtonText}>{t('newOrder')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {activeTakeawayOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag color={Colors.textLight} size={64} />
            <Text style={styles.emptyTitle}>{t('noActiveTakeaway')}</Text>
            <Text style={styles.emptySubtitle}>{t('tapNewOrder')}</Text>
          </View>
        ) : (
          activeTakeawayOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleSelectOrder(order.id)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderBadge}>
                  <ShoppingBag color={Colors.primary} size={16} />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderTime}>{formatDateTime(order.createdAt)}</Text>
                </View>
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalAmount}>{formatCurrency(order.total)}</Text>
                  <Text style={styles.orderItemCount}>{order.items.length} items</Text>
                </View>
              </View>
              <View style={styles.orderItems}>
                {order.items.slice(0, 3).map((item, idx) => (
                  <Text key={idx} style={styles.orderItemText} numberOfLines={1}>
                    {item.quantity}× {item.menuItemName}
                  </Text>
                ))}
                {order.items.length > 3 && (
                  <Text style={styles.moreItems}>+{order.items.length - 3} more items</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showNewOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t('takeawayOrder')}</Text>
              <Text style={styles.modalSubtitle}>
                {activeOrder?.items.length || 0} {t('items')} • {formatCurrency(activeOrder?.total || 0)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.menuSection}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchMenu')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textSecondary}
              />
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContainer}
              >
                <TouchableOpacity
                  style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory('All')}
                >
                  <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                {MENU_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                {filteredMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleAddItem(item)}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                    ) : (
                      <View style={styles.menuItemImagePlaceholder}>
                        <ImageIcon color={Colors.textLight} size={22} />
                      </View>
                    )}
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                    <View style={styles.addItemButton}>
                      <Plus color={Colors.primary} size={20} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.orderSection}>
              <Text style={styles.orderTitle}>{t('orderItems')}</Text>
              <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
                {activeOrder?.items.map((item) => (
                  <View key={item.id} style={styles.orderItem}>
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>{item.menuItemName}</Text>
                      <Text style={styles.orderItemPrice}>
                        {formatCurrency(item.priceAtTime)} × {item.quantity} = {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateQuantity(item.id, -1)}
                      >
                        <Minus color={Colors.danger} size={16} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleUpdateQuantity(item.id, 1)}
                      >
                        <Plus color={Colors.success} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {(!activeOrder?.items || activeOrder.items.length === 0) && (
                  <View style={styles.emptyOrder}>
                    <Text style={styles.emptyOrderText}>{t('noItemsYet')}</Text>
                    <Text style={styles.emptyOrderSubtext}>{t('tapToAdd')}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.orderSummary}>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>{t('total')}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(activeOrder?.total || 0)}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                  <Trash2 color={Colors.danger} size={18} />
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.completeButton} onPress={handleGenerateBill}>
                  <Printer color={Colors.textWhite} size={18} />
                  <Text style={styles.completeButtonText}>{t('generateBill')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showBillPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseBillPreview}
      >
        <SafeAreaView style={styles.billModalContainer} edges={['top']}>
          <View style={styles.billModalHeader}>
            <Text style={styles.billModalTitle}>{t('billPreview')}</Text>
            <TouchableOpacity onPress={handleCloseBillPreview} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
          
          {completedOrder && (
            <View style={styles.billContent}>
              <BillPrinter 
                order={completedBillNumber ? { ...completedOrder, billNumber: completedBillNumber } : completedOrder} 
                settings={settings}
                onComplete={handleCloseBillPreview}
              />
              
              {!completedBillNumber && (
                <TouchableOpacity 
                  style={styles.recordBillButton} 
                  onPress={handleCompleteAndPrint}
                >
                  <Check color={Colors.textWhite} size={20} />
                  <Text style={styles.recordBillText}>{t('recordBill')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    color: Colors.textWhite,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderItemCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  orderItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    flexDirection: 'row',
  },
  menuSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    margin: 12,
    padding: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    fontSize: 14,
    color: Colors.text,
  },
  categoryScroll: {
    maxHeight: 44,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.textWhite,
  },
  menuList: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  menuItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  menuItemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  orderSection: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  orderItemPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  emptyOrder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyOrderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyOrderSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  orderSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  completeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
  billModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  billModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  billModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  billContent: {
    flex: 1,
    padding: 16,
  },
  recordBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.success,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  recordBillText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
});
