
import { getDb } from '../database/db';
import fs from 'node:fs';
import path from 'node:path';

// const isDev = !app.isPackaged;
// const dbPath = isDev 
//   ? path.join(process.cwd(), 'database', 'inventory.db')
//   : path.join(app.getPath('userData'), 'inventory.db');

export function initAutoBackup() {
  // Check immediately on startup
  checkAndPerformBackup();

  // Then check every hour
  setInterval(checkAndPerformBackup, 60 * 60 * 1000);
}

async function checkAndPerformBackup() {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT auto_backup_enabled, auto_backup_frequency, auto_backup_path, last_backup_date FROM company_settings LIMIT 1');

    if (!settings || settings.auto_backup_enabled !== 1 || !settings.auto_backup_path) {
      return; // Auto backup not enabled or path not set
    }

    if (!fs.existsSync(settings.auto_backup_path)) {
      console.error('Auto backup path does not exist:', settings.auto_backup_path);
      return;
    }

    const now = new Date();
    let shouldBackup = false;

    if (!settings.last_backup_date) {
      shouldBackup = true;
    } else {
      const lastBackup = new Date(settings.last_backup_date);
      const diffTime = Math.abs(now.getTime() - lastBackup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (settings.auto_backup_frequency === 'daily' && diffDays >= 1) {
        shouldBackup = true;
      } else if (settings.auto_backup_frequency === 'weekly' && diffDays >= 7) {
        shouldBackup = true;
      } else if (settings.auto_backup_frequency === 'monthly' && diffDays >= 30) {
        shouldBackup = true;
      }
    }

    if (shouldBackup) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dd = pad(now.getDate());
      const mm = pad(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      const hh = pad(now.getHours());
      const min = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const dateStr = `${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}`;
      
      const backupFileName = `Inventory_Pro_System_${dateStr}.db`;
      const backupFilePath = path.join(settings.auto_backup_path, backupFileName);

      // Use VACUUM INTO to ensure all data and cached changes are written correctly
      await db.run(`VACUUM INTO '${backupFilePath}'`);
      console.log(`Auto backup successful: ${backupFilePath}`);

      // Update last_backup_date
      await db.run('UPDATE company_settings SET last_backup_date = ?', now.toISOString());
    }
  } catch (error) {
    console.error('Error during auto backup:', error);
  }
}
