import React, { useState, useEffect } from 'react';
import { Lock, User } from 'lucide-react';
import { useSettingsStore, useAuthStore } from '../store';
import logoImg from '../assets/logo.png';

interface AuthProps {
 onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 
 const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || logoImg);

 useEffect(() => {
 const handleLogoChange = () => setAppLogo(localStorage.getItem('appLogo') || logoImg);
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
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
 {/* Background Decorations */}
 <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full animate-pulse"></div>
 <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
 <div className="absolute top-[40%] left-[20%] w-64 h-64 bg-emerald-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

 <div className="bg-white/80 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white relative z-10">
 <div className="bg-gradient-to-br from-primary to-indigo-600 p-10 text-center relative overflow-hidden">
 <div className="absolute inset-0 bg-black/10"></div>
 
 <div className="w-32 h-32 mx-auto flex items-center justify-center mb-4 relative z-10 group">
 <div className="absolute inset-0 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-500"></div>
 <img src={appLogo} alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }} />
 </div>
 <h1 className="text-4xl font-black text-white tracking-wide drop-shadow-lg relative z-10 mb-2">{companyName}</h1>
 <div className="flex items-center justify-center mt-2 relative z-10">
 <div className="h-0.5 bg-gradient-to-l from-transparent to-white/50 w-16 rounded-full"></div>
 <p className="text-white/90 text-sm font-bold mx-4 tracking-wider">تسجيل الدخول للمتابعة</p>
 <div className="h-0.5 bg-gradient-to-r from-transparent to-white/50 w-16 rounded-full"></div>
 </div>
 </div>
 
 <div className="p-10">
 <form onSubmit={handleSubmit} className="space-y-6">
 {error && (
 <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-fade-in shadow-sm">
 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
 <span className="text-lg">⚠️</span>
 </div>
 {error}
 </div>
 )}
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 mr-2">اسم المستخدم</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
 <User size={20} />
 </div>
 <input 
 type="text" 
 value={username}
 onChange={e => setUsername(e.target.value)}
 className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-bold text-gray-800 shadow-sm"
 placeholder="أدخل اسم المستخدم..."
 dir="rtl"
 required
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700 mr-2">كلمة المرور</label>
 <div className="relative group">
 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
 <Lock size={20} />
 </div>
 <input 
 type="password" 
 value={password}
 onChange={e => setPassword(e.target.value)}
 className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all text-left dir-ltr font-bold text-gray-800 shadow-sm"
 placeholder="••••••••"
 dir="rtl"
 required
 />
 </div>
 </div>
 
 <button 
 type="submit" 
 disabled={isLoading}
 className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl font-bold text-xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 mt-8 relative overflow-hidden group"
 >
 <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
 <span className="relative z-10">{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
 </button>
 </form>
 </div>
 </div>
 </div>
 );
};

export default Auth;
