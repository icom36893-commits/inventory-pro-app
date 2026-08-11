import { getDb } from '../database/db';
import { db as realtimeDb } from './firebaseConfig';
import { ref, onChildAdded, remove, set, Unsubscribe } from 'firebase/database';
import { performSync } from './firebaseSync';
let unsubscribeListener: Unsubscribe | null = null;
const cleanupTimeouts = new Map<string, NodeJS.Timeout>();
export async function initMobileCommandProcessor() {
  console.log('Initializing Mobile Command Processor...');
  if (unsubscribeListener) {
    unsubscribeListener();
    unsubscribeListener = null;
  }
  cleanupTimeouts.forEach((t) => clearTimeout(t));
  cleanupTimeouts.clear();
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
    if (!settings || !settings.company_id) {
      console.log('No company ID, aborting mobile command processor.');
      return;
    }
    const companyId = settings.company_id;
    const commandsRef = ref(realtimeDb, `mobile_requests/${companyId}/commands`);
    unsubscribeListener = onChildAdded(commandsRef, async (snapshot) => {
      const commandId = snapshot.key;
      const command = snapshot.val();
      if (!command || !command.action) return;
      console.log(`Received command from mobile: ${command.action}`);
      let processResult: any = undefined;
      let processError: any = null;
      try {
        processResult = await processCommand(db, command);
      } catch (err) {
        console.error(`Error processing command ${command.action}:`, err);
        processError = err;
      }
      try {
        const resultsRef = ref(realtimeDb, `mobile_requests/${companyId}/results/${commandId}`);
        const now = Date.now();
        let resultObj: any;
        if (processError) {
          resultObj = {
            status: 'error',
            action: command.action,
            message: String(processError?.message || processError || 'Unknown error'),
            processed_at: now
          };
        } else {
          resultObj = {
            status: 'ok',
            action: command.action,
            processed_at: now
          };
          if (processResult && typeof processResult === 'object') {
            resultObj.data = processResult;
          }
        }
        await set(resultsRef, resultObj);
        const existingTimeout = cleanupTimeouts.get(String(commandId));
        if (existingTimeout) clearTimeout(existingTimeout);
        const timeout = setTimeout(() => {
          remove(resultsRef).catch((e) => console.error('Error cleaning up result:', e));
          cleanupTimeouts.delete(String(commandId));
        }, 60000);
        cleanupTimeouts.set(String(commandId), timeout);
      } catch (writeErr) {
        console.error('Error writing result to Firebase:', writeErr);
      }
      try {
        const cmdRef = ref(realtimeDb, `mobile_requests/${companyId}/commands/${commandId}`);
        await remove(cmdRef);
      } catch (rmErr) {
        console.error('Error removing command:', rmErr);
      }
    });
  } catch (error) {
    console.error('Error initializing mobile command processor:', error);
  }
}
export async function reInitMobileCommandProcessor() {
  await initMobileCommandProcessor();
}
async function processCommand(db: any, command: any): Promise<any> {
  const { action, payload } = command;
  if (action === 'CREATE_SALE_INVOICE') {
    const { invoice_number, party_id, total, currency, items, payment_method, buyer_name, date: payloadDate, subtotal, discount_amount, discount_type, tax_rate, tax_amount, paid_amount, remaining_amount, notes, status, additional_expenses, fund_id } = payload;
    const date = payloadDate || new Date().toISOString().split('T')[0];
    let finalInvoiceNo = invoice_number || `INV-${Date.now()}`;
    let attempts = 0;
    let success = false;
    let result: any;
    await db.run(`BEGIN TRANSACTION`);
    try {
      while (attempts < 3 && !success) {
        attempts++;
        try {
          const tryInvoiceNo = attempts === 1 ? finalInvoiceNo : `${finalInvoiceNo}-${attempts}`;
          result = await db.run(
            `INSERT INTO invoices (invoice_number, type, party_id, subtotal, discount_amount, discount_type, tax_rate, tax_amount, total, paid_amount, remaining_amount, currency, status, payment_method, buyer_name, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tryInvoiceNo, payload.type || 'sale', party_id || null, subtotal || 0, discount_amount || 0, discount_type || 'amount', tax_rate || 0, tax_amount || 0, total, paid_amount || 0, remaining_amount || 0, currency || 'IQD', status || 'confirmed', payment_method, buyer_name || null, notes || '', date]
          );
          success = true;
          finalInvoiceNo = tryInvoiceNo;
        } catch (e: any) {
          if (!e?.message?.includes('UNIQUE') || attempts >= 3) throw e;
        }
      }
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await db.run(
            `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
            [result.lastID, item.product_id, item.quantity, item.unit_price, item.total]
          );
          const stockOp = payload.type === 'sale_return' ? '+' : '-';
          await db.run(`UPDATE products SET current_stock = current_stock ${stockOp} ? WHERE id = ?`, [item.quantity, item.product_id]);
        }
      }
      if (additional_expenses && additional_expenses.length > 0) {
        for (const exp of additional_expenses) {
          await db.run(`
            INSERT INTO invoice_expenses (invoice_id, party_name, date, amount, details)
            VALUES (?, ?, ?, ?, ?)
          `, result.lastID, exp.party_name, exp.date, exp.amount, exp.details);
        }
      }
      if (party_id) {
        const balanceField = (currency || 'IQD') === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        const balanceChange = payload.type === 'sale_return' ? -(remaining_amount || 0) : (remaining_amount || 0);
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        const debit = payload.type === 'sale_return' ? 0 : total;
        const credit = payload.type === 'sale_return' ? total : 0;
        const desc = payload.type === 'sale_return' ? `فاتورة مردودات مبيعات رقم ${finalInvoiceNo}` : `فاتورة مبيعات رقم ${finalInvoiceNo}`;
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', result.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', desc, date);
      }
      if (paid_amount > 0) {
        const tType = payload.type === 'sale_return' ? 'expense' : 'income';
        const tCategory = payload.type === 'sale_return' ? 'customer_return' : 'customer_payment';
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, fund_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, tType, tCategory, paid_amount, currency || 'IQD', party_id || null, result.lastID, `دفعة على فاتورة رقم ${finalInvoiceNo}`, date, fund_id || null);
        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, 0, paid_amount, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة على فاتورة رقم ${finalInvoiceNo}`, date);
        }
      }
      await db.run(`COMMIT`);
      return { lastID: result.lastID };
    } catch (err) {
      await db.run(`ROLLBACK`);
      throw err;
    }
  }
  else if (action === 'CREATE_PURCHASE_INVOICE') {
    const { invoice_number, party_id, total, currency, items, payment_method, buyer_name, date: payloadDate, subtotal, discount_amount, discount_type, tax_rate, tax_amount, paid_amount, remaining_amount, notes, status, additional_expenses, fund_id } = payload;
    const date = payloadDate || new Date().toISOString().split('T')[0];
    let finalInvoiceNo = invoice_number || `PUR-${Date.now()}`;
    let attempts = 0;
    let success = false;
    let result: any;
    await db.run(`BEGIN TRANSACTION`);
    try {
      while (attempts < 3 && !success) {
        attempts++;
        try {
          const tryInvoiceNo = attempts === 1 ? finalInvoiceNo : `${finalInvoiceNo}-${attempts}`;
          result = await db.run(
            `INSERT INTO invoices (invoice_number, type, party_id, subtotal, discount_amount, discount_type, tax_rate, tax_amount, total, paid_amount, remaining_amount, currency, status, payment_method, buyer_name, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tryInvoiceNo, payload.type || 'purchase', party_id || null, subtotal || 0, discount_amount || 0, discount_type || 'amount', tax_rate || 0, tax_amount || 0, total, paid_amount || 0, remaining_amount || 0, currency || 'IQD', status || 'confirmed', payment_method, buyer_name || null, notes || '', date]
          );
          success = true;
          finalInvoiceNo = tryInvoiceNo;
        } catch (e: any) {
          if (!e?.message?.includes('UNIQUE') || attempts >= 3) throw e;
        }
      }
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await db.run(
            `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
            [result.lastID, item.product_id, item.quantity, item.unit_price, item.total]
          );
          const stockOp = payload.type === 'purchase_return' ? '-' : '+';
          await db.run(`UPDATE products SET current_stock = current_stock ${stockOp} ? WHERE id = ?`, [item.quantity, item.product_id]);
          if (item.update_purchase_price !== false && payload.type !== 'purchase_return') {
            await db.run(`UPDATE products SET purchase_price = ?, currency = ? WHERE id = ?`, [item.unit_price, currency || 'IQD', item.product_id]);
          }
        }
      }
      if (additional_expenses && additional_expenses.length > 0) {
        for (const exp of additional_expenses) {
          await db.run(`
            INSERT INTO invoice_expenses (invoice_id, party_name, date, amount, details)
            VALUES (?, ?, ?, ?, ?)
          `, result.lastID, exp.party_name, exp.date, exp.amount, exp.details);
        }
      }
      if (party_id) {
        const balanceField = (currency || 'IQD') === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        const balanceChange = payload.type === 'purchase_return' ? -(remaining_amount || 0) : (remaining_amount || 0);
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        const debit = payload.type === 'purchase_return' ? total : 0;
        const credit = payload.type === 'purchase_return' ? 0 : total;
        const desc = payload.type === 'purchase_return' ? `فاتورة مردودات مشتريات رقم ${finalInvoiceNo}` : `فاتورة مشتريات رقم ${finalInvoiceNo}`;
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', result.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', desc, date);
      }
      if (paid_amount > 0) {
        const tType = payload.type === 'purchase_return' ? 'income' : 'expense';
        const tCategory = payload.type === 'purchase_return' ? 'supplier_return' : 'supplier_payment';
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, fund_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, tType, tCategory, paid_amount, currency || 'IQD', party_id || null, result.lastID, `دفعة على فاتورة رقم ${finalInvoiceNo}`, date, fund_id || null);
        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, paid_amount, 0, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة على فاتورة رقم ${finalInvoiceNo}`, date);
        }
      }
      await db.run(`COMMIT`);
      return { lastID: result.lastID };
    } catch (err) {
      await db.run(`ROLLBACK`);
      throw err;
    }
  }
  else if (action === 'GET_STATEMENT') {
      const { accountType, accountId, currency, fromDate, toDate } = payload;
      let statementData = [];
      
      let dateFilterParty = '';
      let dateFilterFundTreasury = '';
      let dateFilterFundJournal = '';
      const paramsParty = [accountId, currency];
      const paramsFundTreasury = [currency, currency, currency, currency, accountId];
      const paramsFundJournal = [accountId];

      if (fromDate) {
        dateFilterParty += ' AND pt.date >= ?';
        dateFilterFundTreasury += ' AND date >= ?';
        dateFilterFundJournal += ' AND jv.date >= ?';
        paramsParty.push(fromDate);
        paramsFundTreasury.push(fromDate);
        paramsFundJournal.push(fromDate);
      }
      if (toDate) {
        dateFilterParty += ' AND pt.date <= ?';
        dateFilterFundTreasury += ' AND date <= ?';
        dateFilterFundJournal += ' AND jv.date <= ?';
        paramsParty.push(toDate);
        paramsFundTreasury.push(toDate);
        paramsFundJournal.push(toDate);
      }

      if (accountType === 'party') {
        const rows = await db.all(`
          SELECT 
            pt.date,
            pt.type as operation_type,
            CASE 
              WHEN pt.type IN ('invoice', 'return') THEN (SELECT type FROM invoices WHERE id = pt.reference_id)
              WHEN pt.type = 'payment' THEN (SELECT category FROM treasury_transactions WHERE id = pt.reference_id)
              WHEN pt.type = 'journal' THEN 'سند قيد'
              ELSE pt.type
            END as movement_type,
            CASE 
              WHEN pt.type IN ('invoice', 'return') THEN (SELECT invoice_number FROM invoices WHERE id = pt.reference_id)
              WHEN pt.type = 'payment' THEN CAST(pt.reference_id AS TEXT)
              WHEN pt.type = 'journal' THEN (SELECT voucher_number FROM journal_vouchers WHERE id = pt.reference_id)
              ELSE ''
            END as reference_number,
            pt.description,
            pt.debit,
            pt.credit,
            pt.currency,
            CASE WHEN pt.currency = 'IQD' THEN pt.balance_iqd ELSE pt.balance_usd END as balance
          FROM party_transactions pt
          WHERE pt.party_id = ? AND pt.currency = ? ${dateFilterParty}
          ORDER BY pt.date ASC, pt.id ASC
        `, ...paramsParty);
        
        let previousBalanceRow = null;
        if (fromDate) {
          const prevTx = await db.get(`
            SELECT balance_iqd, balance_usd 
            FROM party_transactions 
            WHERE party_id = ? AND currency = ? AND date < ? 
            ORDER BY date DESC, id DESC LIMIT 1
          `, accountId, currency, fromDate);
          
          let previousBalance = 0;
          if (prevTx) {
            previousBalance = currency === 'IQD' ? prevTx.balance_iqd : prevTx.balance_usd;
          }

          if (previousBalance !== 0 || rows.length > 0) {
             previousBalanceRow = {
              date: fromDate,
              operation_type: 'opening',
              movement_type: 'رصيد سابق',
              reference_number: '-',
              description: 'رصيد سابق',
              debit: 0,
              credit: 0,
              balance: previousBalance
            };
          }
        }

        if (previousBalanceRow) {
          statementData = [previousBalanceRow, ...rows];
        } else {
          statementData = rows;
        }
      } else if (accountType === 'fund') {
        const fund = await db.get('SELECT opening_balance_iqd, opening_balance_usd FROM funds WHERE id = ?', accountId);
        let previousBalance = (currency === 'IQD' ? fund?.opening_balance_iqd : fund?.opening_balance_usd) || 0;
        
        if (fromDate) {
          const prevTreasury = await db.all(`
            SELECT type, amount FROM treasury_transactions WHERE fund_id = ? AND date < ?
          `, accountId, fromDate);
          
          for (const t of prevTreasury) {
            if (t.type === 'income') previousBalance += t.amount;
            if (t.type === 'expense') previousBalance -= t.amount;
          }

          const prevJournal = await db.all(`
            SELECT jve.debit_${currency.toLowerCase()} as debit, jve.credit_${currency.toLowerCase()} as credit
            FROM journal_voucher_entries jve
            JOIN journal_vouchers jv ON jv.id = jve.voucher_id
            WHERE jve.account_type = 'fund' AND jve.account_id = ? AND jv.date < ?
          `, accountId, fromDate);

          for (const j of prevJournal) {
            previousBalance += (j.debit || 0) - (j.credit || 0);
          }
        }

        const treasuryRows = await db.all(`
          SELECT 
            date,
            'treasury' as type,
            category as movement_type,
            CAST(id AS TEXT) as reference_number,
            description,
            CASE WHEN ? = 'IQD' THEN (CASE WHEN type='income' THEN amount ELSE 0 END) ELSE 0 END as debit_iqd,
            CASE WHEN ? = 'IQD' THEN (CASE WHEN type='expense' THEN amount ELSE 0 END) ELSE 0 END as credit_iqd,
            CASE WHEN ? = 'USD' THEN (CASE WHEN type='income' THEN amount ELSE 0 END) ELSE 0 END as debit_usd,
            CASE WHEN ? = 'USD' THEN (CASE WHEN type='expense' THEN amount ELSE 0 END) ELSE 0 END as credit_usd,
            id
          FROM treasury_transactions
          WHERE fund_id = ? ${dateFilterFundTreasury}
        `, ...paramsFundTreasury);

        const journalRows = await db.all(`
          SELECT 
            jv.date,
            'journal' as type,
            'سند قيد' as movement_type,
            jv.voucher_number as reference_number,
            jve.description,
            jve.debit_iqd,
            jve.credit_iqd,
            jve.debit_usd,
            jve.credit_usd,
            jve.id
          FROM journal_voucher_entries jve
          JOIN journal_vouchers jv ON jv.id = jve.voucher_id
          WHERE jve.account_type = 'fund' AND jve.account_id = ? ${dateFilterFundJournal}
        `, ...paramsFundJournal);

        const combined = [...treasuryRows, ...journalRows].sort((a, b) => {
          if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
          return a.id - b.id;
        });

        let currentBal = previousBalance;
        
        const statementRows = combined.map(r => {
          const debit = currency === 'IQD' ? r.debit_iqd : r.debit_usd;
          const credit = currency === 'IQD' ? r.credit_iqd : r.credit_usd;
          currentBal = currentBal + debit - credit;
          return {
            date: r.date,
            operation_type: r.type,
            movement_type: r.movement_type,
            reference_number: r.reference_number,
            description: r.description,
            debit,
            credit,
            balance: currentBal
          };
        }).filter(r => r.debit !== 0 || r.credit !== 0);

        let previousBalanceRow = null;
        if (previousBalance !== 0 || (fromDate && statementRows.length > 0)) {
          previousBalanceRow = {
            date: fromDate || '-',
            operation_type: 'opening',
            movement_type: 'رصيد سابق / افتتاحي',
            reference_number: '-',
            description: 'رصيد سابق / افتتاحي',
            debit: 0,
            credit: 0,
            balance: previousBalance
          };
          statementData = [previousBalanceRow, ...statementRows];
        } else {
          statementData = statementRows;
        }
      }
      return { statementData };
    }
    else if (action === 'ADD_PARTY') {
    const { name, type, phone, email, address, balance_iqd, balance_usd } = payload;
    const code = `${type === 'customer' ? 'C' : 'S'}-${Date.now().toString().slice(-6)}`;
    let lastID: number | undefined;
    await db.run(`BEGIN TRANSACTION`);
    try {
      const result = await db.run(
        `INSERT INTO parties (code, name, type, phone, email, address, opening_balance_iqd, opening_balance_usd, current_balance_iqd, current_balance_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, type, phone || '', email || '', address || '', balance_iqd || 0, balance_usd || 0, balance_iqd || 0, balance_usd || 0]
      );
      lastID = result.lastID;
      if (balance_iqd && balance_iqd !== 0) {
        await db.run(
          `INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.lastID,
            'opening_balance',
            null,
            balance_iqd > 0 ? balance_iqd : 0,
            balance_iqd < 0 ? -balance_iqd : 0,
            balance_iqd,
            balance_usd || 0,
            'IQD',
            'رصيد افتتاحي',
            new Date().toISOString().split('T')[0]
          ]
        );
      }
      if (balance_usd && balance_usd !== 0) {
        await db.run(
          `INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.lastID,
            'opening_balance',
            null,
            balance_usd > 0 ? balance_usd : 0,
            balance_usd < 0 ? -balance_usd : 0,
            balance_iqd || 0,
            balance_usd,
            'USD',
            'رصيد افتتاحي',
            new Date().toISOString().split('T')[0]
          ]
        );
      }
      await db.run(`COMMIT`);
    } catch (e) {
      await db.run(`ROLLBACK`);
      throw e;
    }
    return { lastID };
  }
  else if (action === 'UPDATE_PARTY') {
    const { id, name, type, phone, address, balance_iqd, balance_usd } = payload;
    await db.run(
      `UPDATE parties SET name = ?, type = ?, phone = ?, address = ?, current_balance_iqd = ?, current_balance_usd = ? WHERE id = ?`,
      [name, type, phone || '', address || '', balance_iqd || 0, balance_usd || 0, id]
    );
  }
  else if (action === 'GET_WAREHOUSES') {
        const rows = await db.all('SELECT * FROM warehouses ORDER BY id DESC');
        return rows;
      }
      else if (action === 'ADD_WAREHOUSE') {
        const { name, location } = payload;
        if (!name) throw new Error('اسم المخزن مطلوب');
        const result = await db.run('INSERT INTO warehouses (name, location, is_active) VALUES (?, ?, 1)', [name, location || '']);
        return { lastID: result.lastID };
      }
      else if (action === 'UPDATE_WAREHOUSE') {
        const { id, name, location, is_active } = payload;
        if (!id || !name) throw new Error('بيانات المخزن غير مكتملة');
        await db.run('UPDATE warehouses SET name = ?, location = ?, is_active = ? WHERE id = ?', [name, location || '', is_active !== undefined ? is_active : 1, id]);
        return { success: true };
      }
      else if (action === 'DELETE_WAREHOUSE') {
        const { id } = payload;
        if (!id) throw new Error('معرف المخزن مطلوب');
        await db.run('DELETE FROM warehouses WHERE id = ?', [id]);
        return { success: true };
      }
      else if (action === 'GET_INITIAL_PRODUCTS') {
        const rows = await db.all(`
          SELECT p.*, c.name as category_name, u.name as unit_name, w.name as warehouse_name 
          FROM products p
          LEFT JOIN product_categories c ON p.category_id = c.id
          LEFT JOIN units u ON p.unit_id = u.id
          LEFT JOIN warehouses w ON p.warehouse_id = w.id
          WHERE p.is_initial = 1
          ORDER BY p.id DESC
        `);
        return rows;
      }
      else if (action === 'ADD_INITIAL_PRODUCT') {
        const { name, code, category_id, unit_id, warehouse_id, purchase_price, sale_price, opening_stock, currency } = payload;
        if (!name) throw new Error('اسم الرصيد مطلوب');
        let finalCode = code;
        if (!finalCode) {
           finalCode = 'INIT-' + Date.now();
        }
        const result = await db.run(`
          INSERT INTO products (name, code, category_id, unit_id, warehouse_id, purchase_price, sale_price, opening_stock, current_stock, currency, is_initial)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, finalCode, category_id || null, unit_id || null, warehouse_id || null, purchase_price || 0, sale_price || 0, opening_stock || 0, opening_stock || 0, currency || 'IQD']);
        return { lastID: result.lastID };
      }
      else if (action === 'UPDATE_INITIAL_PRODUCT') {
        const { id, name, code, category_id, unit_id, warehouse_id, purchase_price, sale_price, opening_stock, current_stock, currency } = payload;
        if (!id || !name) throw new Error('������ ��� ������');
        await db.run(` 
          UPDATE products 
          SET name = ?, code = ?, category_id = ?, unit_id = ?, warehouse_id = ?, purchase_price = ?, sale_price = ?, opening_stock = ?, current_stock = ?, currency = ?
          WHERE id = ? AND is_initial = 1
        `, [name, code || '', category_id || null, unit_id || null, warehouse_id || null, purchase_price || 0, sale_price || 0, opening_stock || 0, current_stock || 0, currency || 'IQD', id]);
        return { success: true };
      }
      else if (action === 'DELETE_INITIAL_PRODUCT') {
        const { id } = payload;
        if (!id) throw new Error('���� ����� �����');
        await db.run('DELETE FROM products WHERE id = ? AND is_initial = 1', [id]);
        return { success: true };
      }
      else if (action === 'DELETE_PRODUCT') {
        const { product_id, id } = payload;
        const targetId = product_id || id;
        if (!targetId) throw new Error('���� ����� �����');
        await db.run('DELETE FROM products WHERE id = ?', [targetId]);
        return { success: true };
      }
      else if (action === 'CONVERT_TO_INITIAL_PRODUCT') {
        const { product_id } = payload;
        if (!product_id) throw new Error('���� ����� �����');
        await db.run('UPDATE products SET is_initial = 1 WHERE id = ?', [product_id]);
        return { success: true };
      }
      else if (action === 'RESTORE_FROM_INITIAL_PRODUCT') {
        const { product_id } = payload;
        if (!product_id) throw new Error('���� ����� �����');
        await db.run('UPDATE products SET is_initial = 0 WHERE id = ?', [product_id]);
        return { success: true };
      }
      else if (action === 'GET_PRODUCTS') {
        const rows = await db.all(` 
          SELECT p.*, c.name as category_name, u.name as unit_name, w.name as warehouse_name 
          FROM products p
          LEFT JOIN product_categories c ON p.category_id = c.id
          LEFT JOIN units u ON p.unit_id = u.id
          LEFT JOIN warehouses w ON p.warehouse_id = w.id
          WHERE p.is_active = 1 AND p.is_initial = 0
          ORDER BY p.id DESC
        `);
        return rows;
      }
  else if (action === 'ADD_PRODUCT') {
    const { name, barcode, category_id, unit_id, warehouse_id, purchase_price, sell_price, current_stock, currency, allow_negative_stock } = payload;
    if (!name) {
      throw new Error('اسم الصنف مطلوب');
    }
    const catId = category_id == null ? null : parseInt(category_id) || null;
    const uId = unit_id == null ? null : parseInt(unit_id) || null;
    const whId = warehouse_id == null ? null : parseInt(warehouse_id) || null;
    let attempts = 0;
    let success = false;
    let lastError: any = null;
    let lastID: number | undefined;
    while (attempts < 3 && !success) {
      attempts++;
      try {
        const code = (attempts === 1 && barcode) ? barcode : `P-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const result = await db.run(
          `INSERT INTO products (name, code, category_id, unit_id, warehouse_id, purchase_price, sale_price, opening_stock, current_stock, currency, allow_negative_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, code || '', catId, uId, whId, purchase_price || 0, sell_price || 0, current_stock || 0, current_stock || 0, currency || 'IQD', allow_negative_stock ? 1 : 0]
        );
        lastID = result.lastID;
        success = true;
      } catch (e: any) {
        lastError = e;
        const msg = (e && e.message) ? String(e.message) : '';
        const isUniqueCode = msg.includes('UNIQUE') && (msg.includes('code') || msg.includes('"code"') || msg.includes('products.code'));
        if (!isUniqueCode || attempts >= 3) {
          throw e;
        }
      }
    }
    if (!success && lastError) {
      throw lastError;
    }
    return { lastID };
  }
  else if (action === 'UPDATE_PRODUCT') {
    const { id, name, barcode, category_id, unit_id, warehouse_id, purchase_price, sell_price, current_stock, currency, allow_negative_stock } = payload;
    const productId = id == null ? null : parseInt(id) || null;
    if (productId == null || isNaN(productId)) {
      throw new Error('معرف الصنف غير صالح');
    }
    const catId = category_id == null ? null : parseInt(category_id) || null;
    const uId = unit_id == null ? null : parseInt(unit_id) || null;
    const whId = warehouse_id == null ? null : parseInt(warehouse_id) || null;
    let attempts = 0;
    let success = false;
    let lastError: any = null;
    while (attempts < 3 && !success) {
      attempts++;
      try {
        const code = (attempts === 1 && barcode) ? barcode : `P-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await db.run(
          `UPDATE products SET name = ?, code = ?, category_id = ?, unit_id = ?, warehouse_id = ?, purchase_price = ?, sale_price = ?, current_stock = ?, currency = ?, allow_negative_stock = ? WHERE id = ?`,
          [name, code || '', catId, uId, whId, purchase_price || 0, sell_price || 0, current_stock || 0, currency || 'IQD', allow_negative_stock ? 1 : 0, productId]
        );
        success = true;
      } catch (e: any) {
        lastError = e;
        const msg = (e && e.message) ? String(e.message) : '';
        const isUniqueCode = msg.includes('UNIQUE') && (msg.includes('code') || msg.includes('"code"') || msg.includes('products.code'));
        if (!isUniqueCode || attempts >= 3) {
          throw e;
        }
      }
    }
    if (!success && lastError) {
      throw lastError;
    }
  }
  else if (action === 'UPDATE_SALE_INVOICE') {
    const { invoice_id, invoice_number, party_id, date, subtotal, discount_amount, discount_type, tax_rate, tax_amount, total, paid_amount, remaining_amount, currency, status, payment_method, buyer_name, notes, items, additional_expenses, fund_id } = payload;
    await db.run(`BEGIN TRANSACTION`);
    try {
      const oldInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', invoice_id);
      if (!oldInvoice) throw new Error('Invoice not found');
      const oldItems = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', invoice_id);
      for (const item of oldItems) {
        await db.run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', item.quantity, item.product_id);
      }
      if (oldInvoice.remaining_amount > 0 && oldInvoice.party_id) {
        const balanceField = oldInvoice.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, -oldInvoice.remaining_amount, oldInvoice.party_id);
      }
      const tTx = await db.all('SELECT id FROM treasury_transactions WHERE invoice_id = ?', invoice_id);
      for (const t of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t.id);
      }
      await db.run('DELETE FROM treasury_transactions WHERE invoice_id = ?', invoice_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', invoice_id);
      await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', invoice_id);
      await db.run('DELETE FROM invoice_expenses WHERE invoice_id = ?', invoice_id);
      await db.run(`
        UPDATE invoices SET
          invoice_number = ?, party_id = ?, date = ?, subtotal = ?, discount_amount = ?, 
          discount_type = ?, tax_rate = ?, tax_amount = ?, total = ?, paid_amount = ?, 
          remaining_amount = ?, currency = ?, payment_method = ?, status = ?, buyer_name = ?, notes = ?
        WHERE id = ?
      `, invoice_number, party_id, date, subtotal || 0, discount_amount || 0, discount_type || 'amount', tax_rate || 0, tax_amount || 0, total, paid_amount || 0, remaining_amount || 0, currency || 'IQD', payment_method, status, buyer_name, notes, invoice_id);
      for (const item of items) {
        const product = await db.get('SELECT current_stock, allow_negative_stock, name FROM products WHERE id = ?', item.product_id);
        if (product && !product.allow_negative_stock && product.current_stock < item.quantity) {
          throw new Error(`لا يمكن البيع بالسالب للصنف: ${product.name}`);
        }
        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, invoice_id, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        await db.run('UPDATE products SET current_stock = current_stock - ? WHERE id = ?', item.quantity, item.product_id);
      }
      if (additional_expenses && additional_expenses.length > 0) {
        for (const exp of additional_expenses) {
          await db.run(`
            INSERT INTO invoice_expenses (invoice_id, party_name, date, amount, details)
            VALUES (?, ?, ?, ?, ?)
          `, invoice_id, exp.party_name, exp.date, exp.amount, exp.details);
        }
      }
      if (party_id) {
        const balanceChange = remaining_amount || 0;
        const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', invoice_id, total, 0, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `فاتورة معدلة ${oldInvoice.invoice_number}`, date);
      }
      if (paid_amount > 0) {
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, fund_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, 'income', 'customer_payment', paid_amount, currency || 'IQD', party_id, invoice_id, `دفعة على فاتورة رقم ${oldInvoice.invoice_number}`, date, fund_id || null);
        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, 0, paid_amount, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة معدلة على فاتورة رقم ${oldInvoice.invoice_number}`, date);
        }
      }
      await db.run(`COMMIT`);
    } catch (e) {
      await db.run(`ROLLBACK`);
      throw e;
    }
  }
  else if (action === 'UPDATE_PURCHASE_INVOICE') {
    const { invoice_id, invoice_number, party_id, date, subtotal, discount_amount, discount_type, tax_rate, tax_amount, total, paid_amount, remaining_amount, currency, status, payment_method, buyer_name, notes, items, additional_expenses, fund_id } = payload;
    await db.run(`BEGIN TRANSACTION`);
    try {
      const oldInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', invoice_id);
      if (!oldInvoice) throw new Error('Invoice not found');
      const oldItems = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', invoice_id);
      for (const item of oldItems) {
        await db.run('UPDATE products SET current_stock = current_stock - ? WHERE id = ?', item.quantity, item.product_id);
      }
      if (oldInvoice.remaining_amount > 0 && oldInvoice.party_id) {
        const balanceField = oldInvoice.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} - ? WHERE id = ?`, oldInvoice.remaining_amount, oldInvoice.party_id);
      }
      const tTx = await db.all('SELECT id FROM treasury_transactions WHERE invoice_id = ?', invoice_id);
      for (const t of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t.id);
      }
      await db.run('DELETE FROM treasury_transactions WHERE invoice_id = ?', invoice_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', invoice_id);
      await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', invoice_id);
      await db.run('DELETE FROM invoice_expenses WHERE invoice_id = ?', invoice_id);
      await db.run(`
        UPDATE invoices SET
          invoice_number = ?, party_id = ?, date = ?, subtotal = ?, discount_amount = ?, 
          discount_type = ?, tax_rate = ?, tax_amount = ?, total = ?, paid_amount = ?, 
          remaining_amount = ?, currency = ?, payment_method = ?, status = ?, buyer_name = ?, notes = ?
        WHERE id = ?
      `, invoice_number, party_id, date, subtotal || 0, discount_amount || 0, discount_type || 'amount', tax_rate || 0, tax_amount || 0, total, paid_amount || 0, remaining_amount || 0, currency || 'IQD', payment_method, status, buyer_name, notes, invoice_id);
      for (const item of items) {
        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, invoice_id, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        await db.run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', item.quantity, item.product_id);
        if (item.update_purchase_price !== false) {
          await db.run('UPDATE products SET purchase_price = ?, currency = ? WHERE id = ?', item.unit_price, currency || 'IQD', item.product_id);
        }
      }
      if (additional_expenses && additional_expenses.length > 0) {
        for (const exp of additional_expenses) {
          await db.run(`
            INSERT INTO invoice_expenses (invoice_id, party_name, date, amount, details)
            VALUES (?, ?, ?, ?, ?)
          `, invoice_id, exp.party_name, exp.date, exp.amount, exp.details);
        }
      }
      if (party_id) {
        const balanceChange = remaining_amount || 0;
        const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} - ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', invoice_id, 0, total, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `فاتورة معدلة ${oldInvoice.invoice_number}`, date);
      }
      if (paid_amount > 0) {
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, fund_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, 'expense', 'supplier_payment', paid_amount, currency || 'IQD', party_id, invoice_id, `دفعة على فاتورة رقم ${oldInvoice.invoice_number}`, date, fund_id || null);
        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, paid_amount, 0, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة معدلة على فاتورة رقم ${oldInvoice.invoice_number}`, date);
        }
      }
      await db.run(`COMMIT`);
    } catch (e) {
      await db.run(`ROLLBACK`);
      throw e;
    }
  }
  else if (action === 'ADD_TREASURY_TRANSACTION') {
    const { type, amount, currency, category, notes, description, date: payloadDate, party_id, fund_id } = payload;
    const date = payloadDate || new Date().toISOString().split('T')[0];
    let validType = 'income';
    if (type === 'expense' || type === 'مصروف') {
      validType = 'expense';
    } else if (type === 'income' || type === 'إيراد' || type === 'receipt') {
      validType = 'income';
    }
    let lastID: number | undefined;
    await db.run(`BEGIN TRANSACTION`);
    try {
      const result = await db.run(
        `INSERT INTO treasury_transactions (type, amount, currency, category, description, date, party_id, fund_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [validType, amount, currency || 'IQD', category || 'عام', notes || description || '', date, party_id || null, fund_id || null]
      );
      lastID = result.lastID;
      if (party_id) {
        const balanceChange = -amount;
        const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        let debit = 0;
        let credit = 0;
        if (validType === 'income') credit = amount;
        if (validType === 'expense') debit = amount;
        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'payment', result.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', notes || description || (validType === 'income' ? 'سند قبض' : 'سند صرف'), date);
      }
      await db.run(`COMMIT`);
    } catch (e) {
      await db.run(`ROLLBACK`);
      throw e;
    }
    return { lastID };
  }
  else if (action === 'UPDATE_TREASURY_TRANSACTION') {
    const { id, type, amount, currency, category, notes, description, date: payloadDate, party_id } = payload;
    const date = payloadDate || new Date().toISOString().split('T')[0];
    let validType = 'income';
    if (type === 'expense' || type === 'مصروف') {
      validType = 'expense';
    } else if (type === 'income' || type === 'إيراد' || type === 'receipt') {
      validType = 'income';
    }
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');
    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }
    await db.run(`
      UPDATE treasury_transactions 
      SET type=?, category=?, amount=?, currency=?, party_id=?, description=?, date=?
      WHERE id=?
    `, validType, category || 'عام', amount, currency || 'IQD', party_id || null, notes || description || '', date, id);
    if (party_id) {
      const newBalanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${newBalanceField} = ${newBalanceField} - ? WHERE id = ?`, amount, party_id);
      const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
      let debit = 0;
      let credit = 0;
      if (validType === 'income') credit = amount;
      if (validType === 'expense') debit = amount;
      await db.run(`
        INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, party_id, 'payment', id, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', notes || description || (validType === 'income' ? 'سند قبض' : 'سند صرف'), date);
    }
  }
  else if (action === 'DELETE_TREASURY_TRANSACTION') {
    const { id } = payload;
    const oldTx = await db.get('SELECT * FROM treasury_transactions WHERE id = ?', id);
    if (!oldTx) throw new Error('Transaction not found');
    if (oldTx.party_id) {
      const oldBalanceField = oldTx.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
      await db.run(`UPDATE parties SET ${oldBalanceField} = ${oldBalanceField} + ? WHERE id = ?`, oldTx.amount, oldTx.party_id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', id);
    }
    await db.run('DELETE FROM treasury_transactions WHERE id = ?', id);
  }
  else if (action === 'ADD_FUND') {
    const { name, category, opening_balance_iqd, opening_balance_usd } = payload;
    await db.run(
      'INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system) VALUES (?, ?, ?, ?, 0)',
      name, category, opening_balance_iqd || 0, opening_balance_usd || 0
    );
  }
  else if (action === 'UPDATE_FUND') {
    const { id, name, category, opening_balance_iqd, opening_balance_usd } = payload;
    await db.run(
      'UPDATE funds SET name = ?, category = ?, opening_balance_iqd = ?, opening_balance_usd = ? WHERE id = ?',
      name, category, opening_balance_iqd || 0, opening_balance_usd || 0, id
    );
  }
}
