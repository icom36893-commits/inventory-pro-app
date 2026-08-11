import React, { useState } from 'react';
import { useAuthStore, useLicenseStore } from '../store';
import { User, Lock, Phone, Mail, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Setup: React.FC = () => {
 const [formData, setFormData] = useState({
 username: '',
 password: '',
 phone: '',
 email: ''
 });
 const [error, setError] = useState('');
 
 const { updateUser } = useAuthStore();
 const { setSetupComplete, activateSystem } = useLicenseStore();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.username || !formData.password || !formData.phone || !formData.email) {
 setError('يرجى تعبئة جميع الحقول');
 return;
 }
 
 try {
 // Create admin user in database
 if ((window as any).api && (window as any).api.users) {
 try {
 await (window as any).api.users.create({
 full_name: formData.username,
 username: 'admin',
 password: formData.password,
 role: 'admin'
 });
 } catch (createError: any) {
 // If the admin user already exists (e.g. from a previous partial setup), ignore the error
 if (!createError.message?.includes('موجود مسبقاً')) {
 throw createError;
 }
 }
 
 // Update company settings with initial email and phone
 await (window as any).api.settings.update({
 email: formData.email,
 phone: formData.phone
 });
 }
 
 // حفظ المستخدم الجديد كمدير للنظام في الحالة المحلية (Store)
 updateUser({
 name: formData.username,
 role: 'admin',
 email: formData.email,
 phone: formData.phone
 });
 
 // تفعيل النظام كنسخة تجريبية لمدة 2 يوم
 const expiryDate = new Date();
 expiryDate.setDate(expiryDate.getDate() + 2);
 activateSystem('2_days', expiryDate.toISOString());

 // إنهاء عملية الإعداد
 setSetupComplete(true);
 } catch (err) {
 console.error(err);
 setError('حدث خطأ أثناء حفظ بيانات المدير في قاعدة البيانات');
 }
 };

 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
 {/* Background Decorations */}
 <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full animate-pulse"></div>
 <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
 <div className="absolute top-[40%] left-[20%] w-64 h-64 bg-indigo-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

 <div className="max-w-xl w-full bg-white/80 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white relative z-10 animate-in fade-in zoom-in-95 duration-500">
 <div className="p-10 text-center bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden">
 <div className="absolute inset-0 bg-black/10"></div>
 
 <div className="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/20 relative z-10 group">
 <img src={logoImg} alt="المخزن برو" className="w-20 h-20 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
 </div>
 <h1 className="text-3xl font-black mb-3 drop-shadow-lg relative z-10">مرحباً بك في المخزن برو</h1>
 <p className="text-white/80 text-base font-medium relative z-10">قم بإعداد حساب المدير الخاص بك للبدء</p>
 </div>
 
 <div className="p-10">
 {error && (
 <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl text-center border border-red-100 flex items-center gap-3 justify-center shadow-sm">
 <span className="text-lg">⚠️</span>
 {error}
 </div>
 )}
 
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700 mr-2">اسم المدير العام</label>
 <div className="relative group">
 <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
 <User size={18} />
 </div>
 <input 
 type="text" 
 value={formData.username}
 onChange={e => setFormData({...formData, username: e.target.value})}
 className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 font-bold text-gray-800 shadow-sm"
 placeholder="الاسم الكامل"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700 mr-2">كلمة المرور</label>
 <div className="relative group">
 <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
 <Lock size={18} />
 </div>
 <input 
 type="password" 
 value={formData.password}
 onChange={e => setFormData({...formData, password: e.target.value})}
 className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 text-left dir-ltr font-bold text-gray-800 shadow-sm"
 placeholder="••••••••"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700 mr-2">رقم الهاتف</label>
 <div className="relative group">
 <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
 <Phone size={18} />
 </div>
 <input 
 type="text" 
 value={formData.phone}
 onChange={e => setFormData({...formData, phone: e.target.value})}
 className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 text-left dir-ltr font-bold text-gray-800 shadow-sm"
 placeholder="05X XXX XXXX"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700 mr-2">البريد الإلكتروني</label>
 <div className="relative group">
 <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
 <Mail size={18} />
 </div>
 <input 
 type="email" 
 value={formData.email}
 onChange={e => setFormData({...formData, email: e.target.value})}
 className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50/50 text-left dir-ltr font-bold text-gray-800 shadow-sm"
 placeholder="admin@example.com"
 />
 </div>
 </div>
 </div>
 
 <button 
 type="submit"
 className="w-full mt-8 flex items-center justify-center gap-3 py-4 px-4 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all group relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
 <span className="relative z-10">إكمال التثبيت والبدء</span>
 <ArrowRight size={22} className="relative z-10 group-hover:-translate-x-2 transition-transform" />
 </button>
 </form>
 </div>
 </div>
 </div>
 );
};

export default Setup;
