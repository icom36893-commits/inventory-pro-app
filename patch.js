const fs = require('fs');
let content = fs.readFileSync('src/pages/Treasury.tsx', 'utf8');

content = content.replace(/setDate\(tx\.date\);\s*setCategory\(tx\.category\);\s*setDescription\(tx\.description\);\s*setPartyId\(tx\.party_id\?\.toString\(\) \|\| ''\);/, 
  "setDate(tx.date);\n    setCategory(tx.category);\n    setDescription(tx.description);\n    setPartyId(tx.party_id?.toString() || '');\n    setFundId(tx.fund_id?.toString() || '');");

content = content.replace(/await \(window as any\)\.api\.treasury\.updateTransaction\(editingTransactionId, \{\s*type: transactionType,\s*category,\s*amount,\s*currency,\s*party_id: partyId \|\| null,\s*date,\s*description\s*\}\);/g, 
  "await (window as any).api.treasury.updateTransaction(editingTransactionId, {\n          type: transactionType,\n          category,\n          amount,\n          currency,\n          party_id: partyId || null,\n          fund_id: fundId || null,\n          date,\n          description\n        });");

content = content.replace(/await \(window as any\)\.api\.treasury\.createTransaction\(\{\s*type: transactionType,\s*category,\s*amount,\s*currency,\s*party_id: partyId \|\| null,\s*date,\s*description,\s*created_by: user\?\.id \|\| 1\s*\}\);/g, 
  "await (window as any).api.treasury.createTransaction({\n          type: transactionType,\n          category,\n          amount,\n          currency,\n          party_id: partyId || null,\n          fund_id: fundId || null,\n          date,\n          description,\n          created_by: user?.id || 1\n        });");

content = content.replace(/setAmount\(0\); setCategory\(''\); setDescription\(''\); setPartyId\(''\); setPartySearch\(''\);/g, 
  "setAmount(0); setCategory(''); setDescription(''); setPartyId(''); setFundId(''); setPartySearch('');");

content = content.replace(/(<label className="text-sm font-bold text-text-muted">.*?البيان.*?<\/label>\s*<input value=\{description\})/g, 
  "<div className=\"space-y-1\">\n            <label className=\"text-sm font-bold text-text-muted\">الصندوق</label>\n            <select value={fundId} onChange={e => setFundId(e.target.value)} className=\"w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20\">\n              <option value=\"\">الصندوق الافتراضي</option>\n              {funds.map(f => (\n                <option key={f.id} value={f.id}>{f.name}</option>\n              ))}\n            </select>\n          </div>\n          $1");

fs.writeFileSync('src/pages/Treasury.tsx', content);
console.log('Done');
