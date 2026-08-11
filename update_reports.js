const fs = require('fs');

const path = 'D:/app/src/features/reports/ReportsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject the currency state and helpers
content = content.replace(
  `  const { data: firebaseCustomers } = useFirebaseSync('customers');\n  const { data: firebaseTreasury } = useFirebaseSync('treasury');`,
  `  const { data: firebaseCustomers } = useFirebaseSync('customers');\n  const { data: firebaseTreasury } = useFirebaseSync('treasury');\n  const { data: firebaseSettings } = useFirebaseSync('settings');\n\n  const [displayCurrency, setDisplayCurrency] = useState<'IQD' | 'USD'>('IQD');\n  const exchangeRate = parseFloat((firebaseSettings as any)?.exchange_rate || '1500') || 1500;\n\n  const getConvertedValue = (val: number, from: string = 'IQD') => {\n    if (!val) return 0;\n    const fromCurr = from || 'IQD';\n    if (fromCurr === displayCurrency) return val;\n    if (fromCurr === 'IQD' && displayCurrency === 'USD') return val / exchangeRate;\n    if (fromCurr === 'USD' && displayCurrency === 'IQD') return val * exchangeRate;\n    return val;\n  };\n  \n  const cLabel = displayCurrency === 'IQD' ? ' د.ع' : ' $';\n  const formatVal = (val: number) => val.toLocaleString() + cLabel;`
);

// 2. Replace the hardcoded calculations block
const oldCalculationsRegex = /\/\/ ── حسابات قائمة الدخل ──[\s\S]*?(?=\/\/ ── التقارير المالية ──|const financialReports)/;
const newCalculations = `// ── حسابات قائمة الدخل ──
  const totalRevenue = sales.reduce((a: number, s: any) => a + getConvertedValue(s.total || 0, s.currency || 'IQD'), 0);
  const totalCOGS = purchases.reduce((a: number, p: any) => a + getConvertedValue(p.total || 0, p.currency || 'IQD'), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = treasury.filter((t: any) => t.type === 'expense').reduce((a: number, t: any) => a + getConvertedValue(t.amount || 0, t.currency || 'IQD'), 0);
  const netIncome = grossProfit - totalExpenses;

  // ── حسابات حركة المخزون ──
  const totalStockValue = inventory.reduce((a: number, i: any) => a + getConvertedValue((i.current_stock || 0) * (i.purchase_price || 0), i.currency || 'IQD'), 0);
  const totalSellValue = inventory.reduce((a: number, i: any) => a + getConvertedValue((i.current_stock || 0) * (i.sale_price || i.sell_price || 0), i.currency || 'IQD'), 0);
  const lowStockItems = inventory.filter((i: any) => (i.current_stock || 0) <= (i.min_stock || 5));

  // ── حسابات أرصدة العملاء ──
  const totalDebt = customers.reduce((a: number, c: any) => {
    return a + getConvertedValue(Math.max(c.current_balance_iqd || 0, 0), 'IQD') + getConvertedValue(Math.max(c.current_balance_usd || 0, 0), 'USD');
  }, 0);
  const totalCredit = customers.reduce((a: number, c: any) => {
    return a + getConvertedValue(Math.abs(Math.min(c.current_balance_iqd || 0, 0)), 'IQD') + getConvertedValue(Math.abs(Math.min(c.current_balance_usd || 0, 0)), 'USD');
  }, 0);

  // ── حسابات الميزانية العمومية ──
  const cashBalance = treasury
    .filter((t: any) => t.type === 'income')
    .reduce((a: number, t: any) => a + getConvertedValue(t.amount || 0, t.currency || 'IQD'), 0)
    - treasury.filter((t: any) => t.type === 'expense')
      .reduce((a: number, t: any) => a + getConvertedValue(t.amount || 0, t.currency || 'IQD'), 0);

  // ── كشف تغير الأسعار ──
  const priceChanges = inventory.filter((i: any) => (i.purchase_price || 0) > 0 || (i.sale_price || i.sell_price || 0) > 0);

  // ── تقرير المبيعات ──
  const salesByStatus = {
    cash: sales.filter((s: any) => s.payment_method === 'cash').reduce((a: number, s: any) => a + getConvertedValue(s.total || 0, s.currency || 'IQD'), 0),
    credit: sales.filter((s: any) => s.payment_method === 'credit').reduce((a: number, s: any) => a + getConvertedValue(s.total || 0, s.currency || 'IQD'), 0),
    partial: sales.filter((s: any) => s.payment_method === 'partial').reduce((a: number, s: any) => a + getConvertedValue(s.total || 0, s.currency || 'IQD'), 0),
  };

  // ── تقرير المشتريات ──
  const purchasesByStatus = {
    cash: purchases.filter((p: any) => p.payment_method === 'cash').reduce((a: number, p: any) => a + getConvertedValue(p.total || 0, p.currency || 'IQD'), 0),
    credit: purchases.filter((p: any) => p.payment_method === 'credit').reduce((a: number, p: any) => a + getConvertedValue(p.total || 0, p.currency || 'IQD'), 0),
  };

  `;
content = content.replace(oldCalculationsRegex, newCalculations);

// 3. Replace all instances of `(something).toLocaleString() + ' د.ع'` with `formatVal(something)`
content = content.replace(/\{(\(.*?\)|[a-zA-Z0-9_\.]+?)\.toLocaleString\(\) \+ ' د\.ع'\}/g, '{formatVal($1)}');

// 4. Also replace explicit text that is not in {} like:
// {(c.current_balance_iqd || 0).toLocaleString()} د.ع
content = content.replace(/\{\(c\.current_balance_iqd \|\| 0\)\.toLocaleString\(\)\}\s*د\.ع/g, '{formatVal((c.current_balance_iqd || 0))}');

// Add the Currency Toggle button next to "التقارير المالية" header or top of screen
const headerRegex = /<Text style=\{styles\.sectionTitle\}>التقارير المالية<\/Text>/;
const newHeader = `
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: -8 }}>
          <Text style={styles.sectionTitle}>التقارير المالية</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 20, padding: 4 }}
            onPress={() => setDisplayCurrency(prev => prev === 'IQD' ? 'USD' : 'IQD')}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: displayCurrency === 'IQD' ? '#fff' : 'transparent', elevation: displayCurrency === 'IQD' ? 2 : 0 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', color: displayCurrency === 'IQD' ? '#1E293B' : '#64748B' }}>د.ع</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: displayCurrency === 'USD' ? '#fff' : 'transparent', elevation: displayCurrency === 'USD' ? 2 : 0 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', color: displayCurrency === 'USD' ? '#1E293B' : '#64748B' }}>USD</Text>
            </View>
          </TouchableOpacity>
        </View>
`;
content = content.replace(headerRegex, newHeader);

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
