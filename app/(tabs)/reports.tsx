import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, TrendingUp, ShoppingBag, DollarSign, Award, Calendar, X, ChevronLeft, ChevronRight, Edit2, Plus, Minus, Check, ImageIcon } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SimpleBarChart } from '@/components/SimpleChart';
import { formatCurrency, formatDate, getDateRange, filterOrdersByDate, getTopSellingItems, generateCSV } from '@/utils/helpers';
import { MenuItem, Order, OrderItem, MENU_CATEGORIES } from '@/types';
import { BillPrinter } from '@/components/BillPrinter';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

type FilterType = 'today' | 'week' | 'month' | 'year' | 'custom';

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(month: number, year: number): number {
  if (month === 1 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month];
}

export default function ReportsScreen() {
  const { completedOrders, settings, menu, updateCompletedOrder } = useApp();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('All');
  const [showEditBillPreview, setShowEditBillPreview] = useState(false);

  const { filteredOrders, stats } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (filter === 'custom') {
      start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
      end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
    } else {
      const range = getDateRange(filter);
      start = range.start;
      end = range.end;
    }

    const orders = filterOrdersByDate(completedOrders, start, end);
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const tableOrders = orders.filter(o => o.orderType === 'table').length;
    const takeawayOrders = orders.filter(o => o.orderType === 'takeaway').length;
    const topItems = getTopSellingItems(orders, 5);

    return {
      filteredOrders: orders,
      stats: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        tableOrders,
        takeawayOrders,
        topItems,
      },
    };
  }, [completedOrders, filter, selectedDate]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      if (!order.completedAt) return;
      const date = new Date(order.completedAt);
      let key: string;
      
      if (filter === 'today' || filter === 'custom') {
        key = date.toLocaleTimeString('en-IN', { hour: '2-digit' });
      } else if (filter === 'week') {
        key = date.toLocaleDateString('en-IN', { weekday: 'short' });
      } else if (filter === 'month') {
        key = date.getDate().toString();
      } else {
        key = date.toLocaleDateString('en-IN', { month: 'short' });
      }
      
      grouped[key] = (grouped[key] || 0) + order.total;
    });

    return Object.entries(grouped).map(([label, value]) => ({ label, value }));
  }, [filteredOrders, filter]);

  const filteredEditMenu = useMemo(() => {
    return menu.filter(item => {
      if (!item.isAvailable) return false;
      const matchesCategory = editSelectedCategory === 'All' || item.category === editSelectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(editSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, editSelectedCategory, editSearchQuery]);

  const editSubtotal = useMemo(() => {
    return editItems.reduce((sum, i) => sum + i.total, 0);
  }, [editItems]);

  const handleExportCSV = async () => {
    if (filteredOrders.length === 0) {
      Alert.alert(t('noData'), t('noOrdersToExport'));
      return;
    }

    try {
      const csv = generateCSV(filteredOrders);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.restaurantName.replace(/\s+/g, '_')}_report_${filter}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert(t('success'), t('reportDownloaded'));
      } else {
        Alert.alert(t('export'), t('csvWebOnly'));
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('error'), t('exportError'));
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(calendarYear, calendarMonth, day);
    setSelectedDate(newDate);
    setFilter('custom');
    setShowDatePicker(false);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleEditOrder = (order: Order) => {
    Alert.alert(
      t('editBilledOrder'),
      t('editBillConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yesEdit'),
          onPress: () => {
            setEditingOrder(order);
            setEditItems([...order.items]);
            setEditSearchQuery('');
            setEditSelectedCategory('All');
            setShowEditModal(true);
          },
        },
      ]
    );
  };

  const handleEditAddItem = (item: MenuItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const existingIndex = editItems.findIndex(i => i.menuItemId === item.id);
    let newItems = [...editItems];

    if (existingIndex >= 0) {
      const existing = newItems[existingIndex];
      const newQty = existing.quantity + 1;
      newItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: newQty * existing.priceAtTime,
      };
    } else {
      newItems.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        orderId: editingOrder?.id || '',
        menuItemId: item.id,
        menuItemName: item.name,
        quantity: 1,
        priceAtTime: item.price,
        total: item.price,
      });
    }

    setEditItems(newItems);
  };

  const handleEditUpdateQuantity = (itemId: string, delta: number) => {
    const item = editItems.find(i => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setEditItems(editItems.filter(i => i.id !== itemId));
    } else {
      setEditItems(editItems.map(i => {
        if (i.id !== itemId) return i;
        return { ...i, quantity: newQty, total: newQty * i.priceAtTime };
      }));
    }
  };

  const handleSaveEditedBill = () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      Alert.alert(t('error'), t('emptyBillError'));
      return;
    }

    updateCompletedOrder(editingOrder.id, editItems);

    const updatedOrder: Order = {
      ...editingOrder,
      items: editItems,
      subtotal: editSubtotal,
      total: editSubtotal,
    };
    setEditingOrder(updatedOrder);
    setShowEditModal(false);
    setShowEditBillPreview(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
    setEditItems([]);
    setEditSearchQuery('');
    setEditSelectedCategory('All');
  };

  const handleCloseEditBillPreview = () => {
    setShowEditBillPreview(false);
    setEditingOrder(null);
    Alert.alert(t('success'), t('billUpdated'));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const rows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    const today = new Date();
    const isSelectedMonth = calendarMonth === selectedDate.getMonth() && calendarYear === selectedDate.getFullYear();

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavButton}>
            <ChevronLeft color={Colors.text} size={20} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthYear}>
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavButton}>
            <ChevronRight color={Colors.text} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarWeekHeader}>
          {WEEKDAY_HEADERS.map((day) => (
            <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>

        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.calendarRow}>
            {row.map((day, colIdx) => {
              if (day === null) {
                return <View key={colIdx} style={styles.calendarDayEmpty} />;
              }

              const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
              const isSelected = isSelectedMonth && day === selectedDate.getDate() && filter === 'custom';
              const isFuture = new Date(calendarYear, calendarMonth, day) > today;

              const dateForDay = new Date(calendarYear, calendarMonth, day);
              const dayStart = new Date(dateForDay.getFullYear(), dateForDay.getMonth(), dateForDay.getDate(), 0, 0, 0);
              const dayEnd = new Date(dateForDay.getFullYear(), dateForDay.getMonth(), dateForDay.getDate(), 23, 59, 59);
              const dayOrders = filterOrdersByDate(completedOrders, dayStart, dayEnd);
              const hasSales = dayOrders.length > 0;

              return (
                <TouchableOpacity
                  key={colIdx}
                  style={[
                    styles.calendarDay,
                    isToday && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                    isFuture && styles.calendarDayFuture,
                  ]}
                  onPress={() => !isFuture && handleDateSelect(day)}
                  disabled={isFuture}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isToday && styles.calendarDayTodayText,
                    isSelected && styles.calendarDaySelectedText,
                    isFuture && styles.calendarDayFutureText,
                  ]}>
                    {day}
                  </Text>
                  {hasSales && !isSelected && (
                    <View style={styles.salesDot} />
                  )}
                </TouchableOpacity>
              );
            })}
            {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.calendarDayEmpty} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const filterLabels: Record<FilterType, string> = {
    today: t('today'),
    week: t('last7DaysFilter'),
    month: t('thisMonthFilter'),
    year: t('thisYearFilter'),
    custom: filter === 'custom' ? formatDate(selectedDate.toISOString()) : t('customDate'),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('reports')}</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Download color={Colors.textWhite} size={18} />
          <Text style={styles.exportButtonText}>{t('exportCSV')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['today', 'week', 'month', 'year'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                {filterLabels[f]}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonDate, filter === 'custom' && styles.filterButtonActive]}
            onPress={() => {
              setCalendarMonth(selectedDate.getMonth());
              setCalendarYear(selectedDate.getFullYear());
              setShowDatePicker(true);
            }}
          >
            <Calendar color={filter === 'custom' ? Colors.textWhite : Colors.textSecondary} size={14} />
            <Text style={[styles.filterButtonText, filter === 'custom' && styles.filterButtonTextActive]}>
              {filter === 'custom' ? formatDate(selectedDate.toISOString()) : t('customDate')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIcon}>
              <DollarSign color={Colors.textWhite} size={24} />
            </View>
            <Text style={styles.statLabelLight}>{t('totalRevenue')}</Text>
            <Text style={styles.statValueLight}>{formatCurrency(stats.totalRevenue)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <ShoppingBag color={Colors.success} size={20} />
            </View>
            <Text style={styles.statLabel}>{t('totalOrders')}</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
              <TrendingUp color={Colors.warning} size={20} />
            </View>
            <Text style={styles.statLabel}>{t('avgOrderValue')}</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.avgOrderValue)}</Text>
          </View>
        </View>

        <View style={styles.orderTypeStats}>
          <View style={styles.orderTypeStat}>
            <Text style={styles.orderTypeLabel}>{t('tableOrders')}</Text>
            <Text style={styles.orderTypeValue}>{stats.tableOrders}</Text>
          </View>
          <View style={styles.orderTypeDivider} />
          <View style={styles.orderTypeStat}>
            <Text style={styles.orderTypeLabel}>{t('takeawayOrdersLabel')}</Text>
            <Text style={styles.orderTypeValue}>{stats.takeawayOrders}</Text>
          </View>
        </View>

        {chartData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>{t('salesOverview')}</Text>
            <View style={styles.chartCard}>
              <SimpleBarChart data={chartData} height={160} barColor={Colors.primary} />
            </View>
          </View>
        )}

        <View style={styles.topItemsSection}>
          <View style={styles.sectionHeader}>
            <Award color={Colors.warning} size={20} />
            <Text style={styles.sectionTitle}>{t('topSellingItems')}</Text>
          </View>
          
          {stats.topItems.length > 0 ? (
            stats.topItems.map((item, index) => (
              <View key={index} style={styles.topItemCard}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemStats}>
                    {item.quantity} {t('sold')} • {formatCurrency(item.revenue)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyTopItems}>
              <Text style={styles.emptyText}>{t('noSalesData')}</Text>
            </View>
          )}
        </View>

        <View style={styles.recentOrdersSection}>
          <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
          
          {filteredOrders.slice(0, 20).map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View style={styles.orderCardLeft}>
                  <Text style={styles.orderId}>
                    {order.billNumber ? `#${order.billNumber.toString().padStart(4, '0')}` : `#${order.id.slice(-6).toUpperCase()}`}
                  </Text>
                  <Text style={styles.orderDate}>
                    {order.completedAt ? formatDate(order.completedAt) : ''}
                  </Text>
                </View>
                <View style={styles.orderCardRight}>
                  <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                  <View style={styles.orderCardActions}>
                    <View style={[styles.orderTypeBadge, order.orderType === 'table' ? styles.orderTypeBadgeTable : styles.orderTypeBadgeTakeaway]}>
                      <Text style={styles.orderTypeBadgeText}>
                        {order.orderType === 'table' ? `${t('tableOrder')} ${order.tableNumber}` : t('takeaway')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editBillButton}
                      onPress={() => handleEditOrder(order)}
                    >
                      <Edit2 color={Colors.primary} size={14} />
                      <Text style={styles.editBillButtonText}>{t('editBill')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {filteredOrders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>{t('noCompletedOrders')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.datePickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{t('selectDate')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X color={Colors.text} size={22} />
              </TouchableOpacity>
            </View>
            {renderCalendar()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Billed Order Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditModal}
      >
        <SafeAreaView style={styles.editModalContainer} edges={['top']}>
          <View style={styles.editModalHeader}>
            <View>
              <Text style={styles.editModalTitle}>{t('editBilledOrder')}</Text>
              <Text style={styles.editModalSubtitle}>
                {editingOrder?.billNumber ? `Bill #${editingOrder.billNumber.toString().padStart(4, '0')}` : ''} • {editItems.length} {t('items')} • {formatCurrency(editSubtotal)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseEditModal} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.editModalContent}>
            <View style={styles.editMenuSection}>
              <TextInput
                style={styles.editSearchInput}
                placeholder={t('searchMenu')}
                value={editSearchQuery}
                onChangeText={setEditSearchQuery}
                placeholderTextColor={Colors.textSecondary}
              />
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.editCategoryScroll}
                contentContainerStyle={styles.editCategoryContainer}
              >
                <TouchableOpacity
                  style={[styles.editCategoryChip, editSelectedCategory === 'All' && styles.editCategoryChipActive]}
                  onPress={() => setEditSelectedCategory('All')}
                >
                  <Text style={[styles.editCategoryText, editSelectedCategory === 'All' && styles.editCategoryTextActive]}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                {MENU_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.editCategoryChip, editSelectedCategory === cat && styles.editCategoryChipActive]}
                    onPress={() => setEditSelectedCategory(cat)}
                  >
                    <Text style={[styles.editCategoryText, editSelectedCategory === cat && styles.editCategoryTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.editMenuList} showsVerticalScrollIndicator={false}>
                {filteredEditMenu.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.editMenuItem}
                    onPress={() => handleEditAddItem(item)}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.editMenuItemImage} />
                    ) : (
                      <View style={styles.editMenuItemImagePlaceholder}>
                        <ImageIcon color={Colors.textLight} size={20} />
                      </View>
                    )}
                    <View style={styles.editMenuItemInfo}>
                      <Text style={styles.editMenuItemName}>{item.name}</Text>
                      <Text style={styles.editMenuItemPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                    <View style={styles.editAddItemButton}>
                      <Plus color={Colors.primary} size={20} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.editOrderSection}>
              <Text style={styles.editOrderTitle}>{t('orderItems')}</Text>
              <ScrollView style={styles.editOrderList} showsVerticalScrollIndicator={false}>
                {editItems.map((item) => (
                  <View key={item.id} style={styles.editOrderItem}>
                    <View style={styles.editOrderItemInfo}>
                      <Text style={styles.editOrderItemName}>{item.menuItemName}</Text>
                      <Text style={styles.editOrderItemPrice}>
                        {formatCurrency(item.priceAtTime)} × {item.quantity} = {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.editQuantityControls}>
                      <TouchableOpacity
                        style={styles.editQtyButton}
                        onPress={() => handleEditUpdateQuantity(item.id, -1)}
                      >
                        <Minus color={Colors.danger} size={16} />
                      </TouchableOpacity>
                      <Text style={styles.editQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.editQtyButton}
                        onPress={() => handleEditUpdateQuantity(item.id, 1)}
                      >
                        <Plus color={Colors.success} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {editItems.length === 0 && (
                  <View style={styles.editEmptyOrder}>
                    <Text style={styles.editEmptyOrderText}>{t('noItemsYet')}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.editOrderSummary}>
                <View style={styles.editTotalRow}>
                  <Text style={styles.editTotalLabel}>{t('total')}</Text>
                  <Text style={styles.editTotalValue}>{formatCurrency(editSubtotal)}</Text>
                </View>
              </View>

              <View style={styles.editActionButtons}>
                <TouchableOpacity style={styles.editCancelButton} onPress={handleCloseEditModal}>
                  <X color={Colors.danger} size={18} />
                  <Text style={styles.editCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveButton} onPress={handleSaveEditedBill}>
                  <Check color={Colors.textWhite} size={18} />
                  <Text style={styles.editSaveButtonText}>{t('saveBillChanges')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edited Bill Preview Modal */}
      <Modal
        visible={showEditBillPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditBillPreview}
      >
        <SafeAreaView style={styles.editBillPreviewContainer} edges={['top']}>
          <View style={styles.editBillPreviewHeader}>
            <Text style={styles.editBillPreviewTitle}>{t('billPreview')}</Text>
            <TouchableOpacity onPress={handleCloseEditBillPreview} style={styles.closeButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>

          {editingOrder && (
            <View style={styles.editBillContent}>
              <BillPrinter
                order={editingOrder}
                settings={settings}
                onComplete={handleCloseEditBillPreview}
              />
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  exportButtonText: {
    color: Colors.textWhite,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterButtonDate: {
    flexDirection: 'row',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.textWhite,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '47%',
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    backgroundColor: Colors.primary,
    width: '100%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statLabelLight: {
    fontSize: 12,
    color: Colors.textWhite,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statValueLight: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.textWhite,
  },
  orderTypeStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  orderTypeStat: {
    flex: 1,
    alignItems: 'center',
  },
  orderTypeDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  orderTypeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  orderTypeValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chartSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  topItemsSection: {
    marginBottom: 20,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  topItemStats: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyTopItems: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  recentOrdersSection: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderTypeBadgeTable: {
    backgroundColor: Colors.successLight,
  },
  orderTypeBadgeTakeaway: {
    backgroundColor: '#E0E7FF',
  },
  orderTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editBillButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  emptyOrders: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  calendar: {},
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarDayEmpty: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
  },
  calendarDayFuture: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  calendarDayTodayText: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  calendarDaySelectedText: {
    color: Colors.textWhite,
    fontWeight: '700' as const,
  },
  calendarDayFutureText: {
    color: Colors.textLight,
  },
  salesDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.success,
    position: 'absolute',
    bottom: 4,
  },
  closeButton: {
    padding: 8,
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editModalContent: {
    flex: 1,
    flexDirection: 'row',
  },
  editMenuSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  editSearchInput: {
    margin: 12,
    padding: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    fontSize: 14,
    color: Colors.text,
  },
  editCategoryScroll: {
    maxHeight: 44,
  },
  editCategoryContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  editCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
  },
  editCategoryChipActive: {
    backgroundColor: Colors.primary,
  },
  editCategoryText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  editCategoryTextActive: {
    color: Colors.textWhite,
  },
  editMenuList: {
    flex: 1,
    padding: 12,
  },
  editMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  editMenuItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  editMenuItemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editMenuItemInfo: {
    flex: 1,
  },
  editMenuItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editMenuItemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editAddItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editOrderSection: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 12,
  },
  editOrderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  editOrderList: {
    flex: 1,
  },
  editOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 8,
  },
  editOrderItemInfo: {
    flex: 1,
  },
  editOrderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editOrderItemPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editQtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editQtyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  editEmptyOrder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  editEmptyOrderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  editOrderSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  editTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editTotalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editTotalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    gap: 8,
  },
  editCancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  editSaveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  editSaveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
  editBillPreviewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  editBillPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editBillPreviewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editBillContent: {
    flex: 1,
    padding: 16,
  },
});
