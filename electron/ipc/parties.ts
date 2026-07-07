import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initPartiesIpc() {
  ipcMain.handle('parties:getAll', async (_, type) => {
    const db = await getDb();
    if (type === 'all') {
      return db.all('SELECT * FROM parties ORDER BY name ASC');
    }
    return db.all('SELECT * FROM parties WHERE type = ? ORDER BY name ASC', type);
  });

  ipcMain.handle('parties:create', async (_, data) => {
    const db = await getDb();
    const { code, type, name, address, phone, email, opening_balance_iqd, opening_balance_usd } = data;
    const result = await db.run(`
      INSERT INTO parties (code, type, name, address, phone, email, opening_balance_iqd, opening_balance_usd, current_balance_iqd, current_balance_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, code, type, name, address, phone, email, opening_balance_iqd || 0, opening_balance_usd || 0, opening_balance_iqd || 0, opening_balance_usd || 0);
    return { id: result.lastID };
  });

  ipcMain.handle('parties:update', async (_, id, data) => {
    const db = await getDb();
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await db.run(`UPDATE parties SET ${setClause} WHERE id = ?`, ...values, id);
    return { success: true };
  });

  ipcMain.handle('parties:getTransactions', async (_, partyId) => {
    const db = await getDb();
    return db.all(`
      SELECT * FROM party_transactions 
      WHERE party_id = ? 
      ORDER BY date DESC, created_at DESC
    `, partyId);
  });

  ipcMain.handle('parties:delete', async (_, id) => {
    const db = await getDb();
    
    // Check if party has any associated transactions or invoices
    const txCount = await db.get('SELECT COUNT(*) as count FROM party_transactions WHERE party_id = ?', id);
    const invoiceCount = await db.get('SELECT COUNT(*) as count FROM invoices WHERE party_id = ?', id);
    
    if ((txCount && txCount.count > 0) || (invoiceCount && invoiceCount.count > 0)) {
      throw new Error('لا يمكن حذف العميل/المورد لارتباطه بفواتير أو حركات مالية');
    }

    await db.run('DELETE FROM parties WHERE id = ?', id);
    return { success: true };
  });
}
