import React, { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';
import { useSettingsStore, useAuthStore } from '../store';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '/logo.png?v=3');

  useEffect(() => {
    const handleLogoChange = () => setAppLogo(localStorage.getItem('appLogo') || '/logo.png?v=3');
    window.addEventListener('appLogoChanged', handleLogoChange);
    return () => window.removeEventListener('appLogoChanged', handleLogoChange);
  }, []);

  const { settings } = useSettingsStore();
  const companyName = settings?.name || 'المخزن برو';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await (window as any).api.users.login({ username, password });
      
      // Store user session in memory/localStorage (simplified)
      localStorage.setItem('user', JSON.stringify(user));
      useAuthStore.getState().login(user);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-border">
        <div className="bg-primary p-8 text-center">
          <div className="w-48 h-48 mx-auto flex items-center justify-center mb-2 drop-shadow-2xl relative">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl"></div>
            <img src={appLogo} alt="Logo" className="w-full h-full object-contain relative z-10 hover:scale-105 transition-transform duration-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide drop-shadow-md">{companyName}</h1>
          <div className="flex items-center justify-center mt-4">
            <div className="h-px bg-white/30 w-12 rounded-full"></div>
            <p className="text-white text-sm font-bold mx-4 tracking-wider drop-shadow-sm opacity-90">تسجيل الدخول للمتابعة</p>
            <div className="h-px bg-white/30 w-12 rounded-full"></div>
          </div>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-bold border border-danger/20">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-bg-main border border-border/50 rounded-xl py-3 pr-10 pl-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="أدخل اسم المستخدم..."
                  dir="rtl"
                  required
                />
                <User className="absolute right-3 top-3.5 text-text-muted" size={20} />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-text-muted mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-main border border-border/50 rounded-xl py-3 pr-10 pl-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="أدخل كلمة المرور..."
                  dir="rtl"
                  required
                />
                <Lock className="absolute right-3 top-3.5 text-text-muted" size={20} />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/30 disabled:opacity-70"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
