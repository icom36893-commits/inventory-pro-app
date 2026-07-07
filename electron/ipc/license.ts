import { ipcMain } from 'electron';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

export function initLicenseIpc() {
  ipcMain.handle('license:verify', async (_, serialKey: string) => {
    try {
      // Find MO database
      const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
      
      const prodPath = path.join(appData, 'license-management-dashboard', 'prod-license.sqlite');
      const devPath = path.join(appData, 'license-management-dashboard', 'dev-license.sqlite');
      
      let targetDbPath = null;
      if (fs.existsSync(prodPath)) targetDbPath = prodPath;
      else if (fs.existsSync(devPath)) targetDbPath = devPath;
      
      if (!targetDbPath) {
        return { valid: false, error: 'تعذر الاتصال بنظام إدارة التراخيص' };
      }
      
      // Open MO database
      const moDb = await open({
        filename: targetDbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY
      });
      
      try {
        const license = await moDb.get('SELECT * FROM licenses WHERE serial = ?', [serialKey]);
        
        if (!license) {
          return { valid: false, error: 'المفتاح غير مسجل في النظام أو غير صحيح' };
        }
        
        if (license.status !== 'فعال') {
          return { valid: false, error: 'هذا الترخيص متوقف أو غير فعال' };
        }
        
        return {
          valid: true,
          message: 'تم التحقق من الترخيص بنجاح',
          activationType: license.type,
          expiryDate: license.end_date
        };
      } finally {
        await moDb.close();
      }
      
    } catch (error: any) {
      console.error('License verification error:', error);
      return { valid: false, error: 'حدث خطأ أثناء الاتصال بقاعدة بيانات التراخيص' };
    }
  });
}
