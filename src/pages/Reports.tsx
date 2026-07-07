import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ArrowLeftRight, 
  Users, 
  Download, 
  Printer,
  Landmark
} from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import Modal from '../components/shared/Modal';
import { useToast } from '../context/ToastContext';
import { useSettingsStore } from '../store';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import * as xlsx from 'xlsx';
import { formatCurrency, CurrencyType } from '../utils/currency';
import { defaultReportTemplate } from '../templates/defaultReport';

const ReportCard = ({ title, description, icon, color, onClick }: any) => {
  const textColor = color.replace('bg-', 'text-');
  const bgColor = color === 'bg-primary' ? 'bg-primary/10' : 
                  color === 'bg-warning' ? 'bg-warning/10' : 
                  color === 'bg-success' ? 'bg-success/10' : 
                  color === 'bg-danger' ? 'bg-danger/10' : 
                  color === 'bg-accent' ? 'bg-accent/10' :
                  color === 'bg-sidebar-bg' ? 'bg-sidebar-bg/10' : 'bg-gray-100';

  return (
  <div onClick={onClick} className="bg-white p-6 rounded-3xl border border-border shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
    <div className={`w-14 h-14 rounded-2xl ${bgColor} ${textColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-muted mb-6 leading-relaxed">{description}</p>
    <div className="flex justify-between items-center pt-4 border-t border-border">
      <div className="flex items-center gap-2 text-xs font-bold text-primary">
        <FileText size={14} />
        عرض التقرير
      </div>
      <div className="flex gap-2">
        <button className="p-2 rounded-lg hover:bg-bg-main text-text-muted transition-colors">
          <Download size={14} />
        </button>
        <button className="p-2 rounded-lg hover:bg-bg-main text-text-muted transition-colors">
          <Printer size={14} />
        </button>
      </div>
    </div>
  </div>
)};

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyType>('IQD');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { settings } = useSettingsStore();

  const exchangeRate = parseFloat((settings as any)?.exchange_rate || '1500') || 1500;

  const formatConvertedCurrency = (amount: number, fromCurrency: string = 'IQD', toCurrency: string = displayCurrency) => {
    if (fromCurrency === toCurrency) return formatCurrency(amount, toCurrency as CurrencyType);
    if (fromCurrency === 'IQD' && toCurrency === 'USD') return formatCurrency(amount / exchangeRate, 'USD');
    if (fromCurrency === 'USD' && toCurrency === 'IQD') return formatCurrency(amount * exchangeRate, 'IQD');
    return formatCurrency(amount, toCurrency as CurrencyType);
  };

  const handleProductSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setProductSearch(query);
    if (query.length > 1) {
      const results = await (window as any).api.products.search(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const fetchReportData = async (reportType: string) => {
    setIsLoading(true);
    try {
      if (reportType === 'income') {
        const data = await (window as any).api.reports.getIncomeStatement({ startDate, endDate });
        setReportData(data);
      } else if (reportType === 'sales') {
        const data = await (window as any).api.reports.getSales({ startDate, endDate });
        setReportData(data);
      } else if (reportType === 'purchases') {
        const data = await (window as any).api.reports.getPurchases({ startDate, endDate });
        setReportData(data);
      } else if (reportType === 'inventory') {
        const data = await (window as any).api.reports.getInventoryMovement({ startDate, endDate });
        setReportData(data);
      } else if (reportType === 'balances') {
        const data = await (window as any).api.reports.getBalances({ type: 'customer' });
        setReportData(data);
      } else if (reportType === 'balance_sheet') {
        const data = await (window as any).api.reports.getBalanceSheet();
        setReportData(data);
      } else if (reportType === 'purchase_prices') {
        const data = await (window as any).api.reports.getPurchasePrices({ startDate, endDate, productName: productSearch });
        setReportData(data);
      } else {
        setReportData(null); 
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحميل التقرير');
    } finally {
      setIsLoading(false);
    }
  };

  const openReport = (type: string) => {
    setActiveReport(type);
    fetchReportData(type);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const filename = `report_${activeReport}_${new Date().getTime()}.pdf`;
      toast.success('جاري فتح نافذة الحفظ...');
      
      const result = await (window as any).api.settings.printToPDF({
        defaultName: filename
      });
      
      if (result.success) {
        toast.success('تم حفظ التقرير بنجاح');
      } else if (!result.canceled) {
        toast.error(result.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    let dataToExport: any[] = [];
    
    const valueHeader = `القيمة (${displayCurrency === 'IQD' ? 'دينار' : 'دولار'})`;
    
    const getConvertedValue = (val: number, from: string = 'IQD') => {
      if (from === displayCurrency) return val;
      if (from === 'IQD' && displayCurrency === 'USD') return val / exchangeRate;
      if (from === 'USD' && displayCurrency === 'IQD') return val * exchangeRate;
      return val;
    };

    if (activeReport === 'income') {
      dataToExport = [
        ...reportData.revenues.map((r: any) => ({ 'النوع': 'إيراد', 'البند': r.name, [valueHeader]: getConvertedValue(r.value) })),
        ...reportData.expenses.map((e: any) => ({ 'النوع': 'مصروف', 'البند': e.name, [valueHeader]: getConvertedValue(e.value) })),
        { 'النوع': 'الصافي', 'البند': 'صافي الدخل', [valueHeader]: getConvertedValue(reportData.netIncome) }
      ];
    } else if (activeReport === 'sales' || activeReport === 'purchases') {
      dataToExport = reportData.map((row: any) => ({
        'رقم الفاتورة': row.invoice_number,
        'التاريخ': row.date,
        'الطرف': row.party_name,
        'طريقة الدفع': row.payment_method === 'cash' ? 'نقداً' : row.payment_method === 'credit' ? 'آجل' : 'جزئي',
        'الإجمالي': row.total
      }));
    } else if (activeReport === 'inventory') {
      dataToExport = reportData.map((row: any) => ({
        'كود الصنف': row.product_code,
        'اسم الصنف': row.product_name,
        'وارد': row.inward,
        'منصرف': row.outward,
        'الرصيد الحالي': row.current_stock
      }));
    } else if (activeReport === 'balances') {
      dataToExport = reportData.map((row: any) => ({
        'اسم العميل': row.name,
        'الهاتف': row.phone,
        'الرصيد المستحق (دينار)': row.current_balance_iqd,
        'الرصيد المستحق (دولار)': row.current_balance_usd
      }));
    } else if (activeReport === 'balance_sheet') {
      dataToExport = [
        { 'القسم': 'الأصول', 'البند': 'الخزينة النقدية', [valueHeader]: getConvertedValue(reportData.assets.treasury) },
        { 'القسم': 'الأصول', 'البند': 'المخزون', [valueHeader]: getConvertedValue(reportData.assets.inventory) },
        { 'القسم': 'الأصول', 'البند': 'أرصدة العملاء', [valueHeader]: getConvertedValue(reportData.assets.customers) },
        { 'القسم': 'الخصوم', 'البند': 'أرصدة الموردين', [valueHeader]: getConvertedValue(reportData.liabilities.suppliers) },
        { 'القسم': 'المركز المالي', 'البند': 'صافي حقوق الملكية', [valueHeader]: getConvertedValue(reportData.assets.total - reportData.liabilities.total) }
      ];
    } else if (activeReport === 'purchase_prices') {
      dataToExport = reportData.map((row: any) => ({
        'اسم الصنف': row.product_name,
        'المورد': row.supplier_name || 'غير محدد',
        'رقم الفاتورة': row.invoice_number,
        'التاريخ': row.date,
        'الكمية': row.quantity,
        'السعر': row.purchase_price
      }));
    }
    
    if (dataToExport.length === 0) return toast.warning('لا توجد بيانات للتصدير');
    
    const ws = xlsx.utils.json_to_sheet(dataToExport);
    // Adjust column widths roughly
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Report');
    xlsx.writeFile(wb, `report_${activeReport}_${new Date().getTime()}.xlsx`);
    toast.success('تم تصدير التقرير إلى Excel');
  };

  const renderIncomeStatement = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-bg-main p-4 rounded-xl">
            <h4 className="font-bold text-success mb-4 border-b border-success/20 pb-2">الإيرادات</h4>
            {reportData.revenues.map((r: any, i: number) => (
              <div key={i} className="flex justify-between mb-2 text-sm">
                <span>{r.name}</span>
                <span className="font-bold" dir="ltr">{formatConvertedCurrency(r.value)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-success mt-4 pt-2 border-t border-success/20">
              <span>إجمالي الإيرادات</span>
              <span dir="ltr">{formatConvertedCurrency(reportData.totalRevenue)}</span>
            </div>
          </div>
          
          <div className="bg-bg-main p-4 rounded-xl">
            <h4 className="font-bold text-danger mb-4 border-b border-danger/20 pb-2">المصروفات</h4>
            {reportData.expenses.map((e: any, i: number) => (
              <div key={i} className="flex justify-between mb-2 text-sm">
                <span>{e.name}</span>
                <span className="font-bold" dir="ltr">{formatConvertedCurrency(e.value)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-danger mt-4 pt-2 border-t border-danger/20">
              <span>إجمالي المصروفات</span>
              <span dir="ltr">{formatConvertedCurrency(reportData.totalExpense)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-primary text-white p-6 rounded-xl flex justify-between items-center text-xl font-bold shadow-lg">
          <span>صافي الدخل (الربح/الخسارة)</span>
          <span dir="ltr">{formatConvertedCurrency(reportData.netIncome)}</span>
        </div>
      </div>
    );
  };

  const renderSalesPurchasesTable = (type: string) => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'invoice_number', label: 'رقم الفاتورة' },
      { key: 'date', label: 'التاريخ' },
      { key: 'party_name', label: type === 'sales' ? 'العميل' : 'المورد' },
      { key: 'payment_method', label: 'طريقة الدفع', render: (v: string) => v === 'cash' ? 'نقداً' : v === 'credit' ? 'آجل' : 'جزئي' },
      { key: 'total', label: 'الإجمالي', render: (v: number, item: any) => <span dir="ltr">{formatConvertedCurrency(v, item.currency || 'IQD')}</span> },
    ];
    return <DataTable columns={cols} data={reportData} />;
  };

  const renderPurchasePricesTable = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'product_name', label: 'اسم الصنف' },
      { key: 'supplier_name', label: 'المورد', render: (v: string) => v || 'غير محدد' },
      { key: 'invoice_number', label: 'رقم الفاتورة' },
      { key: 'date', label: 'التاريخ' },
      { key: 'quantity', label: 'الكمية' },
      { key: 'purchase_price', label: 'سعر الشراء', render: (v: number, item: any) => <span dir="ltr" className="font-bold text-primary">{formatConvertedCurrency(v, item.currency || 'IQD')}</span> },
    ];
    return <DataTable columns={cols} data={reportData} />;
  };

  const renderInventoryMovement = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'product_code', label: 'كود الصنف' },
      { key: 'product_name', label: 'اسم الصنف' },
      { key: 'inward', label: 'وارد', render: (v: number) => <span className="text-success font-bold">{v}</span> },
      { key: 'outward', label: 'منصرف', render: (v: number) => <span className="text-danger font-bold">{v}</span> },
      { key: 'current_stock', label: 'الرصيد الحالي', render: (v: number) => <span className="font-bold">{v}</span> },
    ];
    return <DataTable columns={cols} data={reportData} />;
  };

  const renderBalances = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'name', label: 'اسم العميل' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'current_balance_iqd', label: 'الرصيد (دينار)', render: (v: number) => <span className="text-danger font-bold">{formatCurrency(v || 0, 'IQD')}</span> },
      { key: 'current_balance_usd', label: 'الرصيد (دولار)', render: (v: number) => <span className="text-danger font-bold">{formatCurrency(v || 0, 'USD')}</span> },
    ];
    return <DataTable columns={cols} data={reportData} />;
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-bg-main p-6 rounded-2xl">
            <h4 className="font-bold text-success text-xl mb-6 border-b border-border pb-4">الأصول (الموجودات)</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                <span className="text-text-muted">الخزينة النقدية</span>
                <span className="font-bold text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.treasury)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                <span className="text-text-muted">قيمة المخزون (بالتكلفة)</span>
                <span className="font-bold text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.inventory)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                <span className="text-text-muted">أرصدة العملاء (مدينون)</span>
                <span className="font-bold text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.customers)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-success text-white rounded-xl shadow-md mt-6">
                <span className="font-bold text-xl">إجمالي الأصول</span>
                <span className="font-bold text-2xl" dir="ltr">{formatConvertedCurrency(reportData.assets.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-bg-main p-6 rounded-2xl">
            <h4 className="font-bold text-danger text-xl mb-6 border-b border-border pb-4">الخصوم (الالتزامات)</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                <span className="text-text-muted">أرصدة الموردين (دائنون)</span>
                <span className="font-bold text-lg" dir="ltr">{formatConvertedCurrency(reportData.liabilities.suppliers)}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-danger text-white rounded-xl shadow-md mt-6">
                <span className="font-bold text-xl">إجمالي الالتزامات</span>
                <span className="font-bold text-2xl" dir="ltr">{formatConvertedCurrency(reportData.liabilities.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-sidebar-bg text-white p-8 rounded-3xl flex justify-between items-center shadow-xl">
          <span className="text-2xl font-bold">صافي حقوق الملكية (المركز المالي)</span>
          <span className="text-4xl font-extrabold" dir="ltr">{formatConvertedCurrency(reportData.assets.total - reportData.liabilities.total)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">تقارير النظام</h1>
        <p className="text-text-muted text-sm">تقارير تحليلية ومحاسبية شاملة لجميع أقسام النظام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="قائمة الدخل" 
          description="تقرير مفصل يوضح الإيرادات والمصروفات وصافي الربح خلال فترة زمنية محددة."
          icon={<TrendingUp />}
          color="bg-success"
          onClick={() => openReport('income')}
        />
        <ReportCard 
          title="تقرير المبيعات" 
          description="تحليل شامل للمبيعات حسب الأصناف، العملاء، والمناديب مع مقارنات بيانية."
          icon={<BarChart3 />}
          color="bg-primary"
          onClick={() => openReport('sales')}
        />
        <ReportCard 
          title="تقرير المشتريات" 
          description="ملخص للمشتريات من الموردين مع توضيح الدفعات النقدية والآجلة."
          icon={<ArrowLeftRight />}
          color="bg-warning"
          onClick={() => openReport('purchases')}
        />
        <ReportCard 
          title="حركة المخزون" 
          description="متابعة حركة دخول وخروج الأصناف من المخازن وتحديد الرواكد."
          icon={<PieIcon />}
          color="bg-accent"
          onClick={() => openReport('inventory')}
        />
        <ReportCard 
          title="أرصدة العملاء" 
          description="كشف تفصيلي بأرصدة العملاء والمديونيات المتأخرة وأعمار الديون."
          icon={<Users />}
          color="bg-danger"
          onClick={() => openReport('balances')}
        />
        <ReportCard 
          title="الميزانية العمومية" 
          description="ملخص للأصول والالتزامات وحقوق الملكية للشركة في لحظة زمنية معينة."
          icon={<Landmark size={28} />}
          color="bg-sidebar-bg"
          onClick={() => openReport('balance_sheet')}
        />
        <ReportCard 
          title="كشف تغير الأسعار" 
          description="مقارنة أسعار شراء الأصناف من موردين مختلفين عبر فترات زمنية لمعرفة تغيرات السعر."
          icon={<ArrowLeftRight />}
          color="bg-warning"
          onClick={() => openReport('purchase_prices')}
        />
      </div>

      {activeReport && (
        <Modal 
          isOpen={true} 
          onClose={() => setActiveReport(null)} 
          title={
            activeReport === 'income' ? 'قائمة الدخل' :
            activeReport === 'sales' ? 'تقرير المبيعات' :
            activeReport === 'purchases' ? 'تقرير المشتريات' : 
            activeReport === 'inventory' ? 'حركة المخزون' :
            activeReport === 'balances' ? 'أرصدة العملاء' :
            activeReport === 'balance_sheet' ? 'الميزانية العمومية' :
            activeReport === 'purchase_prices' ? 'كشف تغير الأسعار' : 'تقرير'
          }
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex gap-4 items-end bg-bg-main p-4 rounded-xl">
              <div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">من تاريخ</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-border rounded-xl p-2 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">إلى تاريخ</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-border rounded-xl p-2 outline-none" />
              </div>
              {activeReport === 'purchase_prices' && (
                <div className="space-y-1 relative">
                  <label className="text-sm font-bold text-text-muted">اسم الصنف</label>
                  <input type="text" placeholder="بحث..." value={productSearch} onChange={handleProductSearch} className="w-full bg-white border border-border rounded-xl p-2 outline-none" />
                  {searchResults.length > 0 && (
                    <div className="absolute top-[100%] right-0 w-[300px] mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => { setProductSearch(p.name); setSearchResults([]); }} 
                          className="p-3 hover:bg-bg-main cursor-pointer border-b border-border last:border-0"
                        >
                          <span className="font-bold">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => fetchReportData(activeReport)} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-light h-[42px]">
                تحديث
              </button>
              <div className="mr-auto flex gap-2">
                <button onClick={() => setDisplayCurrency(displayCurrency === 'IQD' ? 'USD' : 'IQD')} className="bg-white border border-border text-primary px-4 py-2 rounded-xl font-bold hover:bg-bg-main flex items-center gap-2 h-[42px]">
                  <ArrowLeftRight size={18} /> {displayCurrency === 'IQD' ? 'عرض بالدولار' : 'عرض بالدينار'}
                </button>
                <button onClick={handleExportExcel} className="bg-[#107C41] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#107C41]/90 flex items-center gap-2 h-[42px]">
                  <Download size={18} /> Excel
                </button>
                <button onClick={handleExportPDF} className="bg-[#E3242B] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#E3242B]/90 flex items-center gap-2 h-[42px]">
                  <Download size={18} /> PDF
                </button>
                <button onClick={handlePrint} className="bg-white border border-border text-text-primary px-4 py-2 rounded-xl font-bold hover:bg-bg-main flex items-center gap-2 h-[42px]">
                  <Printer size={18} /> طباعة
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-text-muted">جاري تحميل التقرير...</div>
            ) : (
              <div id="print-area">
                {(() => {
                  let headerHtml = '';
                  let footerHtml = '';
                  
                  if (settings?.reports_template_type === 'custom') {
                    const activeReportTitle = activeReport === 'income' ? 'قائمة الدخل' : activeReport === 'sales' ? 'تقرير المبيعات' : activeReport === 'inventory' ? 'حركة المخزون' : activeReport === 'balance_sheet' ? 'الميزانية العمومية' : activeReport === 'balances' ? 'أرصدة العملاء' : activeReport === 'purchase_prices' ? 'كشف تغير الأسعار' : 'تقرير المشتريات';
                    
                    let htmlString = settings?.reports_custom_html || defaultReportTemplate;
                    htmlString = htmlString
                      .replace('{{company_name}}', settings?.company_name || 'اسم الشركة')
                      .replace('{{company_address}}', settings?.address || '')
                      .replace('{{company_phone}}', settings?.phone || '')
                      .replace('{{tax_number_html}}', settings?.tax_number ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">الرقم الضريبي: ${settings.tax_number}</p>` : '')
                      .replace('{{logo_img}}', settings?.print_show_logo !== 'false' && settings?.logo ? `<img src="${settings.logo}" style="height: ${settings?.reports_logo_size || 60}px; object-fit: contain;" />` : '')
                      .replace('{{report_title}}', activeReportTitle)
                      .replace('{{date}}', new Date().toLocaleDateString('ar-IQ'))
                      .replace('{{start_date}}', startDate || '-')
                      .replace('{{end_date}}', endDate || '-')
                      .replace('{{footer_text_html}}', settings?.reports_footer_text ? `<div style="margin-top: 30px; text-align: center; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 15px; border-radius: 8px;">${settings.reports_footer_text}</div>` : '');

                    const parts = htmlString.split('{{report_content}}');
                    headerHtml = parts[0] || '';
                    footerHtml = parts[1] || '';
                  }

                  return (
                    <div className={settings?.reports_template_type === 'custom' ? 'print-area-view print:p-8 print:bg-white text-black font-cairo' : ''} dir="rtl">
                      {settings?.reports_template_type === 'custom' ? (
                        <div dangerouslySetInnerHTML={{ __html: headerHtml }} className="hidden print:block mb-6" />
                      ) : (
                        <div className="hidden print:block mb-8 text-center">
                          <h2 className="text-2xl font-bold mb-2">
                            {activeReport === 'income' ? 'قائمة الدخل' : activeReport === 'sales' ? 'تقرير المبيعات' : activeReport === 'inventory' ? 'حركة المخزون' : activeReport === 'balance_sheet' ? 'الميزانية العمومية' : activeReport === 'balances' ? 'أرصدة العملاء' : activeReport === 'purchase_prices' ? 'كشف تغير الأسعار' : 'تقرير المشتريات'}
                          </h2>
                          {(activeReport !== 'balances' && activeReport !== 'balance_sheet' && activeReport !== 'purchase_prices') && (
                            <p>الفترة من {startDate} إلى {endDate}</p>
                          )}
                        </div>
                      )}
                      
                      {activeReport === 'income' && renderIncomeStatement()}
                      {(activeReport === 'sales' || activeReport === 'purchases') && renderSalesPurchasesTable(activeReport)}
                      {activeReport === 'inventory' && renderInventoryMovement()}
                      {activeReport === 'balances' && renderBalances()}
                      {activeReport === 'balance_sheet' && renderBalanceSheet()}
                      {activeReport === 'purchase_prices' && renderPurchasePricesTable()}
                      
                      {settings?.reports_template_type === 'custom' && (
                        <div dangerouslySetInnerHTML={{ __html: footerHtml }} className="hidden print:block mt-6" />
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reports;
