const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mobileCommandProcessor.ts');
let content = fs.readFileSync(filePath, 'utf8');

const getStatementCode = `
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
        const rows = await db.all(\`
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
          WHERE pt.party_id = ? AND pt.currency = ? \${dateFilterParty}
          ORDER BY pt.date ASC, pt.id ASC
        \`, ...paramsParty);
        
        let previousBalanceRow = null;
        if (fromDate) {
          const prevTx = await db.get(\`
            SELECT balance_iqd, balance_usd 
            FROM party_transactions 
            WHERE party_id = ? AND currency = ? AND date < ? 
            ORDER BY date DESC, id DESC LIMIT 1
          \`, accountId, currency, fromDate);
          
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
          const prevTreasury = await db.all(\`
            SELECT type, amount FROM treasury_transactions WHERE fund_id = ? AND date < ?
          \`, accountId, fromDate);
          
          for (const t of prevTreasury) {
            if (t.type === 'income') previousBalance += t.amount;
            if (t.type === 'expense') previousBalance -= t.amount;
          }

          const prevJournal = await db.all(\`
            SELECT jve.debit_\${currency.toLowerCase()} as debit, jve.credit_\${currency.toLowerCase()} as credit
            FROM journal_voucher_entries jve
            JOIN journal_vouchers jv ON jv.id = jve.voucher_id
            WHERE jve.account_type = 'fund' AND jve.account_id = ? AND jv.date < ?
          \`, accountId, fromDate);

          for (const j of prevJournal) {
            previousBalance += (j.debit || 0) - (j.credit || 0);
          }
        }

        const treasuryRows = await db.all(\`
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
          WHERE fund_id = ? \${dateFilterFundTreasury}
        \`, ...paramsFundTreasury);

        const journalRows = await db.all(\`
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
          WHERE jve.account_type = 'fund' AND jve.account_id = ? \${dateFilterFundJournal}
        \`, ...paramsFundJournal);

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
      return { status: 'ok', data: { statementData } };
    }
`;

if (!content.includes("action === 'GET_STATEMENT'")) {
  content = content.replace("else if (action === 'ADD_PARTY')", getStatementCode.trim() + "\\n    else if (action === 'ADD_PARTY')");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Added GET_STATEMENT successfully!");
} else {
  console.log("GET_STATEMENT already exists.");
}
