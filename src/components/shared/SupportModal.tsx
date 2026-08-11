import React from 'react';
import Modal from './Modal';
import { Phone, Globe, MessageCircle, Headset, Sparkles, ExternalLink, Share2 } from 'lucide-react';

interface SupportModalProps {
 isOpen: boolean;
 onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
 return (
 <Modal isOpen={isOpen} onClose={onClose} title="الدعم الفني والمساعدة" size="md">
 <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white rounded-b-3xl">
 {/* Background Effects */}
 <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/10 rounded-full animate-pulse"></div>
 <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
 
 <div className="flex flex-col items-center p-8 space-y-6 relative z-10">
 
 {/* Header Icon */}
 <div className="relative group">
 <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
 <div className="w-24 h-24 bg-white/80 text-blue-600 rounded-3xl flex items-center justify-center mb-2 shadow-xl border border-white relative z-10 group-hover:scale-110 transition-transform duration-500">
 <Headset size={48} className="drop-shadow-md" />
 </div>
 <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg z-20 animate-bounce">
 <Sparkles size={16} />
 </div>
 </div>
 
 <div className="text-center">
 <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm tracking-wide">
 كيف يمكننا مساعدتك؟
 </h3>
 <p className="text-gray-500 mt-3 text-base max-w-sm font-medium leading-relaxed">
 فريق الدعم الفني متواجد دائماً لخدمتك. لا تتردد في التواصل معنا لحل أي مشكلة أو للإجابة على استفساراتك.
 </p>
 </div>

 <div className="w-full space-y-4 mt-6">
 
 {/* WhatsApp */}
 <a href="https://wa.me/07844112111" target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white border border-green-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm">
 <MessageCircle size={24} />
 </div>
 <span className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">مراسلة عبر واتساب</span>
 </div>
 <div className="flex items-center gap-2 relative z-10">
 <span className="text-green-600 font-black text-lg" dir="ltr">07844112111</span>
 <ExternalLink size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 </a>

 {/* Phone */}
 <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-gray-500/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-gray-100 text-gray-600 rounded-xl group-hover:bg-gray-800 group-hover:text-white transition-colors shadow-sm">
 <Phone size={24} />
 </div>
 <span className="font-bold text-gray-800 group-hover:text-gray-900 transition-colors">الاتصال المباشر</span>
 </div>
 <span className="text-gray-700 font-black text-lg relative z-10" dir="ltr">07844112111</span>
 </div>

 {/* Website */}
 <a href="https://pro.iqa5.site/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
 <Globe size={24} />
 </div>
 <span className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">الموقع الرسمي</span>
 </div>
 <div className="flex items-center gap-2 relative z-10">
 <span className="text-indigo-600 font-bold" dir="ltr">pro.iqa5.site</span>
 <ExternalLink size={16} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 </a>

 {/* Facebook */}
 <a href="https://www.facebook.com/pro.sastam" target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white border border-blue-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-sky-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="flex items-center gap-4 relative z-10">
 <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
 <Share2 size={24} />
 </div>
 <span className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">صفحتنا على فيسبوك</span>
 </div>
 <div className="flex items-center gap-2 relative z-10">
 <span className="text-blue-600 font-bold" dir="ltr">pro.sastam</span>
 <ExternalLink size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 </a>
 </div>

 <button 
 onClick={onClose} 
 className="mt-8 w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
 >
 إغلاق
 </button>

 </div>
 </div>
 </Modal>
 );
};

export default SupportModal;
