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
 <div className="p-6 space-y-8">
 <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
 
 <div className="flex items-center justify-between relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-white shadow-md text-blue-600 flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6">
 <Volume2 size={28} />
 </div>
 <div>
 <h4 className="font-black text-gray-800 text-lg">صوت الإشعارات</h4>
 <p className="text-sm text-gray-500 mt-1 font-medium">تفعيل أو إيقاف نغمة التنبيه عند وصول إشعار جديد</p>
 </div>
 </div>
 <div className="flex flex-col items-end gap-3">
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
 <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-500 shadow-inner"></div>
 </label>
 {soundEnabled && (
 <button onClick={testSound} className="text-xs bg-white px-3 py-1.5 rounded-lg text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-50 font-bold transition-all">
 تجربة الصوت
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="font-black text-gray-800 text-lg flex items-center gap-2 mb-4">
 <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
 أحداث النظام
 </h3>
 
 <div className="grid gap-3">
 <SettingItem 
 icon={<Package size={20} />}
 title="تنبيهات نقص المخزون"
 description="الحصول على تنبيه عندما يصل أي صنف إلى حد النواقص"
 checked={notifyLowStock}
 onChange={() => toggleSetting('notifyLowStock')}
 color="amber"
 />
 
 <SettingItem 
 icon={<ShoppingCart size={20} />}
 title="تنبيهات المبيعات الجديدة"
 description="إشعار عند تسجيل أو إنشاء فاتورة مبيعات جديدة"
 checked={notifyNewSale}
 onChange={() => toggleSetting('notifyNewSale')}
 color="green"
 />
 
 <SettingItem 
 icon={<Truck size={20} />}
 title="تنبيهات المشتريات الجديدة"
 description="إشعار عند تسجيل فاتورة مشتريات جديدة في المخزن"
 checked={notifyNewPurchase}
 onChange={() => toggleSetting('notifyNewPurchase')}
 color="blue"
 />
 
 <SettingItem 
 icon={<Database size={20} />}
 title="تنبيهات النسخ الاحتياطي"
 description="تلقي إشعار عند نجاح عمليات النسخ الاحتياطي"
 checked={notifyDataBackup}
 onChange={() => toggleSetting('notifyDataBackup')}
 color="purple"
 />
 </div>
 </div>
 
 <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
 <button onClick={onClose} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors font-bold">
 إغلاق
 </button>
 </div>
 </div>
 </Modal>
 );
};

const colorStyles = {
 amber: 'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-100',
 green: 'text-green-600 bg-green-50 border-green-100 group-hover:bg-green-100',
 blue: 'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-100',
 purple: 'text-purple-600 bg-purple-50 border-purple-100 group-hover:bg-purple-100',
};

const bgStyles = {
 amber: 'peer-checked:from-amber-400 peer-checked:to-orange-500',
 green: 'peer-checked:from-green-400 peer-checked:to-emerald-500',
 blue: 'peer-checked:from-blue-400 peer-checked:to-indigo-500',
 purple: 'peer-checked:from-purple-400 peer-checked:to-fuchsia-500',
};

const SettingItem = ({ icon, title, description, checked, onChange, color = 'blue' }: any) => (
 <div className="group flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onChange}>
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${colorStyles[color as keyof typeof colorStyles]}`}>
 {icon}
 </div>
 <div>
 <h4 className="font-bold text-gray-800 text-base">{title}</h4>
 <p className="text-sm text-gray-500 mt-0.5 font-medium">{description}</p>
 </div>
 </div>
 <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
 <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
 <div className={`w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all bg-gradient-to-r peer-checked:bg-gradient-to-r ${bgStyles[color as keyof typeof bgStyles]} shadow-inner`}></div>
 </label>
 </div>
);

export default NotificationSettingsModal;
