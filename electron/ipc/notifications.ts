import { ipcMain } from 'electron';
import dbManager from '../../database/db';

export function setupNotificationsIPC() {
  ipcMain.handle('notifications:getAll', async () => {
    const db = await dbManager.getDb();
    return await db.all('SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 100');
  });

  ipcMain.handle('notifications:markAsRead', async (_, id: number) => {
    const db = await dbManager.getDb();
    const result = await db.run('UPDATE system_notifications SET is_read = 1 WHERE id = ?', [id]);
    return { success: result.changes !== undefined && result.changes > 0 };
  });

  ipcMain.handle('notifications:markAllAsRead', async () => {
    const db = await dbManager.getDb();
    const result = await db.run('UPDATE system_notifications SET is_read = 1 WHERE is_read = 0');
    return { success: result.changes !== undefined && result.changes > 0 };
  });

  ipcMain.handle('notifications:clearAll', async () => {
    const db = await dbManager.getDb();
    const result = await db.run('DELETE FROM system_notifications');
    return { success: result.changes !== undefined && result.changes > 0 };
  });

  ipcMain.handle('notifications:add', async (_, { text, type }) => {
    await createSystemNotification(text, type);
    return { success: true };
  });

  let isCheckingLowStock = false;

  ipcMain.handle('notifications:checkLowStock', async () => {
    if (isCheckingLowStock) return { success: true };
    isCheckingLowStock = true;
    
    try {
      const db = await dbManager.getDb();
      
      // Check if we already alerted today based on company_settings
      const settings = await db.get('SELECT last_low_stock_alert_date FROM company_settings LIMIT 1');
      const today = new Date().toISOString().split('T')[0];
      
      if (settings && settings.last_low_stock_alert_date === today) {
        return { success: true };
      }

      const lowStock = await db.all(`
        SELECT name, current_stock 
        FROM products 
        WHERE current_stock <= 5
      `);
      
      if (lowStock.length > 0) {
        let text = `يوجد لديك ${lowStock.length} أصناف وصلت إلى حد النواقص (الكمية 5 أو أقل).`;
        
        // Optional: List a few of them
        const names = lowStock.slice(0, 3).map(p => p.name).join('، ');
        if (names) {
          text += ` من ضمنها: ${names}${lowStock.length > 3 ? '...' : '.'}`;
        }
        
        
        await createSystemNotification(text, 'low_stock_summary');
        
        // Update the date so it doesn't trigger again today even if deleted
        await db.run('UPDATE company_settings SET last_low_stock_alert_date = ?', today);
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    } finally {
      isCheckingLowStock = false;
    }
  });
}

// دالة مساعدة لإنشاء إشعار من الباك إند
export async function createSystemNotification(text: string, type: string = 'general') {
  try {
    const db = await dbManager.getDb();
    
    // منع تكرار إشعارات النسخ الاحتياطي في نفس اليوم
    if (type === 'backup') {
      const exists = await db.get(`
        SELECT id FROM system_notifications 
        WHERE type = ? AND date(created_at) = date('now', 'localtime')
      `, [type]);
      
      if (exists) return; // تم إرسال إشعار من هذا النوع اليوم
    }
    
    await db.run(
      'INSERT INTO system_notifications (text, type, is_read) VALUES (?, ?, 0)',
      [text, type]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
