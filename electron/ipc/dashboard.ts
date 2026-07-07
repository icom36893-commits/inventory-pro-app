import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initDashboardIpc() {
  ipcMain.handle('dashboard:getStats', async () => {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 8) + '01';

    // إجمالي المبيعات
    const salesIQD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'sale' AND currency = 'IQD' AND date >= ?`, [monthStart]);
    const salesUSD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'sale' AND currency = 'USD' AND date >= ?`, [monthStart]);

    // إجمالي المشتريات
    const purchasesIQD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'purchase' AND currency = 'IQD' AND date >= ?`, [monthStart]);
    const purchasesUSD = await db.get(`SELECT SUM(total) as total FROM invoices WHERE type = 'purchase' AND currency = 'USD' AND date >= ?`, [monthStart]);

    // رصيد الخزينة
    const treasuryIncomeIQD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'IQD'`);
    const treasuryExpenseIQD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'IQD'`);
    const treasuryIncomeUSD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'USD'`);
    const treasuryExpenseUSD = await db.get(`SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'USD'`);

    // مديونيات العملاء
    const customerDebtIQD = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer' AND current_balance_iqd > 0`);
    const customerDebtUSD = await db.get(`SELECT SUM(current_balance_usd) as total FROM parties WHERE type = 'customer' AND current_balance_usd > 0`);
    
    return {
      totalSalesIQD: salesIQD?.total || 0,
      totalSalesUSD: salesUSD?.total || 0,
      totalPurchasesIQD: purchasesIQD?.total || 0,
      totalPurchasesUSD: purchasesUSD?.total || 0,
      treasuryBalanceIQD: (treasuryIncomeIQD?.total || 0) - (treasuryExpenseIQD?.total || 0),
      treasuryBalanceUSD: (treasuryIncomeUSD?.total || 0) - (treasuryExpenseUSD?.total || 0),
      customerDebtIQD: customerDebtIQD?.total || 0,
      customerDebtUSD: customerDebtUSD?.total || 0
    };
  });

  ipcMain.handle('dashboard:getCharts', async () => {
    const db = await getDb();
    
    // آخر 7 أيام للحركة البيانية
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const chartDataRaw = await db.all(`
      SELECT date, type, SUM(total) as total 
      FROM invoices 
      WHERE date >= ? AND status = 'confirmed'
      GROUP BY date, type
      ORDER BY date ASC
    `, [dateLimit]);

    // تحويل البيانات لتناسب Recharts
    const chartMap = new Map();
    chartDataRaw.forEach((row: any) => {
      const date = row.date.substring(5); // جلب الشهر واليوم فقط
      if (!chartMap.has(date)) {
        chartMap.set(date, { name: date, sales: 0, purchases: 0 });
      }
      if (row.type === 'sale') chartMap.get(date).sales += row.total;
      if (row.type === 'purchase') chartMap.get(date).purchases += row.total;
    });

    // المصروفات
    const expensesRaw = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'expense'
      GROUP BY category
    `);

    // آخر 5 فواتير مبيعات
    const latestInvoices = await db.all(`
      SELECT i.invoice_number, i.total, i.currency, i.status, p.name as party_name 
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'sale'
      ORDER BY i.id DESC LIMIT 5
    `);

    // أصناف منخفضة المخزون
    const lowStock = await db.all(`
      SELECT name, current_stock 
      FROM products 
      WHERE current_stock <= 5
      ORDER BY current_stock ASC LIMIT 5
    `);

    return {
      lineChart: Array.from(chartMap.values()),
      pieChart: expensesRaw.length ? expensesRaw : [{ name: 'لا توجد بيانات', value: 1 }],
      latestInvoices,
      lowStock
    };
  });
}
