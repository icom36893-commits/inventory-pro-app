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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="text-primary" size={28} />
            مركز الإشعارات
          </h1>
          <p className="text-text-muted mt-1 text-sm">إدارة ومتابعة جميع تنبيهات النظام</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings size={18} />
            إعدادات الإشعارات
          </button>
          <button 
            onClick={markAllAsRead}
            className="btn-secondary flex items-center gap-2"
          >
            <CheckSquare size={18} />
            تحديد الكل كمقروء
          </button>
          <button 
            onClick={clearAll}
            className="px-4 py-2 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-colors flex items-center gap-2 font-bold text-sm border border-danger/20"
          >
            <Trash2 size={18} />
            مسح الكل
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="ابحث في الإشعارات..." 
            className="input-field pl-4 pr-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-bg-main p-1 rounded-xl">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setFilter('all')}
          >
            الكل
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'unread' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setFilter('unread')}
          >
            غير مقروء
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'read' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setFilter('read')}
          >
            مقروء
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notif) => {
              const isRead = notif.is_read || notif.isRead;
              const displayTime = notif.created_at ? formatTimeAgo(notif.created_at) : formatTimeAgo(notif.time);
              return (
              <div 
                key={notif.id} 
                className={`p-5 transition-all hover:bg-bg-main/50 flex items-start gap-4 ${isRead ? 'opacity-70 bg-white' : 'bg-primary/5'}`}
              >
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isRead ? 'bg-bg-main text-text-muted' : 'bg-primary text-white shadow-sm'}`}>
                  {isRead ? <CheckCircle size={20} /> : <Bell size={20} />}
                </div>
                
                <div className="flex-grow">
                  <h3 className={`text-base ${isRead ? 'text-text-primary font-medium' : 'text-primary font-bold'}`}>
                    {notif.text}
                  </h3>
                  <div className="flex items-center text-xs text-text-muted mt-2 gap-1.5">
                    <Clock size={14} />
                    <span dir="ltr">{displayTime}</span>
                  </div>
                </div>

                {!isRead && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="text-sm px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                  >
                    تحديد كمقروء
                  </button>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center text-text-muted">
            <Bell size={48} className="mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-text-primary mb-1">لا توجد إشعارات</h3>
            <p>لم يتم العثور على إشعارات تطابق بحثك أو الفلتر المحدد.</p>
          </div>
        )}
      </div>
      <NotificationSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Notifications;
