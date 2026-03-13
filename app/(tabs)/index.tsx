import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, ShoppingBag, Grid3X3, DollarSign } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SimpleBarChart } from '@/components/SimpleChart';
import { formatCurrency, isToday, isThisMonth, isThisYear, getLast7DaysSales, getLast12MonthsSales } from '@/utils/helpers';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const { completedOrders, tables, settings } = useApp();
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const todayOrders = completedOrders.filter(o => o.completedAt && isToday(o.completedAt));
    const monthOrders = completedOrders.filter(o => o.completedAt && isThisMonth(o.completedAt));
    const yearOrders = completedOrders.filter(o => o.completedAt && isThisYear(o.completedAt));
    const todayTakeaway = todayOrders.filter(o => o.orderType === 'takeaway');
    const activeTables = tables.filter(t => t.status === 'active');

    return {
      todaySales: todayOrders.reduce((sum, o) => sum + o.total, 0),
      monthSales: monthOrders.reduce((sum, o) => sum + o.total, 0),
      yearSales: yearOrders.reduce((sum, o) => sum + o.total, 0),
      todayOrderCount: todayOrders.length,
      todayTakeawayCount: todayTakeaway.length,
      activeTablesCount: activeTables.length,
      totalTables: tables.length,
    };
  }, [completedOrders, tables]);

  const last7Days = useMemo(() => {
    return getLast7DaysSales(completedOrders).map(d => ({
      label: d.date,
      value: d.total,
    }));
  }, [completedOrders]);

  const last12Months = useMemo(() => {
    return getLast12MonthsSales(completedOrders).map(d => ({
      label: d.month,
      value: d.total,
    }));
  }, [completedOrders]);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{settings.restaurantName}</Text>
        <Text style={styles.subtitle}>{t('billingSystem')}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIcon}>
              <DollarSign color={Colors.textWhite} size={24} />
            </View>
            <Text style={styles.statLabelLight}>{t('todaySales')}</Text>
            <Text style={styles.statValueLight}>{formatCurrency(stats.todaySales)}</Text>
            <Text style={styles.statSubLight}>{stats.todayOrderCount} {t('orders')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <TrendingUp color={Colors.success} size={24} />
            </View>
            <Text style={styles.statLabel}>{t('thisMonth')}</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.monthSales)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
              <TrendingUp color={Colors.warning} size={24} />
            </View>
            <Text style={styles.statLabel}>{t('thisYear')}</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.yearSales)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.dangerLight }]}>
              <Grid3X3 color={Colors.danger} size={24} />
            </View>
            <Text style={styles.statLabel}>{t('activeTables')}</Text>
            <Text style={styles.statValue}>{stats.activeTablesCount}/{stats.totalTables}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
              <ShoppingBag color="#6366F1" size={24} />
            </View>
            <Text style={styles.statLabel}>{t('takeawayToday')}</Text>
            <Text style={styles.statValue}>{stats.todayTakeawayCount}</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>{t('last7Days')}</Text>
          <View style={styles.chartCard}>
            <SimpleBarChart data={last7Days} height={140} barColor={Colors.primary} />
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>{t('monthlySales')}</Text>
          <View style={styles.chartCard}>
            <SimpleBarChart data={last12Months} height={140} barColor={Colors.success} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textWhite,
    opacity: 0.8,
    marginTop: 2,
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
    marginBottom: 24,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statLabelLight: {
    fontSize: 13,
    color: Colors.textWhite,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  statValueLight: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  statSubLight: {
    fontSize: 12,
    color: Colors.textWhite,
    opacity: 0.7,
    marginTop: 4,
  },
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
