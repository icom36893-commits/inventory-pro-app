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
      SELECT p.*, c.name as category_name, u.name as unit_name 
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.name LIKE ? OR p.code LIKE ?
    `, `%${query}%`, `%${query}%`);
  });

  ipcMain.handle('products:create', async (_, data) => {
    const db = await getDb();
    let { code, name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, warehouse_id, allow_negative_stock } = data;
    
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
      INSERT INTO products (code, name, category_id, unit_id, purchase_price, sale_price, currency, opening_stock, current_stock, warehouse_id, allow_negative_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, name, category_id, unit_id, purchase_price, sale_price, currency || 'IQD', opening_stock, opening_stock, warehouse_id, allow_negative_stock ? 1 : 0);
    return { id: result.lastID };
  });

  ipcMain.handle('products:update', async (_, id, data) => {
    const db = await getDb();
    if (data.allow_negative_stock !== undefined) {
      data.allow_negative_stock = data.allow_negative_stock ? 1 : 0;
    }
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await db.run(`UPDATE products SET ${setClause} WHERE id = ?`, ...values, id);
    return { success: true };
  });

  ipcMain.handle('products:delete', async (_, id) => {
    const db = await getDb();
    await db.run('DELETE FROM products WHERE id = ?', id);
    return { success: true };
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
