import { ipcMain } from 'electron';
import db from '../../database/db';

export function setupJournalsHandlers() {
  ipcMain.handle('journal:getAll', async () => {
    const database = await db.getDb();
    const journals = await database.all(`
      SELECT jv.*
      FROM journal_vouchers jv
      ORDER BY jv.date DESC, jv.id DESC
    `);
    
    for (const jv of journals) {
      const entries = await database.all(`
        SELECT * FROM journal_voucher_entries
        WHERE voucher_id = ?
      `, jv.id);
      jv.entries = entries;
    }
    
    return journals;
  });
  ipcMain.handle('journal:create', async (_, data: any, userId: number) => {
    const database = await db.getDb();
    
    // Calculate totals to ensure it balances
    let totalDebitIqd = 0, totalCreditIqd = 0;
    let totalDebitUsd = 0, totalCreditUsd = 0;
    
    for (const entry of data.entries) {
      totalDebitIqd += (entry.debit_iqd || 0);
      totalCreditIqd += (entry.credit_iqd || 0);
      totalDebitUsd += (entry.debit_usd || 0);
      totalCreditUsd += (entry.credit_usd || 0);
    }
    
    if (Math.abs(totalDebitIqd - totalCreditIqd) > 0.01) {
      throw new Error('القيد غير متوازن (دينار)');
    }
    if (Math.abs(totalDebitUsd - totalCreditUsd) > 0.01) {
      throw new Error('القيد غير متوازن (دولار)');
    }

    // Generate Voucher Number
    const countRes = await database.get('SELECT COUNT(*) as count FROM journal_vouchers');
    const voucherNumber = `JV-${(countRes.count + 1).toString().padStart(5, '0')}`;
    
    const result = await database.run(`
      INSERT INTO journal_vouchers (voucher_number, date, notes, created_by)
      VALUES (?, ?, ?, ?)
    `, voucherNumber, data.date, data.notes, userId);
    
    const voucherId = result.lastID;
    
    try {
      await database.run("ALTER TABLE journal_voucher_entries ADD COLUMN category TEXT");
    } catch(e) {
      // Ignore if column already exists
    }
    
    for (const entry of data.entries) {
      await database.run(`
        INSERT INTO journal_voucher_entries (voucher_id, account_type, account_id, debit_iqd, credit_iqd, debit_usd, credit_usd, description, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, voucherId, entry.account_type, entry.account_id, entry.debit_iqd || 0, entry.credit_iqd || 0, entry.debit_usd || 0, entry.credit_usd || 0, entry.description, entry.category || '');
      
      // Post to ledger based on account type
      if (entry.account_type === 'party') {
        if ((entry.debit_iqd || 0) > 0 || (entry.credit_iqd || 0) > 0) {
          const ptIqd = await database.get('SELECT balance_iqd, balance_usd FROM party_transactions WHERE party_id = ? ORDER BY id DESC LIMIT 1', entry.account_id);
          const currentBalIqd = ptIqd ? ptIqd.balance_iqd : 0;
          const currentBalUsd = ptIqd ? ptIqd.balance_usd : 0;
          
          const newBalIqd = currentBalIqd + (entry.debit_iqd || 0) - (entry.credit_iqd || 0);
          
          await database.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, currency, balance_iqd, balance_usd, description, date)
            VALUES (?, 'journal', ?, ?, ?, 'IQD', ?, ?, ?, ?)
          `, entry.account_id, voucherId, entry.debit_iqd || 0, entry.credit_iqd || 0, newBalIqd, currentBalUsd, entry.description || data.notes, data.date);
          
          // update parties current_balance
          await database.run('UPDATE parties SET current_balance_iqd = ? WHERE id = ?', newBalIqd, entry.account_id);
        }
        
        if ((entry.debit_usd || 0) > 0 || (entry.credit_usd || 0) > 0) {
          const ptUsd = await database.get('SELECT balance_iqd, balance_usd FROM party_transactions WHERE party_id = ? ORDER BY id DESC LIMIT 1', entry.account_id);
          const currentBalIqd = ptUsd ? ptUsd.balance_iqd : 0;
          const currentBalUsd = ptUsd ? ptUsd.balance_usd : 0;
          
          const newBalUsd = currentBalUsd + (entry.debit_usd || 0) - (entry.credit_usd || 0);
          
          await database.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, currency, balance_iqd, balance_usd, description, date)
            VALUES (?, 'journal', ?, ?, ?, 'USD', ?, ?, ?, ?)
          `, entry.account_id, voucherId, entry.debit_usd || 0, entry.credit_usd || 0, currentBalIqd, newBalUsd, entry.description || data.notes, data.date);
          
          await database.run('UPDATE parties SET current_balance_usd = ? WHERE id = ?', newBalUsd, entry.account_id);
        }
      } else if (entry.account_type === 'fund') {
        // Balances are computed dynamically in statement:get
      }
    }
    
    return { success: true, id: voucherId };
  });

  ipcMain.handle('journal:getOne', async (_, id: number) => {
    const database = await db.getDb();
    const journal = await database.get('SELECT * FROM journal_vouchers WHERE id = ?', id);
    if (!journal) return null;
    
    const entries = await database.all('SELECT * FROM journal_voucher_entries WHERE voucher_id = ?', id);
    journal.entries = entries;
    return journal;
  });

  ipcMain.handle('journal:delete', async (_, id: number) => {
    const database = await db.getDb();
    try {
      await database.run('BEGIN TRANSACTION');
      
      const entries = await database.all('SELECT * FROM journal_voucher_entries WHERE voucher_id = ?', id);
      
      for (const entry of entries) {
        if (entry.account_type === 'party') {
          // Revert party balances
          if ((entry.debit_iqd || 0) > 0 || (entry.credit_iqd || 0) > 0) {
            const diffIqd = (entry.credit_iqd || 0) - (entry.debit_iqd || 0); // Reverse effect
            await database.run('UPDATE parties SET current_balance_iqd = current_balance_iqd + ? WHERE id = ?', diffIqd, entry.account_id);
          }
          if ((entry.debit_usd || 0) > 0 || (entry.credit_usd || 0) > 0) {
            const diffUsd = (entry.credit_usd || 0) - (entry.debit_usd || 0);
            await database.run('UPDATE parties SET current_balance_usd = current_balance_usd + ? WHERE id = ?', diffUsd, entry.account_id);
          }
        }
      }
      
      // Delete party_transactions, entries, and voucher
      await database.run('DELETE FROM party_transactions WHERE type = "journal" AND reference_id = ?', id);
      await database.run('DELETE FROM journal_voucher_entries WHERE voucher_id = ?', id);
      await database.run('DELETE FROM journal_vouchers WHERE id = ?', id);
      
      await database.run('COMMIT');
      return { success: true };
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  });

  ipcMain.handle('journal:update', async (_, id: number, data: any, _userId: number) => {
    const database = await db.getDb();
    
    // Validate totals
    let totalDebitIqd = 0, totalCreditIqd = 0;
    let totalDebitUsd = 0, totalCreditUsd = 0;
    
    for (const entry of data.entries) {
      totalDebitIqd += (entry.debit_iqd || 0);
      totalCreditIqd += (entry.credit_iqd || 0);
      totalDebitUsd += (entry.debit_usd || 0);
      totalCreditUsd += (entry.credit_usd || 0);
    }
    
    if (Math.abs(totalDebitIqd - totalCreditIqd) > 0.01) throw new Error('القيد غير متوازن (دينار)');
    if (Math.abs(totalDebitUsd - totalCreditUsd) > 0.01) throw new Error('القيد غير متوازن (دولار)');

    try {
      await database.run('BEGIN TRANSACTION');
      
      // 1. Revert Old Entries
      const oldEntries = await database.all('SELECT * FROM journal_voucher_entries WHERE voucher_id = ?', id);
      for (const entry of oldEntries) {
        if (entry.account_type === 'party') {
          if ((entry.debit_iqd || 0) > 0 || (entry.credit_iqd || 0) > 0) {
            const diffIqd = (entry.credit_iqd || 0) - (entry.debit_iqd || 0);
            await database.run('UPDATE parties SET current_balance_iqd = current_balance_iqd + ? WHERE id = ?', diffIqd, entry.account_id);
          }
          if ((entry.debit_usd || 0) > 0 || (entry.credit_usd || 0) > 0) {
            const diffUsd = (entry.credit_usd || 0) - (entry.debit_usd || 0);
            await database.run('UPDATE parties SET current_balance_usd = current_balance_usd + ? WHERE id = ?', diffUsd, entry.account_id);
          }
        }
      }
      
      await database.run('DELETE FROM party_transactions WHERE type = "journal" AND reference_id = ?', id);
      await database.run('DELETE FROM journal_voucher_entries WHERE voucher_id = ?', id);

      // 2. Update Voucher
      await database.run('UPDATE journal_vouchers SET date = ?, notes = ? WHERE id = ?', data.date, data.notes, id);

      // 3. Insert New Entries and Apply Balances
      try {
        await database.run("ALTER TABLE journal_voucher_entries ADD COLUMN category TEXT");
      } catch(e) {
        // Ignore if column already exists
      }
      
      for (const entry of data.entries) {
        await database.run(`
          INSERT INTO journal_voucher_entries (voucher_id, account_type, account_id, debit_iqd, credit_iqd, debit_usd, credit_usd, description, category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, id, entry.account_type, entry.account_id, entry.debit_iqd || 0, entry.credit_iqd || 0, entry.debit_usd || 0, entry.credit_usd || 0, entry.description, entry.category || '');
        
        if (entry.account_type === 'party') {
          if ((entry.debit_iqd || 0) > 0 || (entry.credit_iqd || 0) > 0) {
            const ptIqd = await database.get('SELECT balance_iqd, balance_usd FROM party_transactions WHERE party_id = ? ORDER BY id DESC LIMIT 1', entry.account_id);
            const currentBalIqd = ptIqd ? ptIqd.balance_iqd : 0;
            const currentBalUsd = ptIqd ? ptIqd.balance_usd : 0;
            
            const newBalIqd = currentBalIqd + (entry.debit_iqd || 0) - (entry.credit_iqd || 0);
            
            await database.run(`
              INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, currency, balance_iqd, balance_usd, description, date)
              VALUES (?, 'journal', ?, ?, ?, 'IQD', ?, ?, ?, ?)
            `, entry.account_id, id, entry.debit_iqd || 0, entry.credit_iqd || 0, newBalIqd, currentBalUsd, entry.description || data.notes, data.date);
            
            await database.run('UPDATE parties SET current_balance_iqd = ? WHERE id = ?', newBalIqd, entry.account_id);
          }
          
          if ((entry.debit_usd || 0) > 0 || (entry.credit_usd || 0) > 0) {
            const ptUsd = await database.get('SELECT balance_iqd, balance_usd FROM party_transactions WHERE party_id = ? ORDER BY id DESC LIMIT 1', entry.account_id);
            const currentBalIqd = ptUsd ? ptUsd.balance_iqd : 0;
            const currentBalUsd = ptUsd ? ptUsd.balance_usd : 0;
            
            const newBalUsd = currentBalUsd + (entry.debit_usd || 0) - (entry.credit_usd || 0);
            
            await database.run(`
              INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, currency, balance_iqd, balance_usd, description, date)
              VALUES (?, 'journal', ?, ?, ?, 'USD', ?, ?, ?, ?)
            `, entry.account_id, id, entry.debit_usd || 0, entry.credit_usd || 0, currentBalIqd, newBalUsd, entry.description || data.notes, data.date);
            
            await database.run('UPDATE parties SET current_balance_usd = ? WHERE id = ?', newBalUsd, entry.account_id);
          }
        }
      }

      await database.run('COMMIT');
      return { success: true, id };
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  });
}
