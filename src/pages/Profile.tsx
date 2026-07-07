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
      if (user?.id) {
        await (window as any).api.users.update({ id: user.id, username: user.username, ...updatedUser });
      }
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
      if (user?.id) {
        await (window as any).api.users.update({
          id: user.id,
          username: user.username,
          name: formData.name,
          role: formData.role,
          password: newPassword,
          profileImage: profileImage
        });
        toast.success('تم تغيير كلمة المرور بنجاح');
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">الملف الشخصي</h1>
        <p className="text-text-muted mt-1 text-sm">إدارة معلومات حسابك وإعدادات الأمان</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center text-center lg:col-span-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            className="relative mb-4 group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-32 h-32 rounded-full bg-primary-light flex items-center justify-center text-white text-5xl shadow-md overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={28} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-text-primary">{formData.name}</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full mt-2 text-sm font-medium">
            <Shield size={14} />
            {formData.role === 'admin' ? 'مدير النظام' : formData.role === 'accountant' ? 'محاسب' : (formData.role === 'seller' || formData.role === 'sales') ? 'بائع' : formData.role}
          </div>
          
          <div className="w-full mt-8 border-t border-border pt-6 space-y-4 text-sm text-right">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-text-muted">آخر تسجيل دخول</span>
              <span className="font-medium text-text-primary">اليوم، 08:30 ص</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">حالة الحساب</span>
              <span className="font-medium text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded">نشط</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-primary">المعلومات الشخصية</h3>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                isEditing 
                  ? 'bg-primary text-white shadow-sm hover:bg-primary-dark' 
                  : 'bg-bg-main text-text-primary hover:bg-border'
              }`}
            >
              {isEditing ? (
                <>
                  <Save size={16} />
                  حفظ التغييرات
                </>
              ) : (
                'تعديل البيانات'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full pl-4 pr-10 py-2.5 rounded-xl border ${isEditing ? 'border-primary/50 focus:ring-2 focus:ring-primary/20 bg-white' : 'border-border bg-bg-main text-text-muted'} outline-none transition-all`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full pl-4 pr-10 py-2.5 rounded-xl border ${isEditing ? 'border-primary/50 focus:ring-2 focus:ring-primary/20 bg-white' : 'border-border bg-bg-main text-text-muted'} outline-none transition-all`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">رقم الجوال</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-lg leading-none mt-0.5">📱</span>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full pl-4 pr-10 py-2.5 rounded-xl border ${isEditing ? 'border-primary/50 focus:ring-2 focus:ring-primary/20 bg-white' : 'border-border bg-bg-main text-text-muted'} outline-none transition-all text-left dir-ltr`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">الدور (الصلاحية)</label>
              <div className="relative">
                <Shield className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  value={formData.role === 'admin' ? 'مدير النظام' : formData.role === 'accountant' ? 'محاسب' : (formData.role === 'seller' || formData.role === 'sales') ? 'بائع' : formData.role}
                  disabled
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-bg-main text-text-muted outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              إعدادات الأمان
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 border border-border rounded-xl bg-bg-main/30">
              <div>
                <p className="font-bold text-text-primary">كلمة المرور</p>
                <p className="text-sm text-text-muted mt-1">يُنصح بتغيير كلمة المرور بشكل دوري لحماية حسابك</p>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-bold text-text-primary hover:bg-bg-main transition-colors shadow-sm"
              >
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left dir-ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left dir-ltr"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-primary font-bold hover:bg-bg-main"
              >
                إلغاء
              </button>
              <button 
                onClick={handlePasswordChange}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark"
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
