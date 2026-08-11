import React from 'react';
import { Bell, User, Calendar, Clock, Receipt, ShoppingBag, UserPlus, Truck, Shield, CheckCircle, Sun, Moon, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSettingsStore, useNotificationStore, useAuthStore, useLicenseStore } from '../../store';
import { usePermissionsStore } from '../../store/permissions';
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
 const { isActivated, activationType, expiryDate } = useLicenseStore();

 const { notifications, markAllAsRead, markAsRead, soundEnabled, setSoundEnabled } = useNotificationStore();
 const { user } = useAuthStore();
 const { hasPermission, showPermissionAlert } = usePermissionsStore();

 const { settings, updateSettings, setPendingAction } = useSettingsStore();
 const [isDarkMode, setIsDarkMode] = React.useState(false);

 React.useEffect(() => {
 const isDark = settings?.theme === 'dark' || (!settings?.theme && (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)));
 setIsDarkMode(isDark);
 if (isDark) {
 document.documentElement.setAttribute('data-theme', 'dark');
 } else {
 document.documentElement.removeAttribute('data-theme');
 }
 }, [settings?.theme]);

 const toggleDarkMode = async () => {
 const newTheme = isDarkMode ? 'light' : 'dark';
 setIsDarkMode(!isDarkMode);
 
 if (newTheme === 'dark') {
 document.documentElement.setAttribute('data-theme', 'dark');
 } else {
 document.documentElement.removeAttribute('data-theme');
 }
 localStorage.setItem('theme', newTheme);
 
 if (settings && Object.keys(settings).length > 0) {
 await updateSettings({ ...settings, theme: newTheme });
 }
 };

 React.useEffect(() => {
 const timer = setInterval(() => setTime(new Date()), 1000);
 return () => clearInterval(timer);
 }, []);

 const notificationsRef = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
 setIsNotificationsOpen(false);
 }
 };
 
 if (isNotificationsOpen) {
 document.addEventListener('mousedown', handleClickOutside);
 }
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }, [isNotificationsOpen]);

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
 <>
 <header className="h-20 bg-white/70 border-b border-gray-100/50 flex items-center justify-end px-6 sticky top-0 z-40 shadow-sm transition-all">

 <div className="flex items-center space-x-5 space-x-reverse">
 {!isActivated ? (
 <button 
 onClick={() => setIsActivationModalOpen(true)}
 className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-2xl hover:from-rose-600 hover:to-red-700 transition-all shadow-md shadow-red-500/20 border border-red-400 allow-unactivated animate-pulse hover:-translate-y-0.5"
 title="تفعيل النظام"
 >
 <Shield size={18} />
 <span className="text-sm font-bold">تفعيل النظام</span>
 </button>
 ) : activationType === '2_days' || activationType === '14_days' ? (
 <button 
 onClick={() => setIsActivationModalOpen(true)}
 className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-2xl border border-emerald-200 hover:from-emerald-500 hover:to-green-500 hover:text-white transition-all shadow-sm hover:shadow-emerald-500/20 cursor-pointer allow-unactivated group hover:-translate-y-0.5"
 title="ترقية التفعيل"
 >
 <CheckCircle size={18} className="group-hover:scale-110 transition-transform text-emerald-500 group-hover:text-white" />
 <span className="text-sm font-bold">
 متبقي {getRemainingDays()} يوم (رصيد تجريبي)
 </span>
 </button>
 ) : null}

 <div className="hidden lg:flex items-center gap-4 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 shadow-inner text-sm text-gray-600">
 <div className="flex items-center gap-2 font-medium">
 <Calendar size={16} className="text-indigo-500" />
 <span>{formatDate(time)}</span>
 </div>
 <div className="w-px h-4 bg-gray-300"></div>
 <div className="flex items-center gap-2 font-bold text-gray-800" dir="ltr">
 <Clock size={16} className="text-blue-500" />
 <span>{formatTime(time)}</span>
 </div>
 </div>

 <button 
 onClick={toggleDarkMode}
 className="p-2.5 text-gray-500 hover:text-indigo-600 transition-all rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 hover:shadow-sm"
 title="تغيير المظهر"
 >
 {isDarkMode ? <Sun size={22} className="animate-spin-slow" /> : <Moon size={22} className="hover:-rotate-12 transition-transform" />}
 </button>

 <div className="relative" ref={notificationsRef}>
 <button 
 onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
 className="relative p-2.5 text-gray-500 hover:text-primary transition-all rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 hover:shadow-sm allow-unactivated group"
 >
 <Bell size={22} className="allow-unactivated" />
 {notifications.some(n => !(n.isRead || n.is_read)) && (
 <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white allow-unactivated shadow-sm animate-pulse"></span>
 )}
 </button>
 
 {isNotificationsOpen && (
 <div className="absolute top-full left-0 mt-3 w-80 bg-white/95 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 transform origin-top-left animate-in fade-in zoom-in-95">
 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-gray-800 text-lg">الإشعارات</h3>
 <button 
 onClick={() => setSoundEnabled(!soundEnabled)}
 className="p-1.5 text-gray-500 hover:text-primary transition-colors rounded-lg hover:bg-white border border-transparent hover:border-gray-200 shadow-sm"
 title={soundEnabled ? "إيقاف صوت الإشعارات" : "تشغيل صوت الإشعارات"}
 >
 {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
 </button>
 </div>
 <span 
 className="text-xs text-primary font-bold cursor-pointer hover:underline bg-primary/5 px-2 py-1 rounded-lg"
 onClick={markAllAsRead}
 >
 تحديد الكل كمقروء
 </span>
 </div>
 <div className="max-h-80 overflow-y-auto custom-scrollbar">
 {notifications.map(notif => {
 const isRead = notif.isRead || notif.is_read;
 const displayTime = notif.created_at ? formatTimeAgo(notif.created_at) : formatTimeAgo(notif.time);
 return (
 <div 
 key={notif.id} 
 className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group ${isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
 onClick={() => markAsRead(notif.id)}
 >
 <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-800 font-bold'} group-hover:text-primary transition-colors`}>{notif.text}</p>
 <span className="text-xs text-gray-400 mt-1.5 block font-medium" dir="ltr">{displayTime}</span>
 </div>
 )})}
 </div>
 <div className="p-3 text-center border-t border-gray-100 bg-gray-50/50">
 <span 
 className="text-sm text-primary font-black cursor-pointer hover:underline block"
 onClick={() => { setIsNotificationsOpen(false); setActiveTab('notifications'); }}
 >
 عرض كل الإشعارات
 </span>
 </div>
 </div>
 )}
 </div>

 <div 
 className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-3 rounded-2xl transition-all border border-transparent hover:border-gray-100 hover:shadow-sm allow-unactivated group"
 onClick={() => setActiveTab('profile')}
 >
 <div className="flex flex-col items-end allow-unactivated">
 <span className="text-sm font-black text-gray-800 allow-unactivated group-hover:text-primary transition-colors">{user?.name || 'المدير العام'}</span>
 <span className="text-[11px] font-bold text-gray-500 allow-unactivated">{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'accountant' ? 'محاسب' : (user?.role === 'seller' || user?.role === 'sales') ? 'بائع' : user?.role}</span>
 </div>
 <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all overflow-hidden allow-unactivated border-2 border-white">
 {user?.profileImage ? (
 <img src={user?.profileImage} alt="Profile" className="w-full h-full object-cover allow-unactivated" />
 ) : (
 <User size={22} className="allow-unactivated" />
 )}
 </div>
 </div>
 </div>

 </header>

 {/* Modals */}
 <ActivationModal 
 isOpen={isActivationModalOpen} 
 onClose={() => setIsActivationModalOpen(false)} 
 />
 </>
 );
};

export default TopBar;
