import { ipcMain } from 'electron';
import db from '../../database/db';

export function initEquipmentIpc() {
  // Get all equipments
  ipcMain.handle('equipment:getAll', async () => {
    try {
      const database = await db.getDb();
      return await database.all(`SELECT * FROM equipments ORDER BY created_at DESC`);
    } catch (e: any) {
      console.error("Error fetching equipments", e);
      throw e;
    }
  });

  // Create equipment
  ipcMain.handle('equipment:create', async (_, data) => {
    try {
      const database = await db.getDb();
      const result = await database.run(
        `INSERT INTO equipments (name, total_qty, available_qty, status, notes) VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.total_qty || 1, data.available_qty || 1, data.status || 'available', data.notes || '']
      );
      return result.lastID;
    } catch (e: any) {
      console.error("Error creating equipment", e);
      throw e;
    }
  });

  // Update equipment
  ipcMain.handle('equipment:update', async (_, id, data) => {
    try {
      const database = await db.getDb();
      await database.run(
        `UPDATE equipments SET name = ?, total_qty = ?, available_qty = ?, status = ?, notes = ? WHERE id = ?`,
        [data.name, data.total_qty, data.available_qty, data.status, data.notes, id]
      );
      return true;
    } catch (e: any) {
      console.error("Error updating equipment", e);
      throw e;
    }
  });

  // Delete equipment
  ipcMain.handle('equipment:delete', async (_, id) => {
    try {
      const database = await db.getDb();
      await database.run(`DELETE FROM equipments WHERE id = ?`, [id]);
      return true;
    } catch (e: any) {
      console.error("Error deleting equipment", e);
      throw e;
    }
  });

  // Get all loans
  ipcMain.handle('equipment:getLoans', async () => {
    try {
      const database = await db.getDb();
      return await database.all(`
        SELECT el.*, e.name as equipment_name 
        FROM equipment_loans el 
        JOIN equipments e ON el.equipment_id = e.id 
        ORDER BY el.created_at DESC
      `);
    } catch (e: any) {
      console.error("Error fetching equipment loans", e);
      throw e;
    }
  });

  // Loan equipment (Checkout)
  ipcMain.handle('equipment:loan', async (_, data) => {
    try {
      const database = await db.getDb();
      
      let finalStatus = 'active';
      if (data.return_date) {
        finalStatus = 'returned';
      }

      // Update available quantity only if it's an active loan
      if (finalStatus === 'active') {
        await database.run(
          `UPDATE equipments SET available_qty = available_qty - ? WHERE id = ? AND available_qty >= ?`,
          [data.qty_borrowed, data.equipment_id, data.qty_borrowed]
        );
      }

      // Create loan record
      const result = await database.run(
        `INSERT INTO equipment_loans (equipment_id, borrower_name, qty_borrowed, loan_date, expected_return_date, return_date, status, notes, created_by) 
         VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?, ?, ?, ?)`,
        [data.equipment_id, data.borrower_name, data.qty_borrowed, data.loan_date || null, data.expected_return_date || null, data.return_date || null, finalStatus, data.notes, data.created_by]
      );
      return result.lastID;
    } catch (e: any) {
      console.error("Error loaning equipment", e);
      throw e;
    }
  });

  // Return equipment (Checkin)
  ipcMain.handle('equipment:return', async (_, loan_id, data) => {
    try {
      const database = await db.getDb();
      
      // Get loan record to know the equipment and qty
      const loan: any = await database.get(`SELECT equipment_id, qty_borrowed, status FROM equipment_loans WHERE id = ?`, [loan_id]);
      
      if (loan && loan.status === 'active') {
        // Update loan status
        await database.run(
          `UPDATE equipment_loans SET status = 'returned', return_date = CURRENT_DATE, notes = notes || ? WHERE id = ?`,
          [data.notes ? '\n' + data.notes : '', loan_id]
        );

        // Increase available quantity
        await database.run(
          `UPDATE equipments SET available_qty = available_qty + ? WHERE id = ?`,
          [loan.qty_borrowed, loan.equipment_id]
        );
      }
      return true;
    } catch (e: any) {
      console.error("Error returning equipment", e);
      throw e;
    }
  });
}
