import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initBasicDataIpc() {
  // Categories
  ipcMain.handle('basicData:getCategories', async () => {
    const db = await getDb();
    return await db.all('SELECT * FROM product_categories ORDER BY id DESC');
  });

  ipcMain.handle('basicData:createCategory', async (_, data) => {
    const db = await getDb();
    const result = await db.run('INSERT INTO product_categories (name, description) VALUES (?, ?)', [data.name, data.description || '']);
    return result.lastID;
  });

  ipcMain.handle('basicData:deleteCategory', async (_, id) => {
    const db = await getDb();
    await db.run('DELETE FROM product_categories WHERE id = ?', [id]);
    return true;
  });

  // Units
  ipcMain.handle('basicData:getUnits', async () => {
    const db = await getDb();
    return await db.all('SELECT * FROM units ORDER BY id DESC');
  });

  ipcMain.handle('basicData:createUnit', async (_, data) => {
    const db = await getDb();
    const result = await db.run('INSERT INTO units (name) VALUES (?)', [data.name]);
    return result.lastID;
  });

  ipcMain.handle('basicData:deleteUnit', async (_, id) => {
    const db = await getDb();
    await db.run('DELETE FROM units WHERE id = ?', [id]);
    return true;
  });

  // Warehouses
  ipcMain.handle('basicData:getWarehouses', async () => {
    const db = await getDb();
    return await db.all('SELECT * FROM warehouses ORDER BY id DESC');
  });

  ipcMain.handle('basicData:createWarehouse', async (_, data) => {
    const db = await getDb();
    const result = await db.run('INSERT INTO warehouses (name, location, is_active) VALUES (?, ?, 1)', [data.name, data.location || '']);
    return result.lastID;
  });

  ipcMain.handle('basicData:deleteWarehouse', async (_, id) => {
    const db = await getDb();
    await db.run('DELETE FROM warehouses WHERE id = ?', [id]);
    return true;
  });

  // Treasury Categories
  ipcMain.handle('basicData:getTreasuryCategories', async () => {
    const db = await getDb();
    return await db.all('SELECT * FROM treasury_categories ORDER BY id DESC');
  });

  ipcMain.handle('basicData:createTreasuryCategory', async (_, data) => {
    const db = await getDb();
    const result = await db.run('INSERT INTO treasury_categories (name, type, is_system) VALUES (?, ?, 0)', [data.name, data.type]);
    return result.lastID;
  });

  ipcMain.handle('basicData:deleteTreasuryCategory', async (_, id) => {
    const db = await getDb();
    // Prevent deletion of system categories
    const cat = await db.get('SELECT is_system FROM treasury_categories WHERE id = ?', [id]);
    if (cat && cat.is_system) {
      throw new Error('لا يمكن حذف التصنيفات الأساسية للنظام');
    }
    await db.run('DELETE FROM treasury_categories WHERE id = ?', [id]);
    return true;
  });
  // Fund Categories
  ipcMain.handle('basicData:getFundCategories', async () => {
    const db = await getDb();
    return await db.all('SELECT * FROM fund_categories ORDER BY id DESC');
  });

  ipcMain.handle('basicData:createFundCategory', async (_, data) => {
    const db = await getDb();
    const result = await db.run('INSERT INTO fund_categories (name, is_system) VALUES (?, 0)', [data.name]);
    return result.lastID;
  });

  ipcMain.handle('basicData:deleteFundCategory', async (_, id) => {
    const db = await getDb();
    const cat = await db.get('SELECT is_system FROM fund_categories WHERE id = ?', [id]);
    if (cat && cat.is_system) {
      throw new Error('لا يمكن حذف التصنيفات الأساسية للنظام');
    }
    await db.run('DELETE FROM fund_categories WHERE id = ?', [id]);
    return true;
  });
}
