import React, { useState } from 'react';
import { Search, Bell, CheckCircle, Clock, Trash2, CheckSquare, Settings } from 'lucide-react';
import { useNotificationStore } from '../store';
import NotificationSettingsModal from '../components/shared/NotificationSettingsModal';

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

const Notifications: React.FC = () => {
 const { notifications, markAllAsRead, markAsRead, clearAll } = useNotificationStore();
 const [searchTerm, setSearchTerm] = useState('');
 const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);

 const filteredNotifications = notifications.filter(notif => {
 const isRead = notif.is_read || notif.isRead;
 const matchesSearch = notif.text.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesFilter = 
 filter === 'all' ? true :
 filter === 'unread' ? !isRead :
 isRead;
 return matchesSearch && matchesFilter;
 });

 return (
 <div className="p-6 max-w-6xl mx-auto">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transform rotate-3">
 <Bell size={28} />
 </div>
 <div>
 <h1 className="text-3xl font-black text-gray-800 tracking-tight">مركز الإشعارات</h1>
 <p className="text-gray-500 mt-1 font-medium">إدارة ومتابعة جميع تنبيهات النظام في مكان واحد</p>
 </div>
 </div>
 
 <div className="flex gap-3">
 <button 
 onClick={() => setIsSettingsOpen(true)}
 className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2 font-bold text-sm"
 >
 <Settings size={18} className="text-gray-500" />
 الإعدادات
 </button>
 <button 
 onClick={markAllAsRead}
 className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 font-bold text-sm"
 >
 <CheckSquare size={18} />
 تحديد الكل كمقروء
 </button>
 <button 
 onClick={clearAll}
 className="px-5 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
 >
 <Trash2 size={18} />
 مسح الكل
 </button>
 </div>
 </div>

 <div className="bg-white/80 rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden z-10">
 <div className="relative w-full md:w-96 group">
 <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
 <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
 </div>
 <input 
 type="text" 
 placeholder="ابحث في الإشعارات..." 
 className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 block pr-12 p-3.5 transition-all outline-none font-medium"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>

 <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
 <button 
 className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-primary shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
 onClick={() => setFilter('all')}
 >
 الكل
 </button>
 <button 
 className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === 'unread' ? 'bg-white text-primary shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
 onClick={() => setFilter('unread')}
 >
 غير مقروء
 </button>
 <button 
 className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === 'read' ? 'bg-white text-primary shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
 onClick={() => setFilter('read')}
 >
 مقروء
 </button>
 </div>
 </div>

 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>
 {filteredNotifications.length > 0 ? (
 <div className="divide-y divide-gray-50">
 {filteredNotifications.map((notif) => {
 const isRead = notif.is_read || notif.isRead;
 const displayTime = notif.created_at ? formatTimeAgo(notif.created_at) : formatTimeAgo(notif.time);
 return (
 <div 
 key={notif.id} 
 className={`p-6 transition-all hover:bg-gray-50/80 flex items-start gap-5 relative group ${isRead ? 'opacity-75 bg-white' : 'bg-blue-50/30'}`}
 >
 {!isRead && <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-indigo-500"></div>}
 
 <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isRead ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/20'}`}>
 {isRead ? <CheckCircle size={24} /> : <Bell size={24} />}
 </div>
 
 <div className="flex-grow">
 <h3 className={`text-base ${isRead ? 'text-gray-600 font-medium' : 'text-gray-900 font-black'}`}>
 {notif.text}
 </h3>
 <div className="flex items-center text-xs text-gray-400 mt-2 gap-1.5 font-medium">
 <Clock size={14} />
 <span dir="ltr">{displayTime}</span>
 </div>
 </div>

 {!isRead && (
 <button 
 onClick={() => markAsRead(notif.id)}
 className="text-sm px-4 py-2 text-primary hover:bg-primary/10 rounded-xl transition-colors font-bold border border-transparent hover:border-primary/20 opacity-0 group-hover:opacity-100 focus:opacity-100"
 >
 تحديد كمقروء
 </button>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
 <Bell size={40} className="text-gray-300" />
 </div>
 <h3 className="text-xl font-black text-gray-700 mb-2">لا توجد إشعارات</h3>
 <p className="font-medium text-gray-500 max-w-sm">لم يتم العثور على إشعارات تطابق بحثك أو الفلتر المحدد حالياً.</p>
 </div>
 )}
 </div>
 <NotificationSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
 </div>
 );
};

export default Notifications;
