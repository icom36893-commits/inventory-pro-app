import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initTreasuryIpc() {
  ipcMain.handle('treasury:getTransactions', async (_, filters) => {
    const db = await getDb();
    let query = `
      SELECT t.*, p.name as party_name 
      FROM treasury_transactions t
      LEFT JOIN parties p ON t.party_id = p.id
      WHERE t.invoice_id IS NULL
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

  ipcMain.handle('treasury:getBalance', async (_, fundId?: number) => {
    const db = await getDb();
    
    let actualFundId = fundId;
    if (!actualFundId) {
      const mainFund = await db.get("SELECT id FROM funds WHERE is_system = 1 OR name = 'الصندوق الرئيسي' ORDER BY is_system DESC LIMIT 1");
      if (mainFund) actualFundId = mainFund.id;
    }

    let openingIqd = 0, openingUsd = 0;
    if (actualFundId) {
      const fund = await db.get("SELECT opening_balance_iqd, opening_balance_usd FROM funds WHERE id = ?", actualFundId);
      if (fund) {
        openingIqd = fund.opening_balance_iqd || 0;
        openingUsd = fund.opening_balance_usd || 0;
      }
    }

    const baseQuery = "SELECT SUM(amount) as total FROM treasury_transactions WHERE type = ? AND currency = ?" + (actualFundId ? " AND fund_id = ?" : "");
    const getParams = (type: string, curr: string) => actualFundId ? [type, curr, actualFundId] : [type, curr];

    const incomeIqd = await db.get(baseQuery, ...getParams('income', 'IQD'));
    const expenseIqd = await db.get(baseQuery, ...getParams('expense', 'IQD'));
    const incomeUsd = await db.get(baseQuery, ...getParams('income', 'USD'));
    const expenseUsd = await db.get(baseQuery, ...getParams('expense', 'USD'));
    
    // Add Journal Vouchers Impact
    let jvQuery = `
      SELECT 
        SUM(debit_iqd) as total_debit_iqd,
        SUM(credit_iqd) as total_credit_iqd,
        SUM(debit_usd) as total_debit_usd,
        SUM(credit_usd) as total_credit_usd
      FROM journal_voucher_entries
      WHERE account_type = 'fund'
    `;
    const jvParams: any[] = [];
    
    if (actualFundId) {
      jvQuery += " AND account_id = ?";
      jvParams.push(actualFundId);
    }
    
    const jvTotals = await db.get(jvQuery, ...jvParams);
    const jvNetIqd = (jvTotals?.total_debit_iqd || 0) - (jvTotals?.total_credit_iqd || 0);
    const jvNetUsd = (jvTotals?.total_debit_usd || 0) - (jvTotals?.total_credit_usd || 0);
    
    return {
      IQD: openingIqd + (incomeIqd?.total || 0) - (expenseIqd?.total || 0) + jvNetIqd,
      USD: openingUsd + (incomeUsd?.total || 0) - (expenseUsd?.total || 0) + jvNetUsd
    };
  });

  ipcMain.handle('treasury:createTransaction', async (_, data) => {
    const db = await getDb();
    const { type, category, amount, currency, party_id, fund_id, description, date, created_by } = data;
    
    // Fallback to main fund if fund_id is not provided
    let actualFundId = fund_id;
    if (!actualFundId) {
      const mainFund = await db.get("SELECT id FROM funds WHERE is_system = 1 AND name = 'الصندوق الرئيسي' LIMIT 1");
      if (mainFund) actualFundId = mainFund.id;
    }

    const result = await db.run(`
      INSERT INTO treasury_transactions (type, category, amount, currency, party_id, fund_id, description, date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, type, category, amount, currency || 'IQD', party_id, actualFundId, description, date, created_by);
    
    if (party_id) {
      const party = await db.get('SELECT type FROM parties WHERE id = ?', party_id);
      let balanceChange = 0;
      if (party.type === 'customer') {
        balanceChange = type === 'income' ? -amount : amount;
      } else if (party.type === 'supplier') {
        balanceChange = type === 'expense' ? -amount : amount;
      }

      const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);

      const updatedParty = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
      
      let debit = 0;
      let credit = 0;
      if (type === 'income') credit = amount;
      if (type === 'expense') debit = amount;

      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, 'payment', result.lastID, debit, credit, updatedParty.current_balance_iqd, updatedParty.current_balance_usd, currency || 'IQD', description || (type === 'income' ? 'سند قبض' : 'سند صرف'), date);
    }

    return { id: result.lastID };
  });

  ipcMain.handle('treasury:updateTransaction', async (_, id, data) => {
    const db = await getDb();
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');

    // Delete old party transaction
    if (oldTx.party_id) {
      const party = await db.get('SELECT type FROM parties WHERE id = ?', oldTx.party_id);
      let reverseChange = 0;
      if (party && party.type === 'customer') {
        reverseChange = oldTx.type === 'income' ? oldTx.amount : -oldTx.amount;
      } else if (party && party.type === 'supplier') {
        reverseChange = oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
      }

      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, reverseChange, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }

    const { type, category, amount, currency, party_id, fund_id, description, date } = data;
    
    let actualFundId = fund_id;
    if (!actualFundId) {
      const mainFund = await db.get("SELECT id FROM funds WHERE is_system = 1 AND name = 'الصندوق الرئيسي' LIMIT 1");
      if (mainFund) actualFundId = mainFund.id;
    }

    await db.run(`
      UPDATE treasury_transactions 
      SET type=?, category=?, amount=?, currency=?, party_id=?, fund_id=?, description=?, date=?
      WHERE id=?
    `, type, category, amount, currency || 'IQD', party_id, actualFundId, description, date, id);
    
    // Apply new balance
    if (party_id) {
      const party = await db.get('SELECT type FROM parties WHERE id = ?', party_id);
      let balanceChange = 0;
      if (party && party.type === 'customer') {
        balanceChange = type === 'income' ? -amount : amount;
      } else if (party && party.type === 'supplier') {
        balanceChange = type === 'expense' ? -amount : amount;
      }

      const newBalanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${newBalanceField} = ${newBalanceField} + ? WHERE id = ?`, balanceChange, party_id);

      const updatedParty = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
      
      let debit = 0;
      let credit = 0;
      if (type === 'income') credit = amount;
      if (type === 'expense') debit = amount;

      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, 'payment', id, debit, credit, updatedParty.current_balance_iqd, updatedParty.current_balance_usd, currency || 'IQD', description || (type === 'income' ? 'سند قبض' : 'سند صرف'), date);
    }

    return { success: true };
  });

  ipcMain.handle('treasury:deleteTransaction', async (_, id) => {
    const db = await getDb();
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');

    if (oldTx.party_id) {
      const party = await db.get('SELECT type FROM parties WHERE id = ?', oldTx.party_id);
      let reverseChange = 0;
      if (party && party.type === 'customer') {
        reverseChange = oldTx.type === 'income' ? oldTx.amount : -oldTx.amount;
      } else if (party && party.type === 'supplier') {
        reverseChange = oldTx.type === 'expense' ? oldTx.amount : -oldTx.amount;
      }

      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, reverseChange, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }

    await db.run('DELETE FROM treasury_transactions WHERE id = ?', id);
    return { success: true };
  });

  ipcMain.handle('funds:getAll', async () => {
    const db = await getDb();
    return db.all('SELECT * FROM funds ORDER BY created_at DESC');
  });

  ipcMain.handle('funds:create', async (_, data) => {
    const db = await getDb();
    const { name, category, opening_balance_iqd, opening_balance_usd } = data;
    const result = await db.run(`
      INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd)
      VALUES (?, ?, ?, ?)
    `, name, category, opening_balance_iqd || 0, opening_balance_usd || 0);
    return { id: result.lastID };
  });

  ipcMain.handle('funds:update', async (_, id, data) => {
    const db = await getDb();
    const { name, category, opening_balance_iqd, opening_balance_usd } = data;
    await db.run(`
      UPDATE funds 
      SET name=?, category=?, opening_balance_iqd=?, opening_balance_usd=?
      WHERE id=?
    `, name, category, opening_balance_iqd || 0, opening_balance_usd || 0, id);
    return { success: true };
  });

  ipcMain.handle('funds:delete', async (_, id) => {
    const db = await getDb();
    const fund = await db.get('SELECT is_system FROM funds WHERE id = ?', id);
    if (fund && fund.is_system === 1) {
      throw new Error('لا يمكن حذف هذا الصندوق لأنه صندوق أساسي في النظام');
    }
    await db.run('DELETE FROM funds WHERE id = ?', id);
    return { success: true };
  });
}
