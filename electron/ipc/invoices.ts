import { ipcMain } from 'electron';
import { getDb } from '../../database/db';

export function initInvoicesIpc() {
  ipcMain.handle('invoices:getAll', async (_, filters: any = {}) => {
    const db = await getDb();
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        baseQuery += ` AND i.type IN (${filters.type.map(() => '?').join(', ')})`;
        params.push(...filters.type);
      } else {
        baseQuery += ` AND i.type = ?`;
        params.push(filters.type);
      }
    }
    if (filters?.search) {
      baseQuery += ` AND (i.invoice_number LIKE ? OR p.name LIKE ? OR i.buyer_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters?.startDate) {
      baseQuery += ` AND i.date >= ?`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      baseQuery += ` AND i.date <= ?`;
      params.push(filters.endDate);
    }

    const total = await db.get(`SELECT COUNT(*) as count ${baseQuery}`, ...params);
    const data = await db.all(`
      SELECT i.*, p.name as party_name 
      ${baseQuery}
      ORDER BY i.date DESC, i.created_at DESC
      LIMIT ? OFFSET ?
    `, ...params, limit, offset);

    return { data, total: total.count, page, limit };
  });

  ipcMain.handle('invoices:getOne', async (_, id) => {
    const db = await getDb();
    const invoice = await db.get(`
      SELECT i.*, p.name as party_name, p.phone as party_phone, p.address as party_address
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      WHERE i.id = ?
    `, id);

    if (invoice) {
      const items = await db.all(`
        SELECT ii.*, p.name as product_name, p.code as product_code
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = ?
      `, id);
      return { ...invoice, items };
    }
    return null;
  });

  ipcMain.handle('invoices:create', async (_, data) => {
    const db = await getDb();
    const { 
      invoice_number, type, party_id, date, subtotal, discount_amount, 
      discount_type, tax_rate, tax_amount, total, paid_amount, 
      remaining_amount, currency, payment_method, status, buyer_name, notes, items, created_by 
    } = data;

    try {
      await db.run('BEGIN TRANSACTION');
      const warnings: string[] = [];

      let finalInvoiceNumber = invoice_number;
      if (!finalInvoiceNumber || finalInvoiceNumber.includes('INV-') || finalInvoiceNumber.includes('PUR-')) {
        const prefix = type.includes('sale') ? 'INV-' : 'PUR-';
        const lastInvoice = await db.get(`SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`, `${prefix}%`);
        
        let nextNum = 1;
        if (lastInvoice && lastInvoice.invoice_number) {
          const numPart = lastInvoice.invoice_number.replace(prefix, '');
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed)) {
            nextNum = parsed + 1;
          }
        }
        finalInvoiceNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;
      }

      // 1. Create Invoice
      const result = await db.run(`
        INSERT INTO invoices (
          invoice_number, type, party_id, date, subtotal, discount_amount, 
          discount_type, tax_rate, tax_amount, total, paid_amount, 
          remaining_amount, currency, payment_method, status, buyer_name, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, finalInvoiceNumber, type, party_id, date, subtotal, discount_amount, 
         discount_type, tax_rate, tax_amount, total, paid_amount, 
         remaining_amount, currency || 'IQD', payment_method, status || 'confirmed', buyer_name, notes, created_by);
      
      const invoiceId = result.lastID;

      // 2. Create Items & Update Inventory
      for (const item of items) {
        let stockChange = 0;
        if (type === 'sale') stockChange = -item.quantity;
        else if (type === 'purchase') stockChange = item.quantity;
        else if (type === 'sale_return') stockChange = item.quantity;
        else if (type === 'purchase_return') stockChange = -item.quantity;

        if (stockChange < 0) {
          const product = await db.get('SELECT current_stock, allow_negative_stock, name FROM products WHERE id = ?', item.product_id);
          if (product && !product.allow_negative_stock && product.current_stock < Math.abs(stockChange)) {
            await db.run('ROLLBACK');
            throw new Error(`لا يمكن البيع بالسالب للصنف: ${product.name}`);
          }
        }

        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, invoiceId, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        
        await db.run(`UPDATE products SET current_stock = current_stock + ? WHERE id = ?`, stockChange, item.product_id);
        
        if (type === 'purchase') {
          await db.run('UPDATE products SET purchase_price = ? WHERE id = ?', item.unit_price, item.product_id);
        }
      }

      // 3. Update Party Balance and Insert Party Transaction
      if (party_id) {
        let balanceChange = remaining_amount;
        if (type === 'sale_return' || type === 'purchase_return') {
          balanceChange = -remaining_amount;
        }
        const balanceField = (currency || 'IQD') === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);

        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);

        let debit = 0;
        let credit = 0;
        if (type === 'sale') debit = total;
        else if (type === 'purchase') credit = total;
        else if (type === 'sale_return') credit = total;
        else if (type === 'purchase_return') debit = total;

        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', invoiceId, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `فاتورة ${type === 'sale' ? 'مبيعات' : type === 'purchase' ? 'مشتريات' : 'مردودات'} رقم ${finalInvoiceNumber}`, date);
      }

      // 4. Treasury Transaction (if paid)
      if (paid_amount > 0) {
        const treasuryType = (type === 'sale' || type === 'purchase_return') ? 'income' : 'expense';
        const category = (type === 'sale') ? 'customer_payment' : 'supplier_payment';
        
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, treasuryType, category, paid_amount, currency || 'IQD', party_id, invoiceId, `دفعة على فاتورة رقم ${finalInvoiceNumber}`, date, created_by);

        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          
          let debit = 0;
          let credit = 0;
          if (type === 'sale' || type === 'purchase_return') credit = paid_amount;
          else if (type === 'purchase' || type === 'sale_return') debit = paid_amount;

          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة على فاتورة رقم ${finalInvoiceNumber}`, date);
        }
      }

      for (const item of items) {
        if (type === 'sale') {
          const product = await db.get('SELECT current_stock, name FROM products WHERE id = ?', item.product_id);
          if (product) {
            if (product.current_stock <= 5) {
              warnings.push(`تنبيه: لقد وصل الصنف "${product.name}" إلى الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            } else if (product.current_stock === 6) {
              warnings.push(`تنبيه: لقد اقترب الصنف "${product.name}" من الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            }
          }
        }
      }

      await db.run('COMMIT');
      return { id: invoiceId, warnings };
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error creating invoice:', error);
      throw error;
    }
  });

  ipcMain.handle('invoices:update', async (_, data) => {
    const db = await getDb();
    const { 
      id, type, party_id, date, subtotal, discount_amount, 
      discount_type, tax_rate, tax_amount, total, paid_amount, 
      remaining_amount, currency, payment_method, status, buyer_name, notes, items, created_by 
    } = data;

    try {
      await db.run('BEGIN TRANSACTION');
      const warnings: string[] = [];
      
      const oldInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
      if (!oldInvoice) throw new Error('Invoice not found');

      // 1. Reverse old inventory
      const oldItems = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', id);
      for (const item of oldItems) {
        let stockChange = 0;
        if (oldInvoice.type === 'sale') stockChange = item.quantity;
        else if (oldInvoice.type === 'purchase') stockChange = -item.quantity;
        else if (oldInvoice.type === 'sale_return') stockChange = -item.quantity;
        else if (oldInvoice.type === 'purchase_return') stockChange = item.quantity;
        await db.run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', stockChange, item.product_id);
      }

      // 2. Reverse old party balance
      if (oldInvoice.remaining_amount > 0 || oldInvoice.paid_amount > 0) {
        let balanceChange = -oldInvoice.remaining_amount;
        if (oldInvoice.type === 'sale_return' || oldInvoice.type === 'purchase_return') balanceChange = oldInvoice.remaining_amount;
        const balanceField = oldInvoice.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, oldInvoice.party_id);
      }

      // 3. Delete old treasury transactions and party transactions
      const tTx = await db.all('SELECT id FROM treasury_transactions WHERE invoice_id = ?', id);
      for (const t of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t.id);
      }
      await db.run('DELETE FROM treasury_transactions WHERE invoice_id = ?', id);
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', id);
      await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', id);

      // 4. Update Invoice
      await db.run(`
        UPDATE invoices SET
          type = ?, party_id = ?, date = ?, subtotal = ?, discount_amount = ?, 
          discount_type = ?, tax_rate = ?, tax_amount = ?, total = ?, paid_amount = ?, 
          remaining_amount = ?, currency = ?, payment_method = ?, status = ?, buyer_name = ?, notes = ?
        WHERE id = ?
      `, type, party_id, date, subtotal, discount_amount, 
         discount_type, tax_rate, tax_amount, total, paid_amount, 
         remaining_amount, currency || 'IQD', payment_method, status || 'confirmed', buyer_name, notes, id);

      // 5. Create new items and apply inventory
      for (const item of items) {
        let stockChange = 0;
        if (type === 'sale') stockChange = -item.quantity;
        else if (type === 'purchase') stockChange = item.quantity;
        else if (type === 'sale_return') stockChange = item.quantity;
        else if (type === 'purchase_return') stockChange = -item.quantity;

        if (stockChange < 0) {
          const product = await db.get('SELECT current_stock, allow_negative_stock, name FROM products WHERE id = ?', item.product_id);
          if (product && !product.allow_negative_stock && product.current_stock < Math.abs(stockChange)) {
            await db.run('ROLLBACK');
            throw new Error(`لا يمكن البيع بالسالب للصنف: ${product.name}`);
          }
        }

        await db.run(`
          INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, id, item.product_id, item.quantity, item.unit_price, item.discount || 0, item.total);
        
        await db.run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', stockChange, item.product_id);
        
        if (type === 'purchase') {
          await db.run('UPDATE products SET purchase_price = ? WHERE id = ?', item.unit_price, item.product_id);
        }
      }

      // 6. Apply new Party Balance and Ledger (same as create)
      if (party_id && remaining_amount > 0) {
        let balanceChange = remaining_amount;
        if (type === 'sale_return' || type === 'purchase_return') balanceChange = -remaining_amount;
        const balanceField = currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, party_id);
        
        const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
        
        let debit = 0;
        let credit = 0;
        if (type === 'sale' || type === 'purchase_return') debit = remaining_amount;
        else if (type === 'purchase' || type === 'sale_return') credit = remaining_amount;

        await db.run(`
          INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, party_id, 'invoice', id, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `فاتورة معدلة ${oldInvoice.invoice_number}`, date);
      }

      if (paid_amount > 0) {
        let treasuryType = 'income';
        let category = 'مبيعات';
        if (type === 'purchase') { treasuryType = 'expense'; category = 'مشتريات'; }
        else if (type === 'sale_return') { treasuryType = 'expense'; category = 'مردودات مبيعات'; }
        else if (type === 'purchase_return') { treasuryType = 'income'; category = 'مردودات مشتريات'; }
        
        const tr = await db.run(`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, treasuryType, category, paid_amount, currency || 'IQD', party_id, id, `دفعة على فاتورة رقم ${oldInvoice.invoice_number}`, date, created_by);

        if (party_id) {
          const party = await db.get('SELECT current_balance_iqd, current_balance_usd FROM parties WHERE id = ?', party_id);
          let debit = 0;
          let credit = 0;
          if (type === 'sale' || type === 'purchase_return') credit = paid_amount;
          else if (type === 'purchase' || type === 'sale_return') debit = paid_amount;

          await db.run(`
            INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance_iqd, balance_usd, currency, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, party_id, 'payment', tr.lastID, debit, credit, party.current_balance_iqd, party.current_balance_usd, currency || 'IQD', `دفعة معدلة على فاتورة رقم ${oldInvoice.invoice_number}`, date);
        }
      }

      for (const item of items) {
        if (type === 'sale') {
          const product = await db.get('SELECT current_stock, name FROM products WHERE id = ?', item.product_id);
          if (product) {
            if (product.current_stock <= 5) {
              warnings.push(`تنبيه: لقد وصل الصنف "${product.name}" إلى الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            } else if (product.current_stock === 6) {
              warnings.push(`تنبيه: لقد اقترب الصنف "${product.name}" من الحد الأدنى للمخزون (المتبقي: ${product.current_stock})`);
            }
          }
        }
      }

      await db.run('COMMIT');
      return { id, warnings };
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error updating invoice:', error);
      throw error;
    }
  });

  ipcMain.handle('invoices:delete', async (_, id) => {
    const db = await getDb();
    try {
      await db.run('BEGIN TRANSACTION');
      const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
      if (!invoice) throw new Error('Invoice not found');

      // 1. Reverse Inventory
      const items = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', id);
      for (const item of items) {
        let stockChange = 0;
        if (invoice.type === 'sale') stockChange = item.quantity; // reverse sale -> add back
        else if (invoice.type === 'purchase') stockChange = -item.quantity; // reverse purchase -> remove
        else if (invoice.type === 'sale_return') stockChange = -item.quantity;
        else if (invoice.type === 'purchase_return') stockChange = item.quantity;
        
        await db.run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', stockChange, item.product_id);
      }

      // 2. Reverse Party Balance
      if (invoice.remaining_amount > 0 || invoice.paid_amount > 0) {
        let balanceChange = -invoice.remaining_amount; // reverse debt
        if (invoice.type === 'sale_return' || invoice.type === 'purchase_return') {
          balanceChange = invoice.remaining_amount;
        }
        const balanceField = invoice.currency === 'USD' ? 'current_balance_usd' : 'current_balance_iqd';
        await db.run(`UPDATE parties SET ${balanceField} = ${balanceField} + ? WHERE id = ?`, balanceChange, invoice.party_id);
      }

      // 3. Delete Treasury Transactions related to this invoice
      const tTx = await db.all('SELECT id FROM treasury_transactions WHERE invoice_id = ?', id);
      for (const t of tTx) {
        await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "payment"', t.id);
      }
      await db.run('DELETE FROM treasury_transactions WHERE invoice_id = ?', id);

      // 4. Delete Invoice Items, Party Transactions, and Invoice
      await db.run('DELETE FROM party_transactions WHERE reference_id = ? AND type = "invoice"', id);
      await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', id);
      await db.run('DELETE FROM invoices WHERE id = ?', id);

      await db.run('COMMIT');
      return { success: true };
    } catch (error) {
      await db.run('ROLLBACK');
      console.error('Error deleting invoice:', error);
      throw error;
    }
  });
}
