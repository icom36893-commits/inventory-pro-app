import React, { useState, useRef } from 'react';
import { User, Mail, Lock, Shield, Camera, Save } from 'lucide-react';
import { useAuthStore } from '../store';
import Modal from '../components/shared/Modal';
import { useToast } from '../context/ToastContext';

const Profile: React.FC = () => {
 const { user, updateUser } = useAuthStore();
 const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState({
 name: user?.name || 'المدير العام',
 email: user?.email || 'admin@system.com',
 phone: user?.phone || '0500000000',
 role: user?.role || 'admin'
 });
 
 const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const toast = useToast();

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setProfileImage(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSave = async () => {
 setIsEditing(false);
 const updatedUser = { ...formData, profileImage };
 updateUser(updatedUser);
 try {
 const idToUpdate = user?.id || 1;
 const usernameToUpdate = user?.username || 'admin';
 await (window as any).api.users.update({ id: idToUpdate, username: usernameToUpdate, ...updatedUser });
 } catch (error) {
 console.error('Failed to update user in DB', error);
 }
 };

 const handlePasswordChange = async () => {
 if (newPassword !== confirmPassword) {
 return toast.error('كلمة المرور غير متطابقة');
 }
 if (newPassword.length < 6) {
 return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
 }
 
 try {
 const idToUpdate = user?.id || 1;
 const usernameToUpdate = user?.username || 'admin';
 await (window as any).api.users.update({
 id: idToUpdate,
 username: usernameToUpdate,
 name: formData.name,
 role: formData.role,
 password: newPassword,
 profileImage: profileImage
 });
 toast.success('تم تغيير كلمة المرور بنجاح');
 setIsPasswordModalOpen(false);
 setNewPassword('');
 setConfirmPassword('');
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء تغيير كلمة المرور');
 }
 };

 return (
 <div className="p-6 max-w-6xl mx-auto">
 <div className="flex items-center gap-4 mb-10">
 <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transform rotate-3">
 <User size={32} />
 </div>
 <div>
 <h1 className="text-3xl font-black text-gray-800 tracking-tight">الملف الشخصي</h1>
 <p className="text-gray-500 mt-1 font-medium text-lg">إدارة معلومات حسابك وإعدادات الأمان الخاصة بك</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Profile Card */}
 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center lg:col-span-1 relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 to-indigo-100/50"></div>
 
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleImageChange} 
 accept="image/*" 
 className="hidden" 
 />
 <div 
 className="relative mb-6 cursor-pointer mt-4 z-10"
 onClick={() => fileInputRef.current?.click()}
 >
 <div className="w-40 h-40 rounded-full bg-white p-2 shadow-xl shadow-primary/10 relative">
 <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-light to-indigo-500 flex items-center justify-center text-white text-6xl overflow-hidden">
 {profileImage ? (
 <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <User size={80} className="opacity-80" />
 )}
 </div>
 <div className="absolute inset-2 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 ">
 <Camera className="text-white transform scale-90 hover:scale-110 transition-transform" size={36} />
 </div>
 </div>
 <div className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 text-primary pointer-events-none group-hover:scale-110 transition-transform">
 <Camera size={20} />
 </div>
 </div>
 
 <h2 className="text-2xl font-black text-gray-800 mb-2">{formData.name}</h2>
 
 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-indigo-500/10 text-primary rounded-full mb-6 font-bold text-sm border border-primary/20">
 <Shield size={16} />
 {formData.role === 'admin' ? 'مدير النظام' : formData.role === 'accountant' ? 'محاسب' : (formData.role === 'seller' || formData.role === 'sales') ? 'بائع' : formData.role}
 </div>
 
 <div className="w-full mt-auto bg-gray-50/80 rounded-2xl p-5 space-y-4 text-sm text-right border border-gray-100 shadow-inner">
 <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
 <span className="text-gray-500 font-medium">آخر تسجيل دخول</span>
 <span className="font-bold text-gray-800">اليوم، 08:30 ص</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-500 font-medium">حالة الحساب</span>
 <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-sm flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
 نشط
 </span>
 </div>
 </div>
 </div>

 {/* Profile Details */}
 <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:col-span-2">
 <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
 <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
 <div className="w-2 h-6 bg-gradient-to-b from-primary to-indigo-600 rounded-full"></div>
 المعلومات الشخصية
 </h3>
 <button 
 onClick={() => isEditing ? handleSave() : setIsEditing(true)}
 className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
 isEditing 
 ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5' 
 : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md'
 }`}
 >
 {isEditing ? (
 <>
 <Save size={18} />
 حفظ التغييرات
 </>
 ) : (
 'تعديل البيانات'
 )}
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">الاسم الكامل</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-colors">
 <User size={16} />
 </div>
 <input 
 type="text" 
 value={formData.name}
 onChange={(e) => setFormData({...formData, name: e.target.value})}
 disabled={!isEditing}
 className={`w-full pl-4 pr-14 py-4 rounded-2xl border ${isEditing ? 'border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 bg-white shadow-sm' : 'border-transparent bg-gray-50 text-gray-500'} outline-none transition-all font-bold text-lg`}
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">البريد الإلكتروني</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-colors">
 <Mail size={16} />
 </div>
 <input 
 type="email" 
 value={formData.email}
 onChange={(e) => setFormData({...formData, email: e.target.value})}
 disabled={!isEditing}
 className={`w-full pl-4 pr-14 py-4 rounded-2xl border ${isEditing ? 'border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 bg-white shadow-sm' : 'border-transparent bg-gray-50 text-gray-500'} outline-none transition-all font-bold text-lg`}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">رقم الجوال</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-colors">
 <span className="text-sm leading-none">📱</span>
 </div>
 <input 
 type="tel" 
 value={formData.phone}
 onChange={(e) => setFormData({...formData, phone: e.target.value})}
 disabled={!isEditing}
 className={`w-full pl-4 pr-14 py-4 rounded-2xl border ${isEditing ? 'border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 bg-white shadow-sm' : 'border-transparent bg-gray-50 text-gray-500'} outline-none transition-all font-bold text-lg text-left dir-ltr`}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">الدور (الصلاحية)</label>
 <div className="relative">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200/50 rounded-lg flex items-center justify-center text-gray-400">
 <Shield size={16} />
 </div>
 <input 
 type="text" 
 value={formData.role === 'admin' ? 'مدير النظام' : formData.role === 'accountant' ? 'محاسب' : (formData.role === 'seller' || formData.role === 'sales') ? 'بائع' : formData.role}
 disabled
 className="w-full pl-4 pr-14 py-4 rounded-2xl border border-transparent bg-gray-100/80 text-gray-500 font-bold text-lg outline-none cursor-not-allowed opacity-80"
 />
 </div>
 </div>
 </div>

 <div className="mt-12 pt-8 border-t border-gray-100">
 <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
 <Lock size={20} />
 </div>
 إعدادات الأمان
 </h3>
 
 <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 border border-orange-100 rounded-3xl bg-gradient-to-r from-orange-50/50 to-white shadow-sm">
 <div>
 <p className="font-black text-gray-800 text-lg">كلمة المرور الخاصة بك</p>
 <p className="text-sm text-gray-500 mt-1 font-medium">يُنصح بتغيير كلمة المرور بشكل دوري لحماية حسابك من الاختراق</p>
 </div>
 <button 
 onClick={() => setIsPasswordModalOpen(true)}
 className="px-6 py-3 bg-white border-2 border-orange-200 rounded-2xl text-sm font-bold text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm whitespace-nowrap flex items-center gap-2"
 >
 <Lock size={16} />
 تغيير كلمة المرور
 </button>
 </div>
 </div>
 </div>
 </div>

 {isPasswordModalOpen && (
 <Modal 
 isOpen={true} 
 onClose={() => setIsPasswordModalOpen(false)} 
 title="تغيير كلمة المرور"
 >
 <div className="p-6 space-y-6">
 <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 text-orange-800 border border-orange-100 mb-2">
 <Shield className="flex-shrink-0" size={24} />
 <p className="text-sm font-medium leading-relaxed">يرجى اختيار كلمة مرور قوية تحتوي على أحرف وأرقام لضمان حماية أفضل لحسابك.</p>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">كلمة المرور الجديدة</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
 <Lock size={20} />
 </div>
 <input 
 type="password" 
 value={newPassword}
 placeholder="••••••••"
 onChange={(e) => setNewPassword(e.target.value)}
 className="w-full pl-4 pr-12 py-4 rounded-2xl border border-gray-200 outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-left dir-ltr font-bold text-lg shadow-sm"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">تأكيد كلمة المرور</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
 <Lock size={20} />
 </div>
 <input 
 type="password" 
 value={confirmPassword}
 placeholder="••••••••"
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="w-full pl-4 pr-12 py-4 rounded-2xl border border-gray-200 outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-left dir-ltr font-bold text-lg shadow-sm"
 />
 </div>
 </div>
 
 <div className="flex gap-4 pt-8 mt-2 border-t border-gray-100">
 <button 
 onClick={() => setIsPasswordModalOpen(false)}
 className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
 >
 إلغاء الأمر
 </button>
 <button 
 onClick={handlePasswordChange}
 className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
 >
 حفظ كلمة المرور
 </button>
 </div>
 </div>
 </Modal>
 )}
 </div>
 );
};

export default Profile;
