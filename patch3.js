const fs = require('fs');

function patchFile(file, isSale) {
  let content = fs.readFileSync(file, 'utf8');

  // Add states
  if (!content.includes('const [funds, setFunds]')) {
    content = content.replace(
      'const [customers, setCustomers] = useState<Party[]>([]);',
      'const [funds, setFunds] = useState<any[]>([]);\n  const [fundId, setFundId] = useState("");\n  const [customers, setCustomers] = useState<Party[]>([]);'
    );
    // Purchases has suppliers instead
    content = content.replace(
      'const [suppliers, setSuppliers] = useState<Party[]>([]);',
      'const [funds, setFunds] = useState<any[]>([]);\n  const [fundId, setFundId] = useState("");\n  const [suppliers, setSuppliers] = useState<Party[]>([]);'
    );
  }

  // Add fetchFunds
  if (!content.includes('const fetchFunds = async () => {')) {
    content = content.replace(
      'useEffect(() => {',
      'const fetchFunds = async () => {\n    const data = await (window as any).api.funds.getAll();\n    setFunds(data);\n  };\n\n  useEffect(() => {\n    fetchFunds();'
    );
  }

  // Add Auto Select logic
  if (!content.includes('[paymentMethod, funds]')) {
    const defaultCash = isSale ? 'عميل نقدي' : 'مورد نقدي';
    content = content.replace(
      '// Sync paid amount based on payment method',
      `useEffect(() => {
    if (!funds.length) return;
    if (paymentMethod === 'cash') {
      const f = funds.find(x => x.is_system === 1 && x.name === '${defaultCash}');
      if (f) setFundId(f.id.toString());
    } else {
      const f = funds.find(x => x.is_system === 1 && x.name === 'الصندوق الرئيسي');
      if (f) setFundId(f.id.toString());
    }
  }, [paymentMethod, funds]);\n\n  // Sync paid amount based on payment method`
    );
  }

  // Add fund_id to payload
  if (!content.includes('fund_id: fundId')) {
    content = content.replace(
      'payment_method: paymentMethod,',
      'payment_method: paymentMethod,\n        fund_id: fundId ? parseInt(fundId) : undefined,'
    );
  }

  // Add Select UI
  if (!content.includes('اختر الصندوق')) {
    content = content.replace(
      /<div className="space-y-1">\s*<label className="text-sm font-bold text-text-muted">ملاحظات<\/label>/g,
      `<div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">اختر الصندوق</label>
                <select value={fundId} onChange={e => setFundId(e.target.value)} className="w-full bg-bg-main border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  <option value="">الرجاء اختيار الصندوق</option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>{f.name} {f.is_system === 1 ? '(أساسي)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">ملاحظات</label>`
    );
  }

  fs.writeFileSync(file, content);
}

patchFile('src/pages/Sales.tsx', true);
patchFile('src/pages/Purchases.tsx', false);
console.log('Done');
