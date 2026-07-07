import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initReportsIpc() {
  ipcMain.handle('reports:getIncomeStatement', async (_, { startDate, endDate }) => {
    const db = await getDb();
    
    const revenues = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'income' AND date BETWEEN ? AND ?
      GROUP BY category
    `, [startDate, endDate]);

    const expenses = await db.all(`
      SELECT category as name, SUM(amount) as value 
      FROM treasury_transactions 
      WHERE type = 'expense' AND date BETWEEN ? AND ?
      GROUP BY category
    `, [startDate, endDate]);

    const totalRevenue = revenues.reduce((sum: number, item: any) => sum + item.value, 0);
    const totalExpense = expenses.reduce((sum: number, item: any) => sum + item.value, 0);

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense
    };
  });

  ipcMain.handle('reports:getSales', async (_, { startDate, endDate }) => {
    const db = await getDb();
    return await db.all(`
      SELECT i.invoice_number, i.date, i.total, i.currency, i.payment_method, p.name as party_name
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'sale' AND i.date BETWEEN ? AND ?
      ORDER BY i.date DESC
    `, [startDate, endDate]);
  });

  ipcMain.handle('reports:getPurchases', async (_, { startDate, endDate }) => {
    const db = await getDb();
    return await db.all(`
      SELECT i.invoice_number, i.date, i.total, i.currency, i.payment_method, p.name as party_name
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
      ORDER BY i.date DESC
    `, [startDate, endDate]);
  });

  ipcMain.handle('reports:getPurchasePrices', async (_, { startDate, endDate, productName }) => {
    const db = await getDb();
    
    let query = `
      SELECT 
        p.name as product_name, 
        p.code as product_code,
        s.name as supplier_name,
        i.date,
        i.invoice_number,
        ii.unit_price as purchase_price,
        ii.quantity,
        i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      LEFT JOIN parties s ON i.party_id = s.id
      WHERE i.type = 'purchase' AND i.date >= ? AND i.date <= ?
    `;
    const params: any[] = [startDate, endDate];

    if (productName && productName.trim() !== '') {
      query += ` AND p.name LIKE ?`;
      params.push(`%${productName}%`);
    }

    query += ` ORDER BY i.date DESC`;
    
    return await db.all(query, ...params);
  });

  ipcMain.handle('reports:getInventoryMovement', async (_, { startDate, endDate }) => {
    const db = await getDb();
    // Simplified movement based on invoices
    return await db.all(`
      SELECT 
        p.name as product_name,
        p.code as product_code,
        SUM(CASE WHEN i.type = 'purchase' OR i.type = 'sale_return' THEN ii.quantity ELSE 0 END) as inward,
        SUM(CASE WHEN i.type = 'sale' OR i.type = 'purchase_return' THEN ii.quantity ELSE 0 END) as outward,
        p.current_stock
      FROM products p
      LEFT JOIN invoice_items ii ON p.id = ii.product_id
      LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.date BETWEEN ? AND ?
      GROUP BY p.id
    `, [startDate, endDate]);
  });

  ipcMain.handle('reports:getBalances', async (_, { type }) => {
    const db = await getDb();
    return await db.all(`
      SELECT name, phone, current_balance_iqd, current_balance_usd 
      FROM parties 
      WHERE type = ? AND (current_balance_iqd > 0 OR current_balance_usd > 0)
      ORDER BY current_balance_iqd DESC
    `, [type]);
  });

  ipcMain.handle('reports:getBalanceSheet', async () => {
    const db = await getDb();
    
    // Assets
    const treasury = await db.get(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance
      FROM treasury_transactions
    `);
    
    const inventory = await db.get(`
      SELECT SUM(current_stock * purchase_price) as value FROM products
    `);
    
    const customers = await db.get(`
      SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer'
    `);

    // Liabilities
    const suppliers = await db.get(`
      SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'supplier'
    `);

    return {
      assets: {
        treasury: treasury?.balance || 0,
        inventory: inventory?.value || 0,
        customers: customers?.total || 0,
        total: (treasury?.balance || 0) + (inventory?.value || 0) + (customers?.total || 0)
      },
      liabilities: {
        suppliers: suppliers?.total || 0,
        total: suppliers?.total || 0
      }
    };
  });
}
