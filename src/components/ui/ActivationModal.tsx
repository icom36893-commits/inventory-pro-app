import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { Shield, Key, CheckCircle, AlertCircle, Loader2, MessageCircle, Sparkles, Crown } from 'lucide-react';
import { activateSystemWithFirebase } from '../../utils/firebase-activation';
import { useLicenseStore, useAuthStore } from '../../store';

// Helper to get or generate HWID
const getHWID = () => {
 let hwid = localStorage.getItem('system_hwid');
 if (!hwid) {
 hwid = 'HWID-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
 localStorage.setItem('system_hwid', hwid);
 }
 return hwid;
};

// Helper to get PC Name
const getPCName = (username?: string) => {
 let pcName = localStorage.getItem('system_pc_name');
 if (!pcName) {
 pcName = username ? `PC-${username.toUpperCase()}` : `PC-USER-${Math.floor(Math.random() * 1000)}`;
 localStorage.setItem('system_pc_name', pcName);
 }
 return pcName;
};

interface ActivationModalProps {
 isOpen: boolean;
 onClose: () => void;
}

const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose }) => {
 const [serialKey, setSerialKey] = useState('');
 const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
 const [message, setMessage] = useState('');
 
 const { activateSystem } = useLicenseStore();
 const { user } = useAuthStore();

 const handleActivate = async () => {
 if (!serialKey.trim()) {
 setStatus('error');
 setMessage('يرجى إدخال مفتاح التفعيل أولاً');
 return;
 }

 setStatus('loading');
 setMessage('جاري التحقق من التفعيل عبر السحابة...');

 try {
 const hwid = getHWID();
 const pcName = getPCName(user?.username);
 
 const result = await activateSystemWithFirebase(serialKey, pcName, hwid);
 
 if (result.success && result.activationType && result.expiryDate) {
 setStatus('success');
 setMessage(result.message || 'تم تفعيل النظام بنجاح!');
 
 // حفظ حالة التفعيل في النظام
 activateSystem(result.activationType, result.expiryDate);

 setTimeout(() => {
 onClose();
 setStatus('idle');
 setMessage('');
 setSerialKey('');
 }, 2000);
 } else {
 setStatus('error');
 setMessage(result.message || 'فشل التفعيل');
 }
 } catch (error) {
 setStatus('error');
 setMessage('حدث خطأ أثناء الاتصال بخادم التراخيص السحابي');
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="تفعيل النظام" size="md">
 <div className="-m-6 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white rounded-b-2xl">
 {/* Background Effects */}
 <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-amber-500/10 rounded-full "></div>
 <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-yellow-500/10 rounded-full "></div>
 
 <div className="flex flex-col items-center text-center p-10 relative z-10">
 
 {/* Header Icon */}
 <div className="relative group mb-6">
 <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
 <div className="w-24 h-24 bg-white/80 text-amber-500 rounded-3xl flex items-center justify-center shadow-xl border border-white relative z-10 group-hover:scale-110 transition-transform duration-500">
 <Crown size={48} className="drop-shadow-md" />
 </div>
 <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-1.5 rounded-full shadow-lg z-20 animate-bounce">
 <Sparkles size={16} />
 </div>
 </div>
 
 <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 drop-shadow-sm tracking-wide mb-2">
 قم بترقية نظامك الآن
 </h3>
 <p className="text-gray-500 mb-8 text-sm max-w-sm mx-auto font-medium leading-relaxed">
 أدخل مفتاح التفعيل الخاص بك للوصول إلى كافة الميزات المتقدمة والاحترافية للنظام.
 </p>
 
 <div className="w-full max-w-sm mb-6 relative">
 <div className="relative group">
 <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none z-10">
 <Key size={24} className={`transition-colors duration-300 ${status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-500' : 'text-amber-500 group-focus-within:text-amber-600'}`} />
 </div>
 <input 
 type="text" 
 value={serialKey}
 onChange={(e) => {
 setSerialKey(e.target.value.toUpperCase());
 setStatus('idle');
 setMessage('');
 }}
 placeholder="PRO-2026-XXXXXXX"
 className={`w-full pl-4 pr-12 py-4 rounded-2xl focus:outline-none transition-all font-mono text-center text-xl tracking-widest font-bold shadow-sm relative z-0 bg-white/60 border-2 ${
 status === 'error' ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 text-red-700 placeholder:text-red-300' :
 status === 'success' ? 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 text-green-700' :
 'border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-gray-800 placeholder:text-gray-300'
 }`}
 dir="ltr"
 />
 </div>
 
 {status !== 'idle' && (
 <div className={`mt-4 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 border ${
 status === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 
 status === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 
 'bg-blue-50 border-blue-100 text-blue-700'
 }`}>
 {status === 'success' ? <CheckCircle size={18} /> : 
 status === 'error' ? <AlertCircle size={18} /> : 
 <Loader2 size={18} className="animate-spin" />}
 <span>{message}</span>
 </div>
 )}
 </div>
 
 <div className="flex gap-3 w-full max-w-sm mt-4">
 <button 
 onClick={onClose}
 disabled={status === 'loading'}
 className="flex-1 py-4 px-4 bg-white text-gray-700 font-black rounded-2xl hover:bg-gray-50 transition-all border border-gray-200 shadow-sm disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
 >
 إلغاء
 </button>
 <button 
 onClick={handleActivate}
 disabled={status === 'loading'}
 className="flex-[2] py-4 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 flex justify-center items-center gap-2 disabled:opacity-70 hover:-translate-y-0.5"
 >
 {status === 'loading' ? 'جاري التحقق...' : 'تفعيل النظام الآن'}
 </button>
 </div>

 <div className="w-full max-w-sm mt-6 pt-6 border-t border-gray-100">
 <button 
 onClick={() => window.open('https://wa.me/9647844112111?text=مرحباً، أود طلب اشتراك في نظام المخزن برو', '_blank')}
 className="w-full py-4 px-4 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#20bd5a] hover:to-[#178f44] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 flex justify-center items-center gap-3 hover:-translate-y-0.5 group"
 >
 <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
 <span>طلب مفتاح تفعيل عبر واتساب</span>
 </button>
 </div>
 </div>
 </div>
 </Modal>
 );
};

export default ActivationModal;
