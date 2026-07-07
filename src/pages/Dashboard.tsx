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
  XCircle
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
import { usePermissionsStore, useAuthStore } from '../store';

const StatCard = ({ title, valueIQD, valueUSD, subValue, icon, color, trend }: any) => {
  const textColor = color.replace('bg-', 'text-');
  const bgColor = color === 'bg-primary' ? 'bg-primary/10' : 
                  color === 'bg-warning' ? 'bg-warning/10' : 
                  color === 'bg-success' ? 'bg-success/10' : 
                  color === 'bg-danger' ? 'bg-danger/10' : 'bg-gray-100';
  
  return (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgColor} ${textColor}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span className="mr-1">{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-text-muted text-sm font-medium mb-2">{title}</h3>
    <div className="flex flex-col gap-1">
      <span className="text-lg font-bold text-text-primary">{formatCurrency(valueIQD || 0, 'IQD')}</span>
      <span className="text-lg font-bold text-text-primary">{formatCurrency(valueUSD || 0, 'USD')}</span>
    </div>
    {subValue && <p className="text-[10px] text-text-muted mt-2">{subValue}</p>}
  </div>
)};

const COLORS = ['#1565C0', '#1E88E5', '#42A5F5', '#90CAF9', '#D97706', '#E53E3E'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({ 
    totalSalesIQD: 0, totalSalesUSD: 0, 
    totalPurchasesIQD: 0, totalPurchasesUSD: 0, 
    treasuryBalanceIQD: 0, treasuryBalanceUSD: 0, 
    customerDebtIQD: 0, customerDebtUSD: 0 
  });
  const [charts, setCharts] = useState({ lineChart: [], pieChart: [], latestInvoices: [], lowStock: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissionsStore();
  const { user } = useAuthStore();
  const role = user?.role || 'user';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await (window as any).api.dashboard.getStats();
        const chartsData = await (window as any).api.dashboard.getCharts();
        setStats(statsData);
        setCharts(chartsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">نظرة عامة</h1>
        <p className="text-text-muted text-sm">مرحباً بك مجدداً، إليك ملخص نشاطك لهذا اليوم.</p>
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
            subValue="إجمالي مبيعات الشهر"
          />
        )}
        {hasPermission(role, 'dashboard.card_purchases') && (
          <StatCard 
            title="إجمالي المشتريات" 
            valueIQD={stats.totalPurchasesIQD} 
            valueUSD={stats.totalPurchasesUSD}
            icon={<TrendingDown size={24} />} 
            color="bg-warning" 
            subValue="إجمالي مشتريات الشهر"
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
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-text-primary">حركة المبيعات والمشتريات (آخر 7 أيام)</h3>
            </div>
            <div className="h-80">
              {charts.lineChart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted">لا توجد بيانات كافية للرسم البياني</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.lineChart}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1565C0" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#1565C0" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="purchases" name="المشتريات" stroke="#D97706" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {hasPermission(role, 'dashboard.chart_expenses') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h3 className="font-bold text-text-primary mb-6">توزيع المصروفات</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pieChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.pieChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 max-h-32 overflow-y-auto">
              {charts.pieChart.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-text-muted">{item.name}</span>
                  </div>
                  {item.name !== 'لا توجد بيانات' && (
                    <span className="font-bold text-text-primary">{formatCurrency(item.value, 'IQD')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasPermission(role, 'dashboard.table_invoices') && (
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-text-primary">آخر فواتير المبيعات</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-bg-main">
                  <tr>
                    <th className="p-4 text-xs font-bold text-text-muted">رقم الفاتورة</th>
                    <th className="p-4 text-xs font-bold text-text-muted">العميل</th>
                    <th className="p-4 text-xs font-bold text-text-muted">الإجمالي</th>
                    <th className="p-4 text-xs font-bold text-text-muted">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {charts.latestInvoices.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-text-muted">لا توجد فواتير مبيعات</td></tr>
                  ) : (
                    charts.latestInvoices.map((inv: any, i: number) => (
                      <tr key={i} className="hover:bg-bg-main transition-colors">
                        <td className="p-4 text-sm font-medium">{inv.invoice_number}</td>
                        <td className="p-4 text-sm">{inv.party_name || 'نقدي'}</td>
                        <td className="p-4 text-sm font-bold">{formatCurrency(inv.total, inv.currency || 'IQD')}</td>
                        <td className="p-4">
                          {inv.status === 'confirmed' && <CheckCircle size={20} className="text-success inline-block" />}
                          {inv.status === 'draft' && <Clock size={20} className="text-warning inline-block" />}
                          {inv.status === 'cancelled' && <XCircle size={20} className="text-danger inline-block" />}
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
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-text-primary">أصناف منخفضة المخزون</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-bg-main">
                  <tr>
                    <th className="p-4 text-xs font-bold text-text-muted">الصنف</th>
                    <th className="p-4 text-xs font-bold text-text-muted">الكمية الحالية</th>
                    <th className="p-4 text-xs font-bold text-text-muted">الحد الأدنى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {charts.lowStock.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-sm text-text-muted">لا توجد أصناف منخفضة المخزون</td></tr>
                  ) : (
                    charts.lowStock.map((prod: any, i: number) => (
                      <tr key={i} className="hover:bg-bg-main transition-colors">
                        <td className="p-4 text-sm font-medium">{prod.name}</td>
                        <td className="p-4 text-sm text-danger font-bold">{prod.current_stock}</td>
                        <td className="p-4 text-sm">5</td>
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
