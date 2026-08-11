import { ipcMain } from 'electron';
import db from '../../database/db';

export function initPermissionsIpc() {
  // Get all role permissions
  ipcMain.handle('permissions:getAll', async () => {
    try {
      const database = await db.getDb();
      const rows = await database.all(`SELECT * FROM role_permissions`);
      const result: { [role: string]: string[] } = {};
      for (const row of rows) {
        result[row.role] = JSON.parse(row.permissions);
      }
      return result;
    } catch (e: any) {
      console.error("Error fetching permissions", e);
      return {};
    }
  });

  // Update role permissions
  ipcMain.handle('permissions:update', async (_, role: string, permissions: string[]) => {
    try {
      const database = await db.getDb();
      await database.run(
        `INSERT INTO role_permissions (role, permissions) VALUES (?, ?) 
         ON CONFLICT(role) DO UPDATE SET permissions = excluded.permissions`,
        [role, JSON.stringify(permissions)]
      );
      return true;
    } catch (e: any) {
      console.error("Error updating permissions", e);
      throw e;
    }
  });
}
