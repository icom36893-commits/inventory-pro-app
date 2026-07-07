import React from 'react';
import { Bell, User, Calendar, Clock, Receipt, ShoppingBag, UserPlus, Truck, Shield, CheckCircle } from 'lucide-react';
import { useSettingsStore, useNotificationStore, useAuthStore, useLicenseStore } from '../../store';
import ActivationModal from '../ui/ActivationModal';

const formatTimeAgo = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'الآن';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'أمس';
  if (diffInDays === 2) return 'أول أمس';
  
  if (diffInDays <= 7) return `منذ ${diffInDays} أيام`;
  
  return date.toLocaleDateString('ar-IQ');
};

interface TopBarProps {
  setActiveTab: (tab: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setActiveTab }) => {
  const [time, setTime] = React.useState(new Date());
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = React.useState(false);
  const { setPendingAction } = useSettingsStore();
  const { isActivated, activationType, expiryDate } = useLicenseStore();

  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();
  const { user } = useAuthStore();

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleDateString('ar-SA', { weekday: 'long' });
    const numericDate = date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    return `${weekday} - ${numericDate}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-IQ', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // دالة لحساب الأيام المتبقية
  const getRemainingDays = () => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = Math.abs(expiry.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <button onClick={() => { setActiveTab('sales'); setPendingAction('open_sales_modal'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors group shadow-sm border border-primary/20" title="إنشاء فاتورة مبيعات">
          <Receipt size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold hidden xl:inline">فاتورة مبيعات</span>
        </button>
        <button onClick={() => { setActiveTab('purchases'); setPendingAction('open_purchase_modal'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-lg hover:bg-[#8b5cf6] hover:text-white transition-colors group shadow-sm border border-[#8b5cf6]/20" title="إنشاء فاتورة مشتريات">
          <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold hidden xl:inline">فاتورة مشتريات</span>
        </button>
        <button onClick={() => { setActiveTab('customers'); setPendingAction('open_customer_modal'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] rounded-lg hover:bg-[#10b981] hover:text-white transition-colors group shadow-sm border border-[#10b981]/20" title="إضافة عميل جديد">
          <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold hidden xl:inline">عميل جديد</span>
        </button>
        <button onClick={() => { setActiveTab('suppliers'); setPendingAction('open_supplier_modal'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg hover:bg-[#f59e0b] hover:text-white transition-colors group shadow-sm border border-[#f59e0b]/20" title="إضافة مورد جديد">
          <Truck size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold hidden xl:inline">مورد جديد</span>
        </button>
      </div>

      <div className="flex items-center space-x-6 space-x-reverse">
        {!isActivated ? (
          <button 
            onClick={() => setIsActivationModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-sm shadow-amber-500/20 border border-amber-400 allow-unactivated animate-pulse"
            title="تفعيل النظام"
          >
            <Shield size={16} />
            <span className="text-xs font-bold">تفعيل النظام</span>
          </button>
        ) : activationType === '14_days' ? (
          <button 
            onClick={() => setIsActivationModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg border border-success/30 hover:bg-success hover:text-white transition-colors cursor-pointer allow-unactivated group"
            title="ترقية التفعيل"
          >
            <CheckCircle size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">
              متبقي {getRemainingDays()} يوم (رصيد تجريبي)
            </span>
          </button>
        ) : null}

        <div className="hidden md:flex flex-col items-end text-xs text-text-muted border-l border-border pl-6">
          <div className="flex items-center">
            <Calendar size={14} className="ml-1" />
            <span>{formatDate(time)}</span>
          </div>
          <div className="flex items-center mt-1">
            <Clock size={14} className="ml-1" />
            <span>{formatTime(time)}</span>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-bg-main allow-unactivated"
          >
            <Bell size={20} className="allow-unactivated" />
            {notifications.some(n => !(n.isRead || n.is_read)) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border-2 border-white allow-unactivated"></span>
            )}
          </button>
          
          {isNotificationsOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50">
              <div className="p-4 border-b border-border flex justify-between items-center bg-bg-main">
                <h3 className="font-bold text-text-primary">الإشعارات</h3>
                <span 
                  className="text-xs text-primary cursor-pointer hover:underline"
                  onClick={markAllAsRead}
                >
                  تحديد الكل كمقروء
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notif => {
                  const isRead = notif.isRead || notif.is_read;
                  const displayTime = notif.created_at ? formatTimeAgo(notif.created_at) : formatTimeAgo(notif.time);
                  return (
                  <div 
                    key={notif.id} 
                    className={`p-4 border-b border-border last:border-0 hover:bg-bg-main/50 transition-colors cursor-pointer ${isRead ? 'opacity-60' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <p className="text-sm text-text-primary font-medium">{notif.text}</p>
                    <span className="text-xs text-text-muted mt-1 block" dir="ltr">{displayTime}</span>
                  </div>
                )})}
              </div>
              <div className="p-3 text-center border-t border-border bg-bg-main">
                <span 
                  className="text-xs text-primary font-bold cursor-pointer hover:underline"
                  onClick={() => { setIsNotificationsOpen(false); setActiveTab('notifications'); }}
                >
                  عرض كل الإشعارات
                </span>
              </div>
            </div>
          )}
        </div>

        <div 
          className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-bg-main p-1 rounded-lg transition-colors allow-unactivated"
          onClick={() => setActiveTab('profile')}
        >
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-white overflow-hidden allow-unactivated">
            {user?.profileImage ? (
              <img src={user?.profileImage} alt="Profile" className="w-full h-full object-cover allow-unactivated" />
            ) : (
              <User size={20} className="allow-unactivated" />
            )}
          </div>
          <div className="flex flex-col allow-unactivated">
            <span className="text-sm font-bold text-text-primary allow-unactivated">{user?.name || 'المدير العام'}</span>
            <span className="text-[10px] text-text-muted allow-unactivated">{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'accountant' ? 'محاسب' : (user?.role === 'seller' || user?.role === 'sales') ? 'بائع' : user?.role}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActivationModal 
        isOpen={isActivationModalOpen} 
        onClose={() => setIsActivationModalOpen(false)} 
      />
    </header>
  );
};

export default TopBar;
