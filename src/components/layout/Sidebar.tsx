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
  ChevronLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePermissionsStore, useAuthStore, useNotificationStore } from '../../store';

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
    className={cn(
      "flex items-center w-full p-3 my-1 transition-all duration-200 rounded-lg group",
      active 
        ? "bg-primary-light text-white shadow-md" 
        : "text-sidebar-text hover:bg-white/10 hover:text-white"
    )}
  >
    <div className={cn("flex items-center justify-center", collapsed ? "mx-auto" : "ml-3")}>
      {icon}
    </div>
    {!collapsed && <span className="text-sm font-medium">{label}</span>}
    {active && !collapsed && <ChevronLeft className="mr-auto w-4 h-4" />}
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [appLogo, setAppLogo] = React.useState(localStorage.getItem('appLogo') || '/logo.png?v=3');
  const { hasPermission } = usePermissionsStore();
  const { user, logout } = useAuthStore();
  const { clearAll } = useNotificationStore();

  React.useEffect(() => {
    const handleLogoChange = () => setAppLogo(localStorage.getItem('appLogo') || '/logo.png?v=3');
    window.addEventListener('appLogoChanged', handleLogoChange);
    return () => window.removeEventListener('appLogoChanged', handleLogoChange);
  }, []);

  const allMenuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, permissionId: 'dashboard.view' },
    { id: 'sales', label: 'المبيعات', icon: <ShoppingCart size={20} />, permissionId: 'sales.view' },
    { id: 'purchases', label: 'المشتريات', icon: <ShoppingBag size={20} />, permissionId: 'purchases.view' },
    { id: 'inventory', label: 'المخزون', icon: <Package size={20} />, permissionId: 'inventory.view' },
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
        "flex flex-col h-screen bg-sidebar-bg transition-all duration-300 shadow-xl z-20",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex flex-col items-center py-8 border-b border-white/10 relative transition-all duration-300", collapsed ? "px-2" : "px-4")}>
        <div className="relative group flex justify-center w-full mt-2">
           <div className="absolute inset-0 bg-white/5 rounded-full blur-xl transition-all duration-500 group-hover:bg-accent/20"></div>
           <img 
             src={appLogo} 
             alt="المخزن برو" 
             className={cn(
               "relative object-contain drop-shadow-2xl transition-all duration-500 z-10",
               collapsed ? "w-12 h-12" : "w-28 h-28 hover:scale-105"
             )} 
             style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
           />
        </div>
        {!collapsed && (
          <div className="flex flex-col items-center mt-4 w-full">
            <h1 className="text-white font-black text-3xl tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
              المخزن <span className="text-accent font-light">برو</span>
            </h1>
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full mt-3 opacity-70"></div>
            <p className="text-sidebar-text text-xs tracking-[0.3em] mt-2 opacity-60 font-bold uppercase">
              Makhzan Pro
            </p>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-10 -left-4 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-light hover:scale-110 transition-all shadow-lg z-50 border-2 border-bg-main"
          title={collapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
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

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center">
          <button 
            onClick={() => {
              clearAll();
              logout();
            }}
            className={cn("text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center justify-center", collapsed ? "p-2" : "w-full p-2.5 gap-2 bg-danger/5 border border-danger/20")}
            title="تسجيل الخروج"
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-bold text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
