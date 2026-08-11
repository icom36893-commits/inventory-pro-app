import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import logoImg from '../../assets/logo.png';
import { Code2, Copyright, Sparkles, Cpu, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
 isOpen: boolean;
 onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
 const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || logoImg);

 useEffect(() => {
 const handleLogoChange = () => setAppLogo(localStorage.getItem('appLogo') || logoImg);
 window.addEventListener('appLogoChanged', handleLogoChange);
 return () => window.removeEventListener('appLogoChanged', handleLogoChange);
 }, []);

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="عن البرنامج" size="md">
 <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white rounded-b-3xl">
 {/* Background Effects */}
 <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/10 rounded-full animate-pulse"></div>
 <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
 
 <div className="flex flex-col items-center justify-center p-10 space-y-8 text-center relative z-10">
 
 {/* Logo/Icon */}
 <div className="relative group">
 <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
 <div className="w-36 h-36 flex items-center justify-center bg-white/80 rounded-3xl overflow-hidden shadow-xl border border-white relative z-10 p-4">
 <img src={appLogo} alt="المخزن برو" className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
 </div>
 </div>
 
 {/* App Info */}
 <div className="space-y-2">
 <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 drop-shadow-sm tracking-wide">
 المخزن برو
 </h2>
 <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm mt-2">
 <Sparkles size={16} className="text-emerald-500" />
 <p className="text-emerald-700 font-bold text-sm">الإصدار 1.0.5</p>
 </div>
 </div>

 {/* Description */}
 <p className="text-gray-500 leading-relaxed text-base max-w-sm font-medium">
 نظام متكامل واحترافي لإدارة المخزون، المبيعات، المشتريات، وحسابات العملاء والموردين. صُمم بأحدث التقنيات ليوفر تجربة مستخدم سلسة وأداءً فائقاً.
 </p>

 <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6"></div>

 {/* Developer Info / Links */}
 <div className="flex flex-col items-center gap-3 w-full">
 <div className="flex items-center gap-3 text-gray-700 bg-white px-5 py-3.5 rounded-2xl w-full justify-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
 <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
 <Cpu size={20} />
 </div>
 <span className="font-bold text-sm">تم التطوير باستخدام أحدث التقنيات</span>
 </div>
 
 <div className="flex items-center gap-3 text-gray-700 bg-white px-5 py-3.5 rounded-2xl w-full justify-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
 <ShieldCheck size={20} />
 </div>
 <span className="font-bold text-sm">جميع الحقوق محفوظة &copy; المطور برو</span>
 </div>
 </div>

 <button 
 onClick={onClose} 
 className="mt-8 w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-6 py-4 rounded-2xl font-black text-lg shadow-sm border border-gray-200 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
 >
 إغلاق
 </button>

 </div>
 </div>
 </Modal>
 );
};

export default AboutModal;
