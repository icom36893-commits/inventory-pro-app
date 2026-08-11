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
import { useSettingsStore, useAuthStore, usePermissionsStore } from '../store';

import * as xlsx from 'xlsx';
import { formatCurrency, CurrencyType } from '../utils/currency';
import { defaultReportTemplate } from '../templates/defaultReport';

const ReportCard = ({ title, description, icon, color, onClick }: any) => {
  const textColor = color.replace('bg-', 'text-');
  const bgGradient = color === 'bg-primary' ? 'from-primary/20 to-primary/5 text-primary' : 
                     color === 'bg-warning' ? 'from-orange-500/20 to-orange-500/5 text-orange-500' : 
                     color === 'bg-success' ? 'from-green-500/20 to-green-500/5 text-green-500' : 
                     color === 'bg-danger' ? 'from-red-500/20 to-red-500/5 text-red-500' : 
                     color === 'bg-accent' ? 'from-purple-500/20 to-purple-500/5 text-purple-500' :
                     color === 'bg-sidebar-bg' ? 'from-gray-800/20 to-gray-800/5 text-gray-800' : 'from-gray-200 to-gray-100 text-gray-600';

  const hoverBorder = color === 'bg-primary' ? 'hover:border-primary/30' : 
                      color === 'bg-warning' ? 'hover:border-orange-500/30' : 
                      color === 'bg-success' ? 'hover:border-green-500/30' : 
                      color === 'bg-danger' ? 'hover:border-red-500/30' : 
                      color === 'bg-accent' ? 'hover:border-purple-500/30' :
                      color === 'bg-sidebar-bg' ? 'hover:border-gray-800/30' : 'hover:border-gray-300';

  return (
  <div onClick={onClick} className={`bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl ${hoverBorder} hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden`}>
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
      {React.cloneElement(icon, { size: 30 })}
    </div>
    <h3 className="text-xl font-black text-gray-800 mb-3 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-sm text-gray-500 mb-8 leading-relaxed line-clamp-2">{description}</p>
    <div className="flex justify-between items-center pt-5 border-t border-gray-100 mt-auto">
      <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-[-4px] transition-transform">
        <FileText size={16} />
        استعراض التقرير
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-2 rounded-xl bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
          <Download size={16} />
        </div>
        <div className="p-2 rounded-xl bg-gray-50 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
          <Printer size={16} />
        </div>
      </div>
    </div>
  </div>
)};


const categoryTranslations: Record<string, string> = {
  customer_payment: 'دفعة من عميل',
  supplier_return: 'مرتجع مورد',
  customer_return: 'مرتجع عميل',
  supplier_payment: 'دفعة لمورد',
};
const translateCategory = (cat: string) => categoryTranslations[cat] || cat;

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
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionsStore();
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
        ...reportData.revenues.map((r: any) => ({ 'النوع': 'إيراد', 'البند': translateCategory(r.name), [valueHeader]: getConvertedValue(r.value) })),
        ...reportData.expenses.map((e: any) => ({ 'النوع': 'مصروف', 'البند': translateCategory(e.name), [valueHeader]: getConvertedValue(e.value) })),
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
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-600"></div>
            <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </span>
              الإيرادات والمبيعات
            </h4>
            <div className="space-y-3 mb-6">
              {reportData.revenues.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <span className="font-medium text-gray-600">{translateCategory(r.name)}</span>
                  <span className="font-bold text-gray-900" dir="ltr">{formatConvertedCurrency(r.value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50/50 rounded-xl border border-green-100 mt-auto">
              <span className="font-black text-green-700">إجمالي الإيرادات</span>
              <span className="font-black text-green-600 text-xl" dir="ltr">{formatConvertedCurrency(reportData.totalRevenue)}</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-red-400 to-rose-600"></div>
            <h4 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <TrendingUp size={16} className="rotate-180" />
              </span>
              المصروفات والمدفوعات
            </h4>
            <div className="space-y-3 mb-6">
              {reportData.expenses.map((e: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <span className="font-medium text-gray-600">{translateCategory(e.name)}</span>
                  <span className="font-bold text-gray-900" dir="ltr">{formatConvertedCurrency(e.value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-xl border border-red-100 mt-auto">
              <span className="font-black text-red-700">إجمالي المصروفات</span>
              <span className="font-black text-red-600 text-xl" dir="ltr">{formatConvertedCurrency(reportData.totalExpense)}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-lg border relative overflow-hidden ${reportData.netIncome >= 0 ? 'bg-gradient-to-r from-success to-emerald-600 border-green-700' : 'bg-gradient-to-r from-danger to-rose-600 border-red-700'}`}>
          <div className="absolute top-0 right-0 w-full h-full bg-black/10"></div>
          <div className="relative z-10 text-white mb-2 md:mb-0">
            <span className="block text-sm font-bold opacity-80 mb-1">النتيجة النهائية للفترة</span>
            <span className="text-2xl font-black">صافي {reportData.netIncome >= 0 ? 'الربح (الدخل)' : 'الخسارة'}</span>
          </div>
          <span className="relative z-10 text-white text-4xl font-black drop-shadow-md" dir="ltr">
            {formatConvertedCurrency(reportData.netIncome)}
          </span>
        </div>
      </div>
    );
  };

  const renderSalesPurchasesTable = (type: string) => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'invoice_number', label: 'رقم الفاتورة', render: (v: string) => <span className="font-bold text-gray-700">#{v}</span> },
      { key: 'date', label: 'التاريخ', render: (v: string) => <span className="text-gray-600">{v}</span> },
      { key: 'party_name', label: type === 'sales' ? 'العميل' : 'المورد', render: (v: string) => <span className="font-bold text-primary">{v}</span> },
      { key: 'payment_method', label: 'طريقة الدفع', render: (v: string) => (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${v === 'cash' ? 'bg-green-100 text-green-700' : v === 'credit' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
            {v === 'cash' ? 'نقداً' : v === 'credit' ? 'آجل' : 'جزئي'}
          </span>
        ) 
      },
      { key: 'total', label: 'الإجمالي', render: (v: number, item: any) => <span className="font-black text-gray-800" dir="ltr">{formatConvertedCurrency(v, item.currency || 'IQD')}</span> },
    ];
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <DataTable columns={cols} data={reportData} />
      </div>
    );
  };

  const renderPurchasePricesTable = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'product_name', label: 'اسم الصنف', render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
      { key: 'supplier_name', label: 'المورد', render: (v: string) => <span className="text-primary font-bold">{v || 'غير محدد'}</span> },
      { key: 'invoice_number', label: 'رقم الفاتورة', render: (v: string) => <span className="text-gray-500">#{v}</span> },
      { key: 'date', label: 'التاريخ', render: (v: string) => <span className="text-gray-600">{v}</span> },
      { key: 'quantity', label: 'الكمية', render: (v: number) => <span className="font-bold text-gray-700">{v}</span> },
      { key: 'purchase_price', label: 'سعر الشراء', render: (v: number, item: any) => <span dir="ltr" className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{formatConvertedCurrency(v, item.currency || 'IQD')}</span> },
    ];
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <DataTable columns={cols} data={reportData} />
      </div>
    );
  };

  const renderInventoryMovement = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'product_code', label: 'كود الصنف', render: (v: string) => <span className="text-gray-500 font-mono text-sm">{v}</span> },
      { key: 'product_name', label: 'اسم الصنف', render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
      { key: 'inward', label: 'وارد', render: (v: number) => <span className="text-success font-black bg-success/10 px-3 py-1 rounded-lg">+{v}</span> },
      { key: 'outward', label: 'منصرف', render: (v: number) => <span className="text-danger font-black bg-danger/10 px-3 py-1 rounded-lg">-{v}</span> },
      { key: 'current_stock', label: 'الرصيد الحالي', render: (v: number) => <span className="font-black text-gray-800 text-lg">{v}</span> },
    ];
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <DataTable columns={cols} data={reportData} />
      </div>
    );
  };

  const renderBalances = () => {
    if (!reportData || !Array.isArray(reportData)) return null;
    const cols = [
      { key: 'name', label: 'اسم العميل / المورد', render: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
      { key: 'phone', label: 'الهاتف', render: (v: string) => <span className="text-gray-600" dir="ltr">{v || '-'}</span> },
      { key: 'current_balance_iqd', label: 'الرصيد (دينار)', render: (v: number) => (
          <span className={`font-black ${v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-gray-500'}`} dir="ltr">
            {formatCurrency(v || 0, 'IQD')}
          </span>
      )},
      { key: 'current_balance_usd', label: 'الرصيد (دولار)', render: (v: number) => (
          <span className={`font-black ${v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-gray-500'}`} dir="ltr">
            {formatCurrency(v || 0, 'USD')}
          </span>
      )},
    ];
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <DataTable columns={cols} data={reportData} />
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600"></div>
            <h4 className="font-black text-gray-800 text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Landmark size={16} />
              </span>
              الأصول (الموجودات)
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                <span className="font-bold text-gray-600">الخزينة النقدية (الصناديق)</span>
                <span className="font-black text-gray-900 text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.treasury)}</span>
              </div>
              <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                <span className="font-bold text-gray-600">قيمة المخزون (بالتكلفة)</span>
                <span className="font-black text-gray-900 text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.inventory)}</span>
              </div>
              <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                <span className="font-bold text-gray-600">أرصدة العملاء (مدينون)</span>
                <span className="font-black text-gray-900 text-lg" dir="ltr">{formatConvertedCurrency(reportData.assets.customers)}</span>
              </div>
              
              <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mt-6 shadow-inner">
                <span className="font-black text-indigo-800 text-lg">إجمالي الأصول</span>
                <span className="font-black text-indigo-700 text-2xl" dir="ltr">{formatConvertedCurrency(reportData.assets.total)}</span>
              </div>
            </div>
          </div>
          
          {/* Liabilities Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-600"></div>
            <h4 className="font-black text-gray-800 text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <Users size={16} />
              </span>
              الخصوم (الالتزامات)
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                <span className="font-bold text-gray-600">أرصدة الموردين (دائنون)</span>
                <span className="font-black text-gray-900 text-lg" dir="ltr">{formatConvertedCurrency(reportData.liabilities.suppliers)}</span>
              </div>
              
              {/* Empty state filler to align with Assets */}
              <div className="p-4 border border-transparent opacity-0 pointer-events-none hidden md:block h-[74px]"></div>
              <div className="p-4 border border-transparent opacity-0 pointer-events-none hidden md:block h-[74px]"></div>
              
              <div className="flex justify-between items-center p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-red-100 mt-6 shadow-inner">
                <span className="font-black text-red-800 text-lg">إجمالي الالتزامات</span>
                <span className="font-black text-red-700 text-2xl" dir="ltr">{formatConvertedCurrency(reportData.liabilities.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Net Worth Banner */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-xl border border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-50"></div>
          <div className="relative z-10 text-center md:text-right mb-4 md:mb-0">
            <span className="block text-gray-400 font-bold mb-1">المركز المالي</span>
            <span className="text-2xl font-black text-white">صافي حقوق الملكية (رأس المال + الأرباح)</span>
          </div>
          <div className="relative z-10 text-center md:text-left">
            <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-green-300 to-emerald-400 drop-shadow-md" dir="ltr">
              {formatConvertedCurrency(reportData.assets.total - reportData.liabilities.total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">التقارير والإحصائيات</h1>
        <p className="text-text-muted text-sm mt-1">لوحة التحكم الشاملة للتقارير التحليلية والمحاسبية لجميع أقسام النظام.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasPermission(user?.role || 'user', 'reports.income') && (
          <ReportCard 
            title="قائمة الدخل" 
            description="تقرير مفصل يوضح الإيرادات والمصروفات وصافي الربح خلال فترة زمنية محددة."
            icon={<TrendingUp />}
            color="bg-success"
            onClick={() => openReport('income')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.sales') && (
          <ReportCard 
            title="تقرير المبيعات" 
            description="تحليل شامل للمبيعات حسب الأصناف، العملاء، والمناديب مع مقارنات بيانية."
            icon={<BarChart3 />}
            color="bg-primary"
            onClick={() => openReport('sales')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.purchases') && (
          <ReportCard 
            title="تقرير المشتريات" 
            description="ملخص للمشتريات من الموردين مع توضيح الدفعات النقدية والآجلة."
            icon={<ArrowLeftRight />}
            color="bg-warning"
            onClick={() => openReport('purchases')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.inventory') && (
          <ReportCard 
            title="حركة المخزون" 
            description="متابعة حركة دخول وخروج الأصناف من المخازن وتحديد الرواكد."
            icon={<PieIcon />}
            color="bg-accent"
            onClick={() => openReport('inventory')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.balances') && (
          <ReportCard 
            title="أرصدة العملاء" 
            description="كشف تفصيلي بأرصدة العملاء والمديونيات المتأخرة وأعمار الديون."
            icon={<Users />}
            color="bg-danger"
            onClick={() => openReport('balances')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.balance_sheet') && (
          <ReportCard 
            title="الميزانية العمومية" 
            description="ملخص للأصول والالتزامات وحقوق الملكية للشركة في لحظة زمنية معينة."
            icon={<Landmark size={28} />}
            color="bg-sidebar-bg"
            onClick={() => openReport('balance_sheet')}
          />
        )}
        {hasPermission(user?.role || 'user', 'reports.purchase_prices') && (
          <ReportCard 
            title="كشف تغير الأسعار" 
            description="مقارنة أسعار شراء الأصناف من موردين مختلفين عبر فترات زمنية لمعرفة تغيرات السعر."
            icon={<ArrowLeftRight />}
            color="bg-warning"
            onClick={() => openReport('purchase_prices')}
          />
        )}
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
                      .replace('{{tax_number_html}}', settings?.tax_number ? `<p style="margin: 5px 0 0; color: #000; font-size: 14px;">الرقم الضريبي: ${settings.tax_number}</p>` : '')
                      .replace('{{logo_img}}', settings?.print_show_logo !== 'false' && settings?.logo ? `<img src="${settings.logo}" style="height: ${settings?.reports_logo_size || 120}px; object-fit: contain;" />` : '')
                      .replace('{{report_title}}', activeReportTitle)
                      .replace('{{date}}', new Date().toLocaleDateString('ar-IQ'))
                      .replace('{{start_date}}', startDate || '-')
                      .replace('{{end_date}}', endDate || '-')
                      .replace('{{footer_text_html}}', settings?.reports_footer_text ? `<div style="margin-top: 16px; text-align: center; font-size: 14px; font-weight: bold; padding: 12px; border: 1px solid #000; color: #000;">${settings.reports_footer_text}</div>` : '');

                    const parts = htmlString.split('{{report_content}}');
                    headerHtml = parts[0] || '';
                    footerHtml = parts[1] || '';
                  }

                  return (
                    <div className={settings?.reports_template_type === 'custom' ? 'print-area-view print:bg-white text-black font-cairo' : ''} dir="rtl">
                      {settings?.reports_template_type === 'custom' ? (
                        <div dangerouslySetInnerHTML={{ __html: headerHtml }} className="hidden print:block" />
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
                        <div dangerouslySetInnerHTML={{ __html: footerHtml }} className="hidden print:block" />
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
