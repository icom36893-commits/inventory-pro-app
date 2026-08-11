import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initProductsIpc() {
  ipcMain.handle('products:getAll', async (_, params: any = {}) => {
    const db = await getDb();
    const { page = 1, limit = 10, search = '' } = params;
    const offset = (page - 1) * limit;

    let query = `
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE (p.name LIKE ? OR p.code LIKE ?)
    `;
    const queryParams: any[] = [`%${search}%`, `%${search}%`];

    if (params.category_id) {
      query += ` AND p.category_id = ?`;
      queryParams.push(params.category_id);
    }

    if (params.is_initial !== undefined) {
      query += ` AND p.is_initial = ?`;
      queryParams.push(params.is_initial);
    }

    const total = await db.get(`SELECT COUNT(*) as count ${query}`, ...queryParams);
    const data = await db.all(`
      SELECT p.*, c.name as category_name, u.name as unit_name 
      ${query}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, ...queryParams, limit, offset);

    return { data, total: total.count, page, limit };
  });

  ipcMain.handle('products:search', async (_, query) => {
    const db = await getDb();
    return db.all(`
      SELECT p.*, c.name as category_name, u.name as unit_name, w.name as warehouse_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.name LIKE ? OR p.code LIKE ?
    `, `%${query}%`, `%${query}%`);
  });

  ipcMain.handle('products:create', async (_, data) => {
    const db = await getDb();
    let { code } = data;
    const { name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, warehouse_id, allow_negative_stock } = data;
    
    if (!code || code.includes('PRD-')) {
      const lastProduct = await db.get(`SELECT code FROM products WHERE code LIKE 'PRD-%' ORDER BY id DESC LIMIT 1`);
      let nextNum = 1;
      if (lastProduct && lastProduct.code) {
        const numPart = lastProduct.code.replace('PRD-', '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
      }
      code = `PRD-${nextNum.toString().padStart(4, '0')}`;
    }

    const result = await db.run(`
      INSERT INTO products (code, name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, current_stock, warehouse_id, allow_negative_stock, is_initial)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, name, category_id, unit_id, purchase_price, sale_price, currency || 'IQD', opening_stock, opening_stock, warehouse_id, allow_negative_stock ? 1 : 0, data.is_initial ? 1 : 0);
    return { id: result.lastID };
  });

  ipcMain.handle('products:update', async (_, id, data) => {
    const db = await getDb();
    if (data.allow_negative_stock !== undefined) {
      data.allow_negative_stock = data.allow_negative_stock ? 1 : 0;
    }
    
    if (data.is_initial === 1) {
      const current = await db.get('SELECT purchase_price, sale_price FROM products WHERE id = ?', id);
      if (current) {
        data.original_purchase_price = current.purchase_price;
        data.original_sale_price = current.sale_price;
      }
    }

    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await db.run(`UPDATE products SET ${setClause} WHERE id = ?`, ...values, id);
    return { success: true };
  });

  ipcMain.handle('products:restoreFromInitial', async (_, id) => {
    const db = await getDb();
    
    const prod = await db.get('SELECT original_purchase_price, original_sale_price FROM products WHERE id = ?', id);
    
    let lastPurchasePrice = 0;
    let lastSalePrice = 0;

    if (prod && (prod.original_purchase_price > 0 || prod.original_sale_price > 0)) {
      lastPurchasePrice = prod.original_purchase_price;
      lastSalePrice = prod.original_sale_price;
    } else {
      const lastPurchase = await db.get(`
        SELECT ii.unit_price 
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = ? AND i.type = 'purchase'
        ORDER BY i.date DESC, i.id DESC
        LIMIT 1
      `, id);
      lastPurchasePrice = lastPurchase ? lastPurchase.unit_price : 0;
    }
    
    await db.run('UPDATE products SET is_initial = 0, purchase_price = ?, sale_price = ? WHERE id = ?', lastPurchasePrice, lastSalePrice, id);
    
    return { success: true, restoredPrice: lastPurchasePrice };
  });

  ipcMain.handle('products:delete', async (_, id) => {
    const db = await getDb();
    await db.run('DELETE FROM products WHERE id = ?', id);
    return { success: true };
  });

  ipcMain.handle('products:getMovements', async (_, id) => {
    const db = await getDb();
    return await db.all(`
      SELECT 
        i.id as invoice_id,
        i.invoice_number, 
        i.type, 
        i.date, 
        ii.quantity,
        i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE ii.product_id = ?
      ORDER BY i.date DESC, i.id DESC
    `, id);
  });

  // Categories and Units
  ipcMain.handle('categories:getAll', async () => {
    const db = await getDb();
    return db.all('SELECT * FROM product_categories');
  });

  ipcMain.handle('units:getAll', async () => {
    const db = await getDb();
    return db.all('SELECT * FROM units');
  });
}
