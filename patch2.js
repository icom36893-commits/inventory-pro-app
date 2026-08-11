const fs = require('fs');
let content = fs.readFileSync('electron/ipc/invoices.ts', 'utf8');

const replacement1 = `        let invoiceFundId = null;
        if (payment_method === 'cash') {
          const fundName = (type === 'sale' || type === 'purchase_return') ? 'عميل نقدي' : 'مورد نقدي';
          const fundRow = await db.get("SELECT id FROM funds WHERE is_system = 1 AND name = ? LIMIT 1", fundName);
          if (fundRow) invoiceFundId = fundRow.id;
        }
        
        const tr = await db.run(\`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by, fund_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
\`, treasuryType, category, paid_amount, currency || 'IQD', party_id || null, invoiceId, \`دفعة عن فاتورة مبيعات رقم \${finalInvoiceNumber}\`, date, created_by, invoiceFundId);`;

const replacement2 = `        let invoiceFundId = null;
        if (payment_method === 'cash') {
          const fundName = (type === 'sale' || type === 'purchase_return') ? 'عميل نقدي' : 'مورد نقدي';
          const fundRow = await db.get("SELECT id FROM funds WHERE is_system = 1 AND name = ? LIMIT 1", fundName);
          if (fundRow) invoiceFundId = fundRow.id;
        }
        
        const tr = await db.run(\`
          INSERT INTO treasury_transactions (type, category, amount, currency, party_id, invoice_id, description, date, created_by, fund_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
\`, treasuryType, category, paid_amount, currency || 'IQD', party_id || null, id, \`دفعة عن تعديل فاتورة رقم \${oldInvoice.invoice_number}\`, date, created_by, invoiceFundId);`;

content = content.replace(
  /const tr = await db\.run\([\s\S]*?treasuryType, category, paid_amount, currency \|\| 'IQD', party_id, invoiceId,.*?date, created_by\);/g,
  replacement1
);
content = content.replace(
  /const tr = await db\.run\([\s\S]*?treasuryType, category, paid_amount, currency \|\| 'IQD', party_id, id,.*?date, created_by\);/g,
  replacement2
);

fs.writeFileSync('electron/ipc/invoices.ts', content);
console.log('Done');
