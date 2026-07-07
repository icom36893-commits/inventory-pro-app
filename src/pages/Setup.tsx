import React, { useState } from 'react';
import { useAuthStore, useLicenseStore } from '../store';
import { User, Lock, Phone, Mail, ArrowRight } from 'lucide-react';

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
      
      // تفعيل النظام كنسخة تجريبية لمدة 14 يوم
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      activateSystem('14_days', expiryDate.toISOString());

      // إنهاء عملية الإعداد
      setSetupComplete(true);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ بيانات المدير في قاعدة البيانات');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 text-center bg-gradient-to-br from-primary to-primary-light text-white">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-4 border-white/30">
            <img src="/logo.png" alt="المخزن برو" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold mb-2">مرحباً بك في المخزن برو</h1>
          <p className="text-white/80 text-sm">قم بإعداد حساب المدير الخاص بك للبدء</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm font-bold rounded-lg text-center border border-danger/20">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-bg-main"
                  placeholder="اسم المدير العام"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-bg-main"
                  placeholder="كلمة مرور قوية"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">رقم الهاتف</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <Phone size={18} />
                </div>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-bg-main text-left"
                  placeholder="05X XXX XXXX"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-bg-main text-left"
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 group"
            >
              <span>إكمال التثبيت والبدء</span>
              <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;
