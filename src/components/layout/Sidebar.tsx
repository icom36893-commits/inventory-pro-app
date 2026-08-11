import React from 'react';
import { 
 LayoutDashboard, 
 ShoppingCart, 
 ShoppingBag, 
 Package, 
 Users, 
 Truck, 
 Landmark, 
 BarChart3, 
 Settings,
 LogOut,
 ChevronRight,
 ChevronLeft,
 Wrench

} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePermissionsStore, useAuthStore, useNotificationStore } from '../../store';
import logoImg from '../../assets/logo.png';

interface SidebarItemProps {
 icon: React.ReactNode;
 label: string;
 active?: boolean;
 onClick: () => void;
 collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, collapsed }) => (
 <button
 onClick={onClick}
 title={collapsed ? label : undefined}
 className={cn(
 "flex items-center w-full p-3.5 my-1.5 transition-all duration-300 rounded-2xl group relative overflow-hidden",
 active 
 ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 font-bold" 
 : "text-sidebar-text/80 hover:bg-white/10 hover:text-white hover:shadow-md"
 )}
 >
 {active && (
 <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
 )}
 <div className={cn("flex items-center justify-center transition-transform duration-300 group-hover:scale-110", collapsed ? "mx-auto" : "ml-4")}>
 {icon}
 </div>
 {!collapsed && <span className="text-[15px] z-10 relative">{label}</span>}
 {active && !collapsed && (
 <div className="mr-auto w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shadow-inner z-10 relative">
 <ChevronLeft className="w-4 h-4 text-white" />
 </div>
 )}
 </button>
);

interface SidebarProps {
 activeTab: string;
 setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
 const [collapsed, setCollapsed] = React.useState(false);
 const [appLogo, setAppLogo] = React.useState(localStorage.getItem('appLogo') || logoImg);
 const { hasPermission } = usePermissionsStore();
 const { user, logout } = useAuthStore();
 const { clearAll } = useNotificationStore();

 React.useEffect(() => {
 const handleLogoChange = () => setAppLogo(localStorage.getItem('appLogo') || logoImg);
 window.addEventListener('appLogoChanged', handleLogoChange);
 return () => window.removeEventListener('appLogoChanged', handleLogoChange);
 }, []);

 const allMenuItems = [
 { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, permissionId: 'dashboard.view' },
 { id: 'sales', label: 'المبيعات', icon: <ShoppingCart size={20} />, permissionId: 'sales.view' },
 { id: 'purchases', label: 'المشتريات', icon: <ShoppingBag size={20} />, permissionId: 'purchases.view' },
 { id: 'inventory', label: 'المخزون', icon: <Package size={20} />, permissionId: 'inventory.view' },
 { id: 'equipment', label: 'إدارة المعدات', icon: <Wrench size={20} />, permissionId: 'equipment.view' },
 { id: 'customers', label: 'العملاء', icon: <Users size={20} />, permissionId: 'parties.view' },
 { id: 'suppliers', label: 'الموردون', icon: <Truck size={20} />, permissionId: 'parties.view' },
 { id: 'treasury', label: 'الخزينة', icon: <Landmark size={20} />, permissionId: 'treasury.view' },
 { id: 'reports', label: 'التقارير', icon: <BarChart3 size={20} />, permissionId: 'reports.sales' },
 { id: 'settings', label: 'الإعدادات', icon: <Settings size={20} />, permissionId: 'settings.company' },
 ];

 const menuItems = allMenuItems.filter(item => {
 if (!item.permissionId) return true;
 return hasPermission(user?.role || 'user', item.permissionId);
 });

 return (
 <aside 
 className={cn(
 "flex flex-col h-screen bg-sidebar-bg transition-all duration-400 ease-out shadow-2xl shadow-black/50 z-20 border-l border-white/5 relative",
 collapsed ? "w-24" : "w-[280px]"
 )}
 >
 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 pointer-events-none"></div>

 <div className={cn("flex flex-col items-center py-8 border-b border-white/5 relative transition-all duration-400 z-10", collapsed ? "px-2" : "px-6")}>
 <div className="relative group flex justify-center w-full mt-2">
 <div className="absolute inset-0 bg-white/5 rounded-full transition-all duration-500 group-hover:bg-accent/20"></div>
 <img 
 src={appLogo} 
 alt="المخزن برو" 
 className={cn(
 "relative object-contain drop-shadow-2xl transition-all duration-500 z-10",
 collapsed ? "w-14 h-14" : "w-32 h-32 hover:scale-105"
 )} 
 style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}
 />
 </div>
 {!collapsed && (
 <div className="flex flex-col items-center mt-6 w-full animate-fade-in">
 <h1 className="text-white font-black text-3xl tracking-wide" style={{ textShadow: '0 4px 6px rgba(0,0,0,0.6)' }}>
 المخزن <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary-light font-bold">برو</span>
 </h1>
 <div className="h-1 w-20 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full mt-4 opacity-80"></div>
 <p className="text-white/50 text-[10px] tracking-[0.4em] mt-3 font-black uppercase">
 Makhzan Pro
 </p>
 </div>
 )}
 <button 
 onClick={() => setCollapsed(!collapsed)}
 className="absolute top-12 -left-5 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white hover:shadow-lg hover:shadow-primary/40 hover:scale-110 transition-all z-50 border-4 border-bg-main"
 title={collapsed ? "توسيع القائمة" : "طي القائمة"}
 >
 {collapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
 </button>
 </div>

 <nav className="flex-1 overflow-y-auto py-6 px-4 z-10 relative custom-scrollbar">
 {menuItems.map((item) => (
 <SidebarItem
 key={item.id}
 icon={item.icon}
 label={item.label}
 active={activeTab === item.id}
 onClick={() => setActiveTab(item.id)}
 collapsed={collapsed}
 />
 ))}
 </nav>

 <div className="p-5 border-t border-white/5 z-10 relative">
 <div className="flex items-center justify-center">
 <button 
 onClick={() => {
 clearAll();
 logout();
 }}
 className={cn("text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-600 rounded-2xl transition-all duration-300 flex items-center justify-center hover:shadow-lg hover:shadow-red-500/20", collapsed ? "p-3 w-12 h-12" : "w-full p-4 gap-3 bg-red-500/10 border border-red-500/20")}
 title="تسجيل الخروج"
 >
 <LogOut size={22} className={cn("transition-transform", !collapsed && "group-hover:-translate-x-1")} />
 {!collapsed && <span className="font-bold text-[15px]">تسجيل الخروج</span>}
 </button>
 </div>
 </div>
 </aside>
 );
};

export default Sidebar;
