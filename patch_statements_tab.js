const fs = require('fs');

let content = fs.readFileSync('src/components/treasury/StatementsTab.tsx', 'utf8');

// Imports
content = content.replace(
  'import { Printer, FilePlus2 } from \\'lucide-react\\';',
  'import { Printer, Calendar } from \\'lucide-react\\';\nimport SearchableSelect from \\'../shared/SearchableSelect\\';'
);

// Remove old state, add new state
content = content.replace(
  '  const [accountType, setAccountType] = useState<\\'party\\' | \\'fund\\'>(\\'party\\');\n  const [accountId, setAccountId] = useState<number | \\'\\'>(\\'\\');',
  `  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
`
);

// Update fetchStatement
content = content.replace(
  `  const fetchStatement = async () => {
    if (accountId === '') {
      setStatement([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await window.api.statements.get(accountType, Number(accountId), currency);
      setStatement(data);
    } catch (error: any) {
      toast.showError('حدث خطأ أثناء جلب الكشف: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [accountType, accountId, currency]);

  // Handle changing account type to reset the ID
  useEffect(() => {
    setAccountId('');
  }, [accountType]);`,
  `  const fetchStatement = async () => {
    if (!selectedAccount) {
      setStatement([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const [type, idStr] = selectedAccount.split('-');
      const data = await window.api.statements.get(type as 'party' | 'fund', Number(idStr), currency, fromDate || undefined, toDate || undefined);
      setStatement(data);
    } catch (error: any) {
      toast.showError('حدث خطأ أثناء جلب الكشف: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [selectedAccount, currency, fromDate, toDate]);
`
);

// Prepare options for Combobox
const optionsLogic = `
  const searchOptions = [
    ...parties.map(p => ({ value: \`party-\${p.id}\`, label: p.name, type: p.type === 'customer' ? 'عميل' : 'مورد' })),
    ...funds.map(f => ({ value: \`fund-\${f.id}\`, label: f.name, type: 'صندوق' }))
  ];
`;

content = content.replace(
  '  const statementColumns = [',
  optionsLogic + '\n  const statementColumns = ['
);

// Replace Account Selection UI
const oldUI = `        {/* Account Selection */}
        <div className="flex gap-4 flex-1">
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as 'party' | 'fund')}
            className="px-4 py-2 border border-border rounded-xl bg-bg-main outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="party">عملاء / موردين</option>
            <option value="fund">الصناديق</option>
          </select>

          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 px-4 py-2 border border-border rounded-xl bg-bg-main outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">اختر الحساب...</option>
            {accountType === 'party' 
              ? parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type === 'customer' ? 'عميل' : 'مورد'})</option>)
              : funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
            }
          </select>
        </div>`;

const newUI = `        {/* Account Selection & Date Filters */}
        <div className="flex flex-wrap gap-4 flex-1 items-center">
          <div className="w-64 z-10">
            <SearchableSelect 
              options={searchOptions}
              value={selectedAccount}
              onChange={setSelectedAccount}
              placeholder="اختر الحساب (بحث متقدم)..."
            />
          </div>
          
          <div className="flex items-center gap-2 bg-bg-main px-3 py-1.5 rounded-xl border border-border">
            <Calendar size={18} className="text-text-muted" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">من</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold"
              />
            </div>
            <div className="w-px h-4 bg-border mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">إلى</span>
              <input 
                type="date" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold"
              />
            </div>
          </div>
        </div>`;

content = content.replace(oldUI, newUI);

// Replace disabled condition on printer
content = content.replace(
  'disabled={!accountId || statement.length === 0}',
  'disabled={!selectedAccount || statement.length === 0}'
);
content = content.replace(
  '{accountId === \\'\\' ? (',
  '{!selectedAccount ? ('
);


fs.writeFileSync('src/components/treasury/StatementsTab.tsx', content);
console.log('StatementsTab Patched');
