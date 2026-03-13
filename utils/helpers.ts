import { Order, Settings } from '@/types';

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

export function isThisYear(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
}

export function getDateRange(filter: 'today' | 'week' | 'month' | 'year' | 'custom', customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (filter) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end,
      };
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
        end,
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
        end,
      };
    case 'custom':
      return {
        start: customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end: customEnd ? new Date(customEnd) : end,
      };
    default:
      return { start: new Date(0), end };
  }
}

export function filterOrdersByDate(orders: Order[], start: Date, end: Date): Order[] {
  return orders.filter(order => {
    if (!order.completedAt) return false;
    const orderDate = new Date(order.completedAt);
    return orderDate >= start && orderDate <= end;
  });
}

export function getLast7DaysSales(orders: Order[]): { date: string; total: number }[] {
  const result: { date: string; total: number }[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayOrders = orders.filter(order => {
      if (!order.completedAt) return false;
      return order.completedAt.startsWith(dateStr);
    });
    
    const total = dayOrders.reduce((sum, order) => sum + order.total, 0);
    
    result.push({
      date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      total,
    });
  }
  
  return result;
}

export function getLast12MonthsSales(orders: Order[]): { month: string; total: number }[] {
  const result: { month: string; total: number }[] = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7);
    
    const monthOrders = orders.filter(order => {
      if (!order.completedAt) return false;
      return order.completedAt.startsWith(monthStr);
    });
    
    const total = monthOrders.reduce((sum, order) => sum + order.total, 0);
    
    result.push({
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      total,
    });
  }
  
  return result;
}

export function getTopSellingItems(orders: Order[], limit: number = 5): { name: string; quantity: number; revenue: number }[] {
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemMap.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
      } else {
        itemMap.set(item.menuItemId, {
          name: item.menuItemName,
          quantity: item.quantity,
          revenue: item.total,
        });
      }
    });
  });
  
  return Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export function getBillNumberDisplay(order: Order): string {
  if (!order.billNumber) return 'PREVIEW';
  const orderDate = order.completedAt ? new Date(order.completedAt) : new Date();
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const year = orderDate.getFullYear().toString().slice(-2);
  return `${month}${year}-${order.billNumber.toString().padStart(4, '0')}`;
}

export function generateBillHTML(order: Order, settings: Settings): string {
  const billNumber = getBillNumberDisplay(order);
  
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="text-align:left;padding:4px 0;">${item.menuItemName}</td>
      <td style="text-align:center;padding:4px 0;">${item.quantity}</td>
      <td style="text-align:right;padding:4px 0;">${formatCurrency(item.priceAtTime)}</td>
      <td style="text-align:right;padding:4px 0;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          width: 80mm; 
          margin: 0 auto; 
          padding: 10px;
          color: #000;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .restaurant-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .address { font-size: 10px; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .bill-number { text-align: center; font-size: 14px; font-weight: bold; margin: 8px 0; }
        .info { font-size: 11px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; border-bottom: 1px solid #000; padding: 4px 0; }
        .totals { margin-top: 8px; }
        .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
        .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 15px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">${settings.restaurantName}</div>
        <div class="address">${settings.address}</div>
        ${settings.gstNumber ? `<div class="address">GST: ${settings.gstNumber}</div>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="bill-number">Bill No: ${billNumber}</div>
      <div class="info">Type: ${order.orderType === 'table' ? `Table ${order.tableNumber}` : 'Takeaway'}</div>
      <div class="info">Date: ${formatDateTime(order.createdAt)}</div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <div class="totals">
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
      </div>
      
      <div class="footer">
        <div class="divider"></div>
        <p>Thank you for dining with us!</p>
        <p>Visit again!</p>
      </div>
    </body>
    </html>
  `;
}

export function generateCSV(orders: Order[]): string {
  const headers = ['Bill No', 'Order ID', 'Type', 'Table', 'Date', 'Time', 'Items', 'Total'];
  const rows = orders.map(order => [
    getBillNumberDisplay(order),
    order.id.slice(-8).toUpperCase(),
    order.orderType,
    order.tableNumber || 'N/A',
    order.completedAt ? formatDate(order.completedAt) : '',
    order.completedAt ? formatTime(order.completedAt) : '',
    order.items.length,
    order.total.toFixed(2),
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
