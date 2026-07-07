import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initStocktakeIpc() {
  ipcMain.handle('stocktake:getAll', async () => {
    try {
      const db = await getDb();
      const rows = await db.all(`
        SELECT s.*, u.name as created_by_name 
        FROM inventory_stocktakes s
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.id DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error fetching stocktakes:', error);
      throw error;
    }
  });

  ipcMain.handle('stocktake:getById', async (_, id: number) => {
    try {
      const db = await getDb();
      const stocktake = await db.get(`SELECT * FROM inventory_stocktakes WHERE id = ?`, id);
      if (!stocktake) throw new Error('Stocktake not found');

      const items = await db.all(`
        SELECT i.*, p.name as product_name, p.code as product_code 
        FROM stocktake_items i
        JOIN products p ON i.product_id = p.id
        WHERE i.stocktake_id = ?
      `, id);

      return { ...stocktake, items };
    } catch (error) {
      console.error('Error fetching stocktake by id:', error);
      throw error;
    }
  });

  ipcMain.handle('stocktake:saveDraft', async (_, data: any) => {
    try {
      const db = await getDb();
      const { id, notes, created_by, items } = data;

      let stocktakeId = id;

      await db.run('BEGIN TRANSACTION');

      try {
        if (stocktakeId) {
          await db.run(`UPDATE inventory_stocktakes SET notes = ? WHERE id = ?`, notes, stocktakeId);
          // Delete old items
          await db.run(`DELETE FROM stocktake_items WHERE stocktake_id = ?`, stocktakeId);
        } else {
          // Generate stocktake number
          const result = await db.get(`SELECT COUNT(*) as count FROM inventory_stocktakes`);
          const count = result.count + 1;
          const stocktake_number = `STK-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
          
          const insertResult = await db.run(`
            INSERT INTO inventory_stocktakes (stocktake_number, date, status, notes, created_by) 
            VALUES (?, CURRENT_DATE, 'draft', ?, ?)
          `, stocktake_number, notes, created_by);
          
          stocktakeId = insertResult.lastID;
        }

        // Insert new items
        for (const item of items) {
          await db.run(`
            INSERT INTO stocktake_items (stocktake_id, product_id, system_qty, actual_qty, difference, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, stocktakeId, item.product_id, item.system_qty, item.actual_qty, item.difference, item.notes);
        }

        await db.run('COMMIT');
        return { success: true, id: stocktakeId };
      } catch (err) {
        await db.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error saving stocktake draft:', error);
      throw error;
    }
  });

  ipcMain.handle('stocktake:apply', async (_, id: number) => {
    try {
      const db = await getDb();
      
      await db.run('BEGIN TRANSACTION');
      try {
        const items = await db.all(`SELECT * FROM stocktake_items WHERE stocktake_id = ?`, id);
        
        for (const item of items) {
          // Update product stock directly
          await db.run(`UPDATE products SET current_stock = ? WHERE id = ?`, item.actual_qty, item.product_id);
        }

        await db.run(`UPDATE inventory_stocktakes SET status = 'applied' WHERE id = ?`, id);

        await db.run('COMMIT');
        return { success: true };
      } catch (err) {
        await db.run('ROLLBACK');
        throw err;
      }
    } catch (error) {
      console.error('Error applying stocktake:', error);
      throw error;
    }
  });

  ipcMain.handle('stocktake:delete', async (_, id: number) => {
    try {
      const db = await getDb();
      await db.run(`DELETE FROM inventory_stocktakes WHERE id = ? AND status = 'draft'`, id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting stocktake:', error);
      throw error;
    }
  });
}
