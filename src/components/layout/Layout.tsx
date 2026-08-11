import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useLicenseStore } from '../../store';
import { usePermissionsStore } from '../../store/permissions';
import { Lock, AlertOctagon } from 'lucide-react';

interface LayoutProps {
 children: React.ReactNode;
 activeTab: string;
 setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
 const { isActivated } = useLicenseStore();
 const { isPermissionAlertOpen, hidePermissionAlert } = usePermissionsStore();
 const [showLockWarning, setShowLockWarning] = useState(false);

 const handleRestrictedAction = (e: React.MouseEvent | React.ChangeEvent | React.KeyboardEvent | any) => {
 if (!isActivated) {
 const target = e.target as HTMLElement;
 // منع التفاعل مع العناصر النشطة إذا كان غير مفعل
 const isInteractive = target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('.cursor-pointer');
 
 // استثناء العناصر التي تحمل class "allow-unactivated" إذا أردنا
 const isAllowed = target.closest('.allow-unactivated');

 if (isInteractive && !isAllowed) {
 e.stopPropagation();
 e.preventDefault();
 setShowLockWarning(true);
 setTimeout(() => setShowLockWarning(false), 3000);
 }
 }
 };

 return (
 <div className="flex h-screen overflow-hidden bg-bg-main text-text-primary">
 <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
 
 <div className="flex-1 flex flex-col min-w-0 relative">
 <TopBar setActiveTab={setActiveTab} />
 
 {showLockWarning && (
 <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-danger text-white px-6 py-3 rounded-full shadow-lg shadow-danger/30 flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
 <Lock size={18} />
 <span className="font-bold text-sm">النظام غير مفعل. يرجى التفعيل للتحكم الكامل.</span>
 </div>
 )}

 <main 
 className="flex-1 overflow-y-auto p-6 scroll-smooth relative"
 onClickCapture={handleRestrictedAction}
 onChangeCapture={handleRestrictedAction}
 >
 {!isActivated && (
 <style>{`
 main button:not(.allow-unactivated),
 main input:not(.allow-unactivated),
 main select:not(.allow-unactivated),
 main textarea:not(.allow-unactivated),
 main .cursor-pointer:not(.allow-unactivated) {
 cursor: not-allowed !important;
 opacity: 0.8;
 }
 `}</style>
 )}
 
 <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
 {children}
 </div>
 </main>
 </div>

 {/* نافذة منع الصلاحيات المركزية */}
 {isPermissionAlertOpen && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200" style={{ margin: 0 }}>
 <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="p-8 text-center">
 <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
 <AlertOctagon size={48} className="text-danger" />
 </div>
 <h2 className="text-2xl font-bold text-slate-800 mb-3">عفواً، ليس لديك صلاحيات!</h2>
 <p className="text-slate-500 mb-8 text-sm leading-relaxed">
 لا يمكنك القيام بهذا الإجراء في النظام بناءً على صلاحيات حسابك الحالية. يرجى التواصل مع الإدارة (المدير العام) إذا كنت بحاجة لترقية صلاحياتك.
 </p>
 <button 
 onClick={hidePermissionAlert}
 className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md active:scale-95"
 >
 حسناً، فهمت
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default Layout;
