import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Printer, Share2 } from 'lucide-react-native';
import { Order, Settings } from '@/types';
import { formatCurrency, formatDateTime, generateBillHTML } from '@/utils/helpers';
import Colors from '@/constants/colors';

interface BillPrinterProps {
  order: Order;
  settings: Settings;
  onComplete?: () => void;
}

export function BillPrinter({ order, settings, onComplete }: BillPrinterProps) {
  const handlePrint = async () => {
    try {
      const html = generateBillHTML(order, settings);
      
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 250);
        }
      } else {
        Alert.alert('Print', 'Please use the web version for printing, or take a screenshot of the bill.');
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Unable to print bill. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const billText = generateBillText(order, settings);
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ text: billText });
        } else {
          await navigator.clipboard.writeText(billText);
          Alert.alert('Copied', 'Bill details copied to clipboard');
        }
      } else {
        Alert.alert('Share', 'Sharing is available on web. Use the web version for sharing.');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getBillNumberDisplay = () => {
    if (!order.billNumber) return 'PREVIEW';
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    return `${month}${year}-${order.billNumber.toString().padStart(4, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.billPreview}>
        <ScrollView style={styles.billScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.billHeader}>
            <Text style={styles.restaurantName}>{settings.restaurantName}</Text>
            <Text style={styles.address}>{settings.address}</Text>
            {settings.gstNumber ? (
              <Text style={styles.gst}>GST: {settings.gstNumber}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.billNumberSection}>
            <Text style={styles.billNumberLabel}>Bill No:</Text>
            <Text style={styles.billNumberValue}>{getBillNumberDisplay()}</Text>
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.infoText}>
              Type: {order.orderType === 'table' ? `Table ${order.tableNumber}` : 'Takeaway'}
            </Text>
            <Text style={styles.infoText}>Date: {formatDateTime(order.createdAt)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.itemsHeader}>
            <Text style={[styles.itemHeaderText, { flex: 2 }]}>Item</Text>
            <Text style={[styles.itemHeaderText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.itemHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.itemHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={1}>{item.menuItemName}</Text>
              <Text style={[styles.itemText, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.priceAtTime)}</Text>
              <Text style={[styles.itemText, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalsSection}>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for dining with us!</Text>
            <Text style={styles.footerText}>Visit again!</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 color={Colors.primary} size={20} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Printer color={Colors.textWhite} size={20} />
          <Text style={styles.printButtonText}>Print Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function generateBillText(order: Order, settings: Settings): string {
  const lines: string[] = [];
  
  const getBillNumberDisplay = () => {
    if (!order.billNumber) return 'PREVIEW';
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    return `${month}${year}-${order.billNumber.toString().padStart(4, '0')}`;
  };
  
  lines.push(settings.restaurantName);
  lines.push(settings.address);
  if (settings.gstNumber) lines.push(`GST: ${settings.gstNumber}`);
  lines.push('');
  lines.push(`Bill No: ${getBillNumberDisplay()}`);
  lines.push(`Type: ${order.orderType === 'table' ? `Table ${order.tableNumber}` : 'Takeaway'}`);
  lines.push(`Date: ${formatDateTime(order.createdAt)}`);
  lines.push('');
  lines.push('-'.repeat(40));
  
  order.items.forEach(item => {
    lines.push(`${item.menuItemName}`);
    lines.push(`  ${item.quantity} x ${formatCurrency(item.priceAtTime)} = ${formatCurrency(item.total)}`);
  });
  
  lines.push('-'.repeat(40));
  lines.push(`TOTAL: ${formatCurrency(order.total)}`);
  lines.push('');
  lines.push('Thank you! Visit again!');
  
  return lines.join('\n');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  billPreview: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  billScroll: {
    flex: 1,
  },
  billHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  address: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  gst: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  billNumberSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  billNumberLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  billNumberValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderInfo: {
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemHeaderText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  itemText: {
    fontSize: 12,
    color: Colors.text,
  },
  totalsSection: {
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grandTotalRow: {
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  printButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    gap: 8,
  },
  printButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
});
