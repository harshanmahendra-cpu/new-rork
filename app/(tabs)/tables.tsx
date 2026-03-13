import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, X, Minus, Printer, Edit2, Check, ImageIcon } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/helpers';
import { MenuItem, Order, MENU_CATEGORIES } from '@/types';
import { BillPrinter } from '@/components/BillPrinter';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function TablesScreen() {
  const { 
    tables, menu, settings, addTable, deleteTable, updateTableNumber,
    createOrder, getActiveOrderForTable, addItemToOrder,
    updateItemQuantity, completeOrder, cancelOrder
  } = useApp();
  const { t } = useLanguage();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [completedBillNumber, setCompletedBillNumber] = useState<number | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const handleTablePress = (tableId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    setSelectedTableId(tableId);
    const existingOrder = getActiveOrderForTable(tableId);
    
    if (existingOrder) {
      setActiveOrder(existingOrder);
    } else {
      const newOrderId = createOrder('table', tableId, table.tableNumber);
      const localOrder: Order = {
        id: newOrderId,
        billNumber: null,
        orderType: 'table',
        tableId: tableId,
        tableNumber: table.tableNumber,
        status: 'active',
        items: [],
        subtotal: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      setActiveOrder(localOrder);
    }
  };

  const handleCloseModal = () => {
    setSelectedTableId(null);
    setActiveOrder(null);
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const handleCloseBillPreview = () => {
    setShowBillPreview(false);
    setCompletedBillNumber(null);
    setCompletedOrder(null);
  };

  const handleAddItem = (item: MenuItem) => {
    if (!activeOrder) return;
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
    addItemToOrder(activeOrder.id, item);
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

  const handleDeleteTable = (tableId: string) => {
    const order = getActiveOrderForTable(tableId);
    if (order) {
      Alert.alert(t('cannotDelete'), t('activeOrderExists'));
      return;
    }
    
    Alert.alert(
      t('deleteTable'),
      t('deleteTableConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteTable(tableId) },
      ]
    );
  };

  const handleEditTable = (tableId: string, currentNumber: number) => {
    setEditingTableId(tableId);
    setEditTableNumber(currentNumber.toString());
  };

  const handleSaveTableNumber = () => {
    if (!editingTableId) return;
    const newNumber = parseInt(editTableNumber, 10);
    if (isNaN(newNumber) || newNumber <= 0) {
      Alert.alert(t('invalidNumber'), t('enterValidNumber'));
      return;
    }
    
    const existingTable = tables.find(t => t.tableNumber === newNumber && t.id !== editingTableId);
    if (existingTable) {
      Alert.alert(t('duplicate'), t('tableNumberExists'));
      return;
    }
    
    updateTableNumber(editingTableId, newNumber);
    setEditingTableId(null);
    setEditTableNumber('');
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
        <Text style={styles.title}>{t('tables')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={addTable}>
          <Plus color={Colors.textWhite} size={20} />
          <Text style={styles.addButtonText}>{t('addTable')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.gridContainer}>
        {tables.map((table) => {
          const hasOrder = table.status === 'active';
          const isEditing = editingTableId === table.id;
          
          return (
            <View key={table.id} style={styles.tableWrapper}>
              <TouchableOpacity
                style={[
                  styles.tableCard,
                  hasOrder ? styles.tableActive : styles.tableVacant,
                ]}
                onPress={() => !isEditing && handleTablePress(table.id)}
                disabled={isEditing}
              >
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editTableNumber}
                    onChangeText={setEditTableNumber}
                    keyboardType="number-pad"
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.tableNumber, hasOrder && styles.tableNumberActive]}>
                    {table.tableNumber}
                  </Text>
                )}
                <Text style={[styles.tableStatus, hasOrder && styles.tableStatusActive]}>
                  {hasOrder ? t('active') : t('vacant')}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.tableActions}>
                {isEditing ? (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={handleSaveTableNumber}
                  >
                    <Check color={Colors.success} size={18} />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleEditTable(table.id, table.tableNumber)}
                    >
                      <Edit2 color={Colors.primary} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleDeleteTable(table.id)}
                    >
                      <Trash2 color={Colors.danger} size={16} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={selectedTableId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t('tableOrder')} {selectedTable?.tableNumber}</Text>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  tableWrapper: {
    width: '30%',
    minWidth: 100,
    maxWidth: 130,
    flexGrow: 1,
  },
  tableCard: {
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableVacant: {
    backgroundColor: Colors.successLight,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  tableActive: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  tableNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  tableNumberActive: {
    color: Colors.danger,
  },
  tableStatus: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
    marginTop: 4,
  },
  tableStatusActive: {
    color: Colors.danger,
  },
  editInput: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    width: 60,
    padding: 4,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  tableActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
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
