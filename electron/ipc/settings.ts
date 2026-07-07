import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import { getDb, closeDb } from '../../database/db';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { initTelegramBot } from '../telegramBot';

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(process.cwd(), 'database', 'inventory.db')
  : path.join(app.getPath('userData'), 'inventory.db');

export function initSettingsIpc() {
  ipcMain.handle('settings:get', async () => {
    try {
      const db = await getDb();
      const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
      return settings || {
        name: 'المخزون برو',
        currency: 'SAR',
        tax_rate: 15.0,
        tax_enabled: 1
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:update', async (_, data) => {
    try {
      const db = await getDb();
      const keys = Object.keys(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = Object.values(data);
      
      const existing = await db.get('SELECT id FROM company_settings LIMIT 1');
      
      if (existing) {
        await db.run(`UPDATE company_settings SET ${setClause} WHERE id = ?`, ...values, existing.id);
      } else {
        const columns = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        await db.run(`INSERT INTO company_settings (${columns}) VALUES (${placeholders})`, ...values);
      }
      
      // Reload Telegram Bot if settings changed
      initTelegramBot();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:exportBackup', async () => {
    try {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dd = pad(now.getDate());
      const mm = pad(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      const hh = pad(now.getHours());
      const min = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const dateStr = `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;

      const win = BrowserWindow.getFocusedWindow();
      const options = {
        title: 'حفظ نسخة احتياطية',
        defaultPath: `Inventory_Pro_System_${dateStr}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }, { name: 'All Files', extensions: ['*'] }]
      };
      
      const { canceled, filePath } = win 
        ? await dialog.showSaveDialog(win, options)
        : await dialog.showSaveDialog(options); 

      if (!canceled && filePath) {
        // Use VACUUM INTO to guarantee a fully consistent backup including all data currently in memory/WAL
        const db = await getDb();
        await db.run(`VACUUM INTO '${filePath}'`);
        
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:importBackup', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'استيراد نسخة احتياطية',
        properties: ['openFile'],
        filters: [{ name: 'Database Files', extensions: ['db', 'sqlite'] }]
      });

      if (!canceled && filePaths.length > 0) {
        // Close DB before overwriting
        await closeDb();

        // Delete WAL and SHM files if they exist to prevent SQLite from applying old WAL data to the new DB file
        const walPath = dbPath + '-wal';
        const shmPath = dbPath + '-shm';
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

        fs.copyFileSync(filePaths[0], dbPath);
        
        // Re-open the DB so the system continues running normally
        await getDb();
        
        // Relaunch the app window instead of exiting the process
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows.forEach(win => win.reload());
        }
        
        return { success: true };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error importing backup:', error);
      throw error;
    }
  });
  ipcMain.handle('settings:selectDirectory', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'تحديد مجلد النسخ الاحتياطي (Google Drive)',
        properties: ['openDirectory']
      });

      if (!canceled && filePaths.length > 0) {
        return { success: true, filePath: filePaths[0] };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error selecting directory:', error);
      throw error;
    }
  });
  ipcMain.handle('settings:saveBase64File', async (_, data) => {
    try {
      const { base64, defaultName } = data;
      const win = BrowserWindow.getFocusedWindow();
      const options = {
        title: 'حفظ الملف',
        defaultPath: defaultName,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }, { name: 'All Files', extensions: ['*'] }]
      };
      
      const { canceled, filePath } = win 
        ? await dialog.showSaveDialog(win, options)
        : await dialog.showSaveDialog(options);

      if (!canceled && filePath) {
        // base64 comes as "data:application/pdf;base64,JVBERi0xLjQKJ...."
        const base64Data = base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        fs.writeFileSync(filePath, base64Data, 'base64');
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:printToPDF', async (event, data) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return { success: false, error: 'No active window' };
      
      const { defaultName } = data;
      const options = {
        title: 'حفظ PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }, { name: 'All Files', extensions: ['*'] }]
      };
      
      const { canceled, filePath } = await dialog.showSaveDialog(win, options);
      
      if (!canceled && filePath) {
        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          landscape: true,
          pageSize: 'A4',
          margins: { marginType: 'default' }
        });
        fs.writeFileSync(filePath, pdfBuffer);
        return { success: true, filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error generating PDF via Electron:', error);
      throw error;
    }
  });

  ipcMain.handle('settings:installLocalUpdate', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return { success: false, error: 'No active window' };
      
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'اختر ملف التحديث',
        properties: ['openFile'],
        filters: [{ name: 'Executable Files', extensions: ['exe'] }]
      });
      
      if (!canceled && filePaths.length > 0) {
        const updateFilePath = filePaths[0];
        const installerProcess = spawn(updateFilePath, [], {
          detached: true,
          stdio: 'ignore'
        });
        installerProcess.unref();
        setTimeout(() => {
          app.quit();
        }, 1000);
        return { success: true };
      }
      return { success: false, canceled: true };
    } catch (error: any) {
      console.error('Error starting local update:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:closeFiscalYear', async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      
      const win = BrowserWindow.getFocusedWindow();
      const options = {
        title: 'أرشفة وحفظ بيانات السنة المنتهية',
        defaultPath: `Archive_Year_${year}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }, { name: 'All Files', extensions: ['*'] }]
      };
      
      const { canceled, filePath } = win 
        ? await dialog.showSaveDialog(win, options)
        : await dialog.showSaveDialog(options); 
        
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      const db = await getDb();
      
      // 1. Backup the DB
      await db.run(`VACUUM INTO '${filePath}'`);
      
      // 2. Perform the balancing and truncation
      await db.run('BEGIN TRANSACTION');
      try {
        // Carry over party balances
        const parties = await db.all(`SELECT id, current_balance_iqd, current_balance_usd FROM parties`);
        for (const party of parties) {
          await db.run(
            `UPDATE parties SET opening_balance_iqd = ?, opening_balance_usd = ? WHERE id = ?`, 
            party.current_balance_iqd, party.current_balance_usd, party.id
          );
        }
        
        // Carry over treasury balances
        const treasuries = await db.all(`SELECT id, balance_iqd, balance_usd FROM treasuries`);
        for (const t of treasuries) {
          await db.run(
            `UPDATE treasuries SET opening_balance_iqd = ?, opening_balance_usd = ? WHERE id = ?`,
            t.balance_iqd, t.balance_usd, t.id
          );
        }

        // Empty transactional tables
        await db.run(`DELETE FROM invoice_items`);
        await db.run(`DELETE FROM invoices`);
        await db.run(`DELETE FROM party_transactions`);
        await db.run(`DELETE FROM treasury_transactions`);
        await db.run(`DELETE FROM stocktake_items`);
        await db.run(`DELETE FROM inventory_stocktakes`);
        
        // Reset sqlite sequences (auto increments)
        await db.run(`DELETE FROM sqlite_sequence WHERE name IN ('invoice_items', 'invoices', 'party_transactions', 'treasury_transactions', 'stocktake_items', 'inventory_stocktakes')`);
        
        // Update financial year settings to next year implicitly (or just clear them)
        const nextYearStart = `${year + 1}-01-01`;
        const nextYearEnd = `${year + 1}-12-31`;
        await db.run(`UPDATE company_settings SET financial_year_start = ?, financial_year_end = ?`, nextYearStart, nextYearEnd);

        await db.run('COMMIT');
        
        return { success: true };
      } catch (err) {
        await db.run('ROLLBACK');
        throw err;
      }
    } catch (error: any) {
      console.error('Error closing fiscal year:', error);
      return { success: false, error: error.message };
    }
  });
}
