import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initTreasuryIpc() {
  ipcMain.handle('treasury:getTransactions', async (_, filters) => {
    const db = await getDb();
    let query = `
      SELECT t.*, p.name as party_name 
      FROM treasury_transactions t
      LEFT JOIN parties p ON t.party_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.search) {
      query += ` AND (t.category LIKE ? OR t.description LIKE ? OR p.name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters?.type) {
      query += ` AND t.type = ?`;
      params.push(filters.type);
    }
    if (filters?.startDate) {
      query += ` AND t.date >= ?`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ` AND t.date <= ?`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;
    return db.all(query, ...params);
  });

  ipcMain.handle('treasury:getBalance', async () => {
    const db = await getDb();
    const incomeIqd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'IQD'");
    const expenseIqd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'IQD'");
    const incomeUsd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'income' AND currency = 'USD'");
    const expenseUsd = await db.get("SELECT SUM(amount) as total FROM treasury_transactions WHERE type = 'expense' AND currency = 'USD'");
    
    return {
      IQD: (incomeIqd?.total || 0) - (expenseIqd?.total || 0),
      USD: (incomeUsd?.total || 0) - (expenseUsd?.total || 0)
    };
  });

  ipcMain.handle('treasury:createTransaction', async (_, data) => {
    const db = await getDb();
    const { type, category, amount, currency, party_id, description, date, created_by } = data;
    const result = await db.run(`
      INSERT INTO treasury_transactions (type, category, amount, currency, party_id, description, date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, type, category, amount, currency || 'IQD', party_id, description, date, created_by);
    
    if (party_id) {
      let balanceChange = -amount; 
      const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);

      const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
      
      let debit = 0;
      let credit = 0;
      if (type === 'income') credit = amount;
      if (type === 'expense') debit = amount;

      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, 'payment', result.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', description || (type === 'income' ? 'سند قبض' : 'سند صرف'), date);
    }

    return { id: result.lastID };
  });

  ipcMain.handle('treasury:updateTransaction', async (_, id, data) => {
    const db = await getDb();
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');

    // Revert old balance
    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }

    const { type, category, amount, currency, party_id, description, date } = data;
    await db.run(`
      UPDATE treasury_transactions 
      SET type=?, category=?, amount=?, currency=?, party_id=?, description=?, date=?
      WHERE id=?
    `, type, category, amount, currency || 'IQD', party_id, description, date, id);

    // Apply new balance
    if (party_id) {
      const newBalanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${newBalanceField} = ${newBalanceField} - ? WHERE id = ?`, amount, party_id);

      const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
      
      let debit = 0;
      let credit = 0;
      if (type === 'income') credit = amount;
      if (type === 'expense') debit = amount;

      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, 'payment', id, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', description || (type === 'income' ? 'سند قبض' : 'سند صرف'), date);
    }

    return { success: true };
  });

  ipcMain.handle('treasury:deleteTransaction', async (_, id) => {
    const db = await getDb();
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');

    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }

    await db.run('DELETE FROM treasury_transactions WHERE id = ?', id);
    return { success: true };
  });
}
