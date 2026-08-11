import React, { useState, useEffect } from 'react';
import { 
 TrendingUp, 
 TrendingDown, 
 Wallet, 
 Users, 
 ArrowUpRight, 
 ArrowDownRight,
 CheckCircle,
 Clock,
 XCircle,
 Receipt,
 ShoppingBag,
 UserPlus,
 Truck
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell
} from 'recharts';
import { usePermissionsStore, useAuthStore, useSettingsStore } from '../store';

const StatCard = ({ title, valueIQD, valueUSD, subValue, icon, color, trend }: any) => {
 let gradientClass = '';
 let iconBgClass = '';
 let iconColorClass = '';
 
 switch(color) {
 case 'bg-primary':
 gradientClass = 'from-blue-50/50 to-white border-blue-100 hover:border-blue-300';
 iconBgClass = 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_8px_16px_rgba(59,130,246,0.3)]';
 iconColorClass = 'text-white';
 break;
 case 'bg-warning':
 gradientClass = 'from-amber-50/50 to-white border-amber-100 hover:border-amber-300';
 iconBgClass = 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_8px_16px_rgba(245,158,11,0.3)]';
 iconColorClass = 'text-white';
 break;
 case 'bg-success':
 gradientClass = 'from-emerald-50/50 to-white border-emerald-100 hover:border-emerald-300';
 iconBgClass = 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_8px_16px_rgba(16,185,129,0.3)]';
 iconColorClass = 'text-white';
 break;
 case 'bg-danger':
 gradientClass = 'from-rose-50/50 to-white border-rose-100 hover:border-rose-300';
 iconBgClass = 'bg-gradient-to-br from-rose-400 to-red-500 shadow-[0_8px_16px_rgba(244,63,94,0.3)]';
 iconColorClass = 'text-white';
 break;
 default:
 gradientClass = 'from-slate-50/50 to-white border-slate-100 hover:border-slate-300';
 iconBgClass = 'bg-gradient-to-br from-slate-500 to-gray-600 shadow-[0_8px_16px_rgba(100,116,139,0.3)]';
 iconColorClass = 'text-white';
 }

 return (
 <div className={`bg-gradient-to-br p-6 rounded-3xl shadow-sm border ${gradientClass} hover:shadow-xl hover:-translate-y-1 transition-all duration-400 group`}>
 <div className="flex justify-between items-start mb-5">
 <div className={`p-3.5 rounded-2xl ${iconBgClass} ${iconColorClass} transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300`}>
 {icon}
 </div>
 {trend && (
 <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
 {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
 <span className="mr-1">{Math.abs(trend)}%</span>
 </div>
 )}
 </div>
 <h3 className="text-slate-500 text-sm font-semibold mb-1.5">{title}</h3>
 <div className="flex flex-col gap-0.5">
 <span className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(valueIQD || 0, 'IQD')}</span>
 <span className="text-lg font-bold text-slate-500 tracking-tight">{formatCurrency(valueUSD || 0, 'USD')}</span>
 </div>
 {subValue && <p className="text-xs text-slate-400 mt-4 font-medium bg-white/80 inline-block px-3 py-1.5 rounded-xl shadow-sm border border-white/50">{subValue}</p>}
 </div>
)};


const PREMIUM_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981'];

const categoryTranslations: Record<string, string> = {
 customer_payment: 'دفعة من عميل',
 supplier_return: 'مرتجع مورد',
 customer_return: 'مرتجع عميل',
 supplier_payment: 'دفعة لمورد',
};
const translateCategory = (cat: string) => categoryTranslations[cat] || cat;

interface DashboardProps {
 setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
 const [stats, setStats] = useState<any>({ 
 totalSalesIQD: 0, totalSalesUSD: 0, 
 totalPurchasesIQD: 0, totalPurchasesUSD: 0, 
 treasuryBalanceIQD: 0, treasuryBalanceUSD: 0, 
 customerDebtIQD: 0, customerDebtUSD: 0 
 });
 const [charts, setCharts] = useState<any>({ lineChart: [], pieChart: [], latestInvoices: [], latestPurchases: [], latestExpenses: [], lowStock: [] });
 const [isLoading, setIsLoading] = useState(true);
 const { hasPermission, showPermissionAlert } = usePermissionsStore();
 const { setPendingAction } = useSettingsStore();
 const { user } = useAuthStore();
 const role = user?.role || 'user';

 useEffect(() => {
 let isMounted = true;
 let intervalId: any = null;

 const fetchData = async () => {
 try {
 const statsData = await (window as any).api.dashboard.getStats();
 const chartsData = await (window as any).api.dashboard.getCharts();
 if (isMounted) {
 setStats(statsData);
 setCharts(chartsData);
 }
 } catch (error) {
 console.error("Failed to load dashboard data", error);
 } finally {
 if (isMounted) {
 setIsLoading(false);
 }
 }
 };
 
 fetchData();
 intervalId = setInterval(fetchData, 10000); // Auto-update every 10 seconds

 return () => {
 isMounted = false;
 if (intervalId) clearInterval(intervalId);
 };
 }, []);

 if (isLoading) {
 return <div className="p-8 text-center text-text-muted">جاري تحميل البيانات...</div>;
 }

 return (
 <div className="space-y-8 pb-8">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-2xl font-bold text-text-primary mb-2">نظرة عامة</h1>
 <p className="text-text-muted text-sm">مرحباً بك مجدداً، إليك ملخص نشاطك لهذا اليوم.</p>
 </div>
 <div className="flex flex-wrap items-center gap-3 justify-end">
 <button onClick={() => { 
 if (!hasPermission(role, 'sales.create')) { showPermissionAlert(); return; }
 setActiveTab('sales'); setPendingAction('open_sales_modal'); 
 }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-2xl hover:from-blue-500 hover:to-blue-600 hover:text-white transition-all group shadow-sm hover:shadow-blue-500/20 border border-blue-200/50 hover:-translate-y-0.5" title="إنشاء فاتورة مبيعات">
 <Receipt size={18} className="group-hover:scale-110 transition-transform" />
 <span className="text-sm font-bold">فاتورة مبيعات</span>
 </button>
 <button onClick={() => { 
 if (!hasPermission(role, 'purchases.create')) { showPermissionAlert(); return; }
 setActiveTab('purchases'); setPendingAction('open_purchase_modal'); 
 }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 rounded-2xl hover:from-purple-500 hover:to-purple-600 hover:text-white transition-all group shadow-sm hover:shadow-purple-500/20 border border-purple-200/50 hover:-translate-y-0.5" title="إنشاء فاتورة مشتريات">
 <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
 <span className="text-sm font-bold">فاتورة مشتريات</span>
 </button>
 <button onClick={() => { 
 if (!hasPermission(role, 'parties.create')) { showPermissionAlert(); return; }
 setActiveTab('customers'); setPendingAction('open_customer_modal'); 
 }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 rounded-2xl hover:from-emerald-500 hover:to-emerald-600 hover:text-white transition-all group shadow-sm hover:shadow-emerald-500/20 border border-emerald-200/50 hover:-translate-y-0.5" title="إضافة عميل جديد">
 <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
 <span className="text-sm font-bold">عميل جديد</span>
 </button>
 <button onClick={() => { 
 if (!hasPermission(role, 'parties.create')) { showPermissionAlert(); return; }
 setActiveTab('suppliers'); setPendingAction('open_supplier_modal'); 
 }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 rounded-2xl hover:from-amber-500 hover:to-amber-600 hover:text-white transition-all group shadow-sm hover:shadow-amber-500/20 border border-amber-200/50 hover:-translate-y-0.5" title="إضافة مورد جديد">
 <Truck size={18} className="group-hover:scale-110 transition-transform" />
 <span className="text-sm font-bold">مورد جديد</span>
 </button>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {hasPermission(role, 'dashboard.card_sales') && (
 <StatCard 
 title="إجمالي المبيعات" 
 valueIQD={stats.totalSalesIQD} 
 valueUSD={stats.totalSalesUSD}
 icon={<TrendingUp size={24} />} 
 color="bg-primary" 
 subValue="إجمالي المبيعات الكلي"
 />
 )}
 {hasPermission(role, 'dashboard.card_purchases') && (
 <StatCard 
 title="إجمالي المشتريات" 
 valueIQD={stats.totalPurchasesIQD} 
 valueUSD={stats.totalPurchasesUSD}
 icon={<TrendingDown size={24} />} 
 color="bg-warning" 
 subValue="إجمالي المشتريات الكلي"
 />
 )}
 {hasPermission(role, 'dashboard.card_treasury') && (
 <StatCard 
 title="رصيد الخزينة" 
 valueIQD={stats.treasuryBalanceIQD} 
 valueUSD={stats.treasuryBalanceUSD}
 icon={<Wallet size={24} />} 
 color="bg-success" 
 subValue="الرصيد الحالي المتوفر"
 />
 )}
 {hasPermission(role, 'dashboard.card_debts') && (
 <StatCard 
 title="مديونيات العملاء" 
 valueIQD={stats.customerDebtIQD} 
 valueUSD={stats.customerDebtUSD}
 icon={<Users size={24} />} 
 color="bg-danger" 
 subValue="إجمالي المبالغ غير المحصلة"
 />
 )}
 </div>

 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {hasPermission(role, 'dashboard.chart_movement') && (
 <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
 <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
 <h3 className="font-bold text-lg text-slate-800">أخر فواتير المشتريات</h3>
 <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><ShoppingBag size={20} /></div>
 </div>
 <div className="overflow-x-auto flex-1 p-2">
 <table className="w-full text-right border-separate border-spacing-y-2">
 <thead>
 <tr>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">رقم الفاتورة</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">المورد</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الإجمالي</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الحالة</th>
 </tr>
 </thead>
 <tbody>
 {charts.latestPurchases?.length === 0 ? (
 <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">لا توجد فواتير مشتريات</td></tr>
 ) : (
 charts.latestPurchases?.map((inv: any, i: number) => (
 <tr key={i} className="bg-slate-50 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 rounded-2xl group cursor-default">
 <td className="p-4 text-sm font-bold text-slate-700 rounded-r-2xl border border-transparent group-hover:border-slate-100 border-l-0">{inv.invoice_number}</td>
 <td className="p-4 text-sm text-slate-600 border-y border-transparent group-hover:border-slate-100 font-medium">{inv.party_name || 'نقدي'}</td>
 <td className="p-4 text-sm font-bold text-purple-600 border-y border-transparent group-hover:border-slate-100">{formatCurrency(inv.total, inv.currency || 'IQD')}</td>
 <td className="p-4 rounded-l-2xl border border-transparent group-hover:border-slate-100 border-r-0">
 {inv.status === 'confirmed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle size={14} /> مؤكدة</span>}
 {inv.status === 'draft' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold"><Clock size={14} /> مسودة</span>}
 {inv.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"><XCircle size={14} /> ملغية</span>}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {hasPermission(role, 'dashboard.chart_expenses') && (
 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
 <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
 <h3 className="font-bold text-lg text-slate-800">آخر المصروفات</h3>
 <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><Wallet size={20} /></div>
 </div>
 <div className="overflow-x-auto flex-1 p-2">
 <table className="w-full text-right border-separate border-spacing-y-2">
 <thead>
 <tr>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">التاريخ</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الفئة</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">المبلغ</th>
 </tr>
 </thead>
 <tbody>
 {charts.latestExpenses?.length === 0 ? (
 <tr><td colSpan={3} className="p-8 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">لا توجد مصروفات</td></tr>
 ) : (
 charts.latestExpenses?.map((expense: any, i: number) => (
 <tr key={i} className="bg-slate-50 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 rounded-2xl group cursor-default">
 <td className="p-4 text-sm font-bold text-slate-700 rounded-r-2xl border border-transparent group-hover:border-slate-100 border-l-0">{expense.date}</td>
 <td className="p-4 text-sm text-slate-600 border-y border-transparent group-hover:border-slate-100 font-medium">{translateCategory(expense.category)}</td>
 <td className="p-4 text-sm font-bold text-rose-600 rounded-l-2xl border border-transparent group-hover:border-slate-100 border-r-0">{formatCurrency(expense.amount, expense.currency || 'IQD')}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 {/* Tables Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {hasPermission(role, 'dashboard.table_invoices') && (
 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
 <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
 <h3 className="font-bold text-lg text-slate-800">آخر فواتير المبيعات</h3>
 <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><TrendingUp size={20} /></div>
 </div>
 <div className="overflow-x-auto flex-1 p-2">
 <table className="w-full text-right border-separate border-spacing-y-2">
 <thead>
 <tr>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">رقم الفاتورة</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">العميل</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الإجمالي</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الحالة</th>
 </tr>
 </thead>
 <tbody>
 {charts.latestInvoices.length === 0 ? (
 <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">لا توجد فواتير مبيعات</td></tr>
 ) : (
 charts.latestInvoices.map((inv: any, i: number) => (
 <tr key={i} className="bg-slate-50 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 rounded-2xl group cursor-default">
 <td className="p-4 text-sm font-bold text-slate-700 rounded-r-2xl border border-transparent group-hover:border-slate-100 border-l-0">{inv.invoice_number}</td>
 <td className="p-4 text-sm text-slate-600 border-y border-transparent group-hover:border-slate-100 font-medium">{inv.party_name || 'نقدي'}</td>
 <td className="p-4 text-sm font-bold text-indigo-600 border-y border-transparent group-hover:border-slate-100">{formatCurrency(inv.total, inv.currency || 'IQD')}</td>
 <td className="p-4 rounded-l-2xl border border-transparent group-hover:border-slate-100 border-r-0">
 {inv.status === 'confirmed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle size={14} /> مؤكدة</span>}
 {inv.status === 'draft' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold"><Clock size={14} /> مسودة</span>}
 {inv.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"><XCircle size={14} /> ملغية</span>}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {hasPermission(role, 'dashboard.table_low_stock') && (
 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
 <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
 <h3 className="font-bold text-lg text-slate-800">أصناف منخفضة المخزون</h3>
 <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><ArrowDownRight size={20} /></div>
 </div>
 <div className="overflow-x-auto flex-1 p-2">
 <table className="w-full text-right border-separate border-spacing-y-2">
 <thead>
 <tr>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الصنف</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الكمية الحالية</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-400">الحد الأدنى</th>
 </tr>
 </thead>
 <tbody>
 {charts.lowStock.length === 0 ? (
 <tr><td colSpan={3} className="p-8 text-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">لا توجد أصناف منخفضة المخزون</td></tr>
 ) : (
 charts.lowStock.map((prod: any, i: number) => (
 <tr key={i} className="bg-rose-50/30 hover:bg-white hover:shadow-[0_4px_12px_rgba(244,63,94,0.08)] transition-all duration-300 rounded-2xl group cursor-default">
 <td className="p-4 text-sm font-bold text-slate-700 rounded-r-2xl border border-transparent group-hover:border-rose-100 border-l-0">{prod.name}</td>
 <td className="p-4 text-sm border-y border-transparent group-hover:border-rose-100">
 <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold shadow-sm">{prod.current_stock}</span>
 </td>
 <td className="p-4 text-sm font-medium text-slate-500 rounded-l-2xl border border-transparent group-hover:border-rose-100 border-r-0">5</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default Dashboard;
