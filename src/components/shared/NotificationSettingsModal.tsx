import React from 'react';
import Modal from './Modal';
import { useNotificationStore } from '../../store';
import { Package, ShoppingCart, Truck, Database, Volume2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    soundEnabled, setSoundEnabled, testSound,
    notifyLowStock, notifyNewSale, notifyNewPurchase, notifyDataBackup,
    updateNotificationSettings 
  } = useNotificationStore();

  const toggleSetting = (key: 'notifyLowStock' | 'notifyNewSale' | 'notifyNewPurchase' | 'notifyDataBackup') => {
    updateNotificationSettings({ [key]: !useNotificationStore.getState()[key] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إعدادات الإشعارات والتنبيهات">
      <div className="space-y-6">
        <p className="text-sm text-text-muted mb-4">تحكم في التنبيهات والإشعارات التي ترغب في استلامها عبر النظام.</p>
        
        <div className="bg-bg-main p-4 rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Volume2 size={20} />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-sm">صوت الإشعارات</h4>
              <p className="text-xs text-text-muted mt-1">تفعيل أو إيقاف نغمة التنبيه عند وصول إشعار جديد</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {soundEnabled && (
              <button onClick={testSound} className="text-xs text-primary hover:underline font-bold">
                تجربة الصوت
              </button>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-text-primary mb-3">أحداث النظام</h3>
          
          <SettingItem 
            icon={<Package size={18} />}
            title="تنبيهات نقص المخزون"
            description="الحصول على تنبيه عندما يصل أي صنف إلى حد النواقص"
            checked={notifyLowStock}
            onChange={() => toggleSetting('notifyLowStock')}
          />
          
          <SettingItem 
            icon={<ShoppingCart size={18} />}
            title="تنبيهات المبيعات الجديدة"
            description="إشعار عند تسجيل أو إنشاء فاتورة مبيعات جديدة"
            checked={notifyNewSale}
            onChange={() => toggleSetting('notifyNewSale')}
          />
          
          <SettingItem 
            icon={<Truck size={18} />}
            title="تنبيهات المشتريات الجديدة"
            description="إشعار عند تسجيل فاتورة مشتريات جديدة في المخزن"
            checked={notifyNewPurchase}
            onChange={() => toggleSetting('notifyNewPurchase')}
          />
          
          <SettingItem 
            icon={<Database size={18} />}
            title="تنبيهات النسخ الاحتياطي"
            description="تلقي إشعار عند نجاح عمليات النسخ الاحتياطي"
            checked={notifyDataBackup}
            onChange={() => toggleSetting('notifyDataBackup')}
          />
        </div>
      </div>
    </Modal>
  );
};

const SettingItem = ({ icon, title, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-3 hover:bg-bg-main rounded-xl border border-transparent hover:border-border transition-colors cursor-pointer" onClick={onChange}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-border text-text-muted flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-text-primary text-sm">{title}</h4>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  </div>
);

export default NotificationSettingsModal;
