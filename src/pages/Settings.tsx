import React, { useState, useEffect } from 'react';
import {
 Building2,
 Server, 
 Settings as SettingsIcon, 
 Database, 
 Users as UsersIcon, 
 ShieldCheck, 
 Save, 
 Upload, 
 Download,
 Plus,
 Box,
 Info,
 Palette,
 Eye,
 FileText,
 ShoppingCart,
 TrendingUp,
 Edit,
 Trash2,
 Landmark,
 MessageCircle,
 RefreshCw,
 Code,
 Moon,
 Calculator,
 Bell,
 Play,
 List,
 Ruler,
 ArrowRight,
 Calendar,
 Lock,
 ClipboardCheck,
 Clock,
 Key,
 Copy,
 User,
 Zap,
 FolderUp
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { cn } from '../utils/cn';
import { useSettingsStore, useLicenseStore, useNotificationStore, useAuthStore } from '../store';
import { usePermissionsStore } from '../store/permissions';
import ServerSettingsTab from '../components/settings/ServerSettingsTab';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { defaultSalesTemplate } from '../templates/defaultSales';
import { defaultPurchaseTemplate } from '../templates/defaultPurchase';
import { defaultSalesPosTemplate } from '../templates/defaultSalesPos';
import { defaultPurchasePosTemplate } from '../templates/defaultPurchasePos';
import { defaultReportTemplate } from '../templates/defaultReport';
import { defaultTreasuryTemplate } from '../templates/defaultTreasury';
import { defaultStatementTemplate } from '../templates/defaultStatement';
import StocktakeModal from '../components/stocktake/StocktakeModal';

const Settings: React.FC = () => {
 const [activeTab, setActiveTab] = useState('company');
 const { user } = useAuthStore();
 const { hasPermission } = usePermissionsStore();
 const role = user?.role || 'user';
 const [activeDesignTab, setActiveDesignTab] = useState<'sales' | 'purchase' | 'reports' | 'treasury' | 'statement'>('sales');
 const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
 const { settings, fetchSettings } = useSettingsStore();
 const [formData, setFormData] = useState<Record<string, string>>({});
 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
 const toast = useToast();
 
 // License Store
 const { isActivated, activationType, expiryDate } = useLicenseStore();
 
 // Notification Store
 const { soundEnabled, setSoundEnabled, testSound, notifyDataBackup, addNotification } = useNotificationStore();
 
 // User Management State
 const [usersList, setUsersList] = useState<any[]>([]);
 const [isUserModalOpen, setIsUserModalOpen] = useState(false);
 const [editingUserId, setEditingUserId] = useState<number | null>(null);
 const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'accountant', mobile_permission: 'full' });
 const [activeUsersTab, setActiveUsersTab] = useState<'list' | 'permissions'>('list');
 const [selectedRole, setSelectedRole] = useState<string>('accountant');
 
 // Stocktake state
 const [isStocktakeModalOpen, setIsStocktakeModalOpen] = useState(false);

 // App Settings state
 const [autoStartEnabled, setAutoStartEnabled] = useState(false);
 const [apiConnectionStatus, setApiConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

 // Update state
 const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
 const [updateProgress, setUpdateProgress] = useState(0);
 const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
 const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(localStorage.getItem('autoUpdateEnabled') === 'true');

 const { availablePermissions, rolePermissions, toggleRolePermission, initializePermissions, setRolePermissions } = usePermissionsStore();

 // Basic Data State
 const [activeBasicDataTab, setActiveBasicDataTab] = useState<string | null>(null);
 const [basicDataList, setBasicDataList] = useState<any[]>([]);
 const [isBasicDataModalOpen, setIsBasicDataModalOpen] = useState(false);
 const [newBasicDataName, setNewBasicDataName] = useState('');
 const [newBasicDataDesc, setNewBasicDataDesc] = useState('');
 const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || logoImg);
 const [newTreasuryType, setNewTreasuryType] = useState('income');

 // --- Tabs and Filtering (Moved BEFORE useEffects!) ---
 const tabs = [
 { id: 'company', label: 'بيانات الشركة', icon: <Building2 size={18} />, permissionId: 'settings.company' },
 { id: 'general', label: 'إعدادات عامة', icon: <SettingsIcon size={18} />, permissionId: 'settings.general' },
 { id: 'app_settings', label: 'اعدادات التطبيق', icon: <SettingsIcon size={18} />, permissionId: 'settings.app_settings' },
 { id: 'basic_data', label: 'البيانات الأساسية', icon: <Box size={18} />, permissionId: 'settings.basic_data' },
 { id: 'design', label: 'تخصيص وتصميم', icon: <Palette size={18} />, permissionId: 'settings.design' },
 { id: 'users', label: 'المستخدمين', icon: <UsersIcon size={18} />, permissionId: 'settings.users' },
 { id: 'backup', label: 'النسخ الاحتياطي', icon: <Database size={18} />, permissionId: 'settings.backup' },
 { id: 'subscriptions', label: 'تفاصيل الاشتراك', icon: <ShieldCheck size={18} />, permissionId: 'settings.subscriptions' },
 { id: 'bot', label: 'إعدادات البوت', icon: <MessageCircle size={18} />, permissionId: 'settings.bot' },
 { id: 'updates', label: 'التحديثات', icon: <RefreshCw size={18} />, permissionId: 'settings.updates' },
 { id: 'financial_year', label: 'السنة الحسابية', icon: <Landmark size={18} />, permissionId: 'settings.financial_year' },
 { id: 'server', label: 'إعداد السيرفر', icon: <Server size={18} />, permissionId: 'settings.server' },
 { id: 'about', label: 'حول التطبيق', icon: <Info size={18} />, permissionId: null },
 ];
 
 // Filter tabs based on permissions
 const filteredTabs = tabs.filter(tab => {
 if (!tab.permissionId) return true;
 return hasPermission(role, tab.permissionId);
 });
 // ------------------------------------------------------

 useEffect(() => {
 if ((window as any).api && (window as any).api.settings && (window as any).api.settings.getAutoStart) {
 (window as any).api.settings.getAutoStart().then((enabled: boolean) => {
 setAutoStartEnabled(enabled);
 });
 }
 }, []);

 const toggleAutoStart = async () => {
 const newValue = !autoStartEnabled;
 setAutoStartEnabled(newValue);
 if ((window as any).api && (window as any).api.settings && (window as any).api.settings.setAutoStart) {
 await (window as any).api.settings.setAutoStart(newValue);
 }
 };

 const testApiConnection = async () => {
 setApiConnectionStatus('testing');
 try {
 // test real time db url by fetching .json
 let dbUrl = formData['firebase_database_url'] || `https://${formData['firebase_project_id']}-default-rtdb.firebaseio.com`;
 if (dbUrl && !dbUrl.startsWith('http')) {
 dbUrl = `https://${dbUrl}`;
 }
 const response = await fetch(`${dbUrl}/.json`, {
 method: 'GET'
 });
 if (response.ok || response.status === 401) { // 401 means it exists but permission denied, which is expected and means DB is reachable
 setApiConnectionStatus('success');
 toast.success('تم الاتصال بقاعدة بيانات Firebase بنجاح!');
 } else {
 setApiConnectionStatus('error');
 toast.error('فشل الاتصال: يرجى التحقق من صحة بيانات Firebase');
 }
 } catch (e) {
 setApiConnectionStatus('error');
 toast.error('خطأ في الاتصال بالنظام السحابي');
 }
 };

 const toggleAutoUpdate = () => {
 const newValue = !autoUpdateEnabled;
 setAutoUpdateEnabled(newValue);
 localStorage.setItem('autoUpdateEnabled', String(newValue));
 };

 const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onload = (e) => {
 const dataUrl = e.target?.result as string;
 setAppLogo(dataUrl);
 localStorage.setItem('appLogo', dataUrl);
 window.dispatchEvent(new Event('appLogoChanged'));
 };
 reader.readAsDataURL(file);
 }
 };

 const startUpdateProcess = async (type: 'internet' | 'local') => {
 if (type === 'local') {
 try {
 const result = await (window as any).api.settings.installLocalUpdate();
 if (result && result.success) {
 toast.success('تم التحديث المحلي وسيتم إعادة التشغيل.');
 } else if (result && result.canceled) {
 toast.error('تم إلغاء التحديث.');
 } else {
 toast.error('حدث خطأ أثناء بدء التحديث.');
 }
 } catch (error) {
 console.error('Update error:', error);
 toast.error('حدث خطأ غير متوقع أثناء بدء التحديث.');
 }
 } else {
 window.dispatchEvent(new CustomEvent('trigger-update'));
 }
 };

 useEffect(() => {
 fetchSettings();
 loadUsers();
 }, [fetchSettings]);
 
 // Ensure active tab is always in filtered tabs
 useEffect(() => {
 if (filteredTabs.length > 0 && !filteredTabs.find(tab => tab.id === activeTab)) {
 setActiveTab(filteredTabs[0].id);
 }
 }, [filteredTabs, activeTab]);

 const loadUsers = async () => {
 try {
 const data = await (window as any).api.users.getAll();
 setUsersList(data);
 } catch (error) {
 console.error(error);
 }
 };

 const handleCloseFiscalYear = async () => {
 setConfirmAction({
 isOpen: true,
 title: 'إغلاق السنة الحسابية',
 message: 'تحذير: إغلاق السنة الحسابية سيقوم بحذف جميع الفواتير والحركات المالية من النظام وترحيل الأرصدة الختامية للعملاء والخزينة لتبدأ بها السنة الجديدة. سيتم حفظ نسخة مؤرشفة تلقائياً. هل أنت متأكد من رغبتك في إتمام هذه العملية؟ (هذا الإجراء لا يمكن التراجع عنه!)',
 type: 'danger',
 onConfirm: async () => {
 try {
 const res = await (window as any).api.settings.closeFiscalYear();
 if (res.success) {
 toast.success('تم إغلاق السنة الحسابية بنجاح، وتحديث النظام بالأرصدة الجديدة.');
 fetchSettings(); // Reload to get new dates
 } else if (res.canceled) {
 toast.success('تم إلغاء عملية إغلاق السنة.');
 } else {
 toast.error(res.error || 'حدث خطأ غير متوقع');
 }
 } catch (error) {
 console.error(error);
 toast.error('فشل إغلاق السنة الحسابية');
 }
 }
 });
 };

 const handleCreateUser = async () => {
 if (!newUser.username || (!newUser.password && !editingUserId) || !newUser.full_name) return toast.warning('يرجى تعبئة جميع الحقول المطلوبة');
 try {
 if (editingUserId) {
 await (window as any).api.users.update({ id: editingUserId, ...newUser });
 toast.success('تم تحديث المستخدم بنجاح');
 } else {
 await (window as any).api.users.create(newUser);
 toast.success('تمت إضافة المستخدم بنجاح');
 }
 setIsUserModalOpen(false);
 setEditingUserId(null);
 setNewUser({ username: '', password: '', full_name: '', role: 'accountant', mobile_permission: 'full' });
 loadUsers();
 } catch (error: any) {
 console.error(error);
 toast.error(error.message || 'حدث خطأ أثناء حفظ المستخدم');
 }
 };


 useEffect(() => {
 if (settings && typeof settings === 'object') {
 const data: Record<string, any> = { ...settings };
 if (data.name) data.company_name = data.name;
 if (data.tax_enabled !== undefined) data.tax_enabled = data.tax_enabled ? 'true' : 'false';
 if (data.print_show_logo !== undefined) data.print_show_logo = data.print_show_logo ? 'true' : 'false';
 if (data.auto_backup_enabled !== undefined) data.auto_backup_enabled = data.auto_backup_enabled ? 'true' : 'false';
 
 const botBooleans = ['telegram_bot_enabled', 'telegram_sales_report', 'telegram_income_statement', 'telegram_purchases_report', 'telegram_inventory_movement', 'telegram_customer_balances', 'telegram_balance_sheet', 'telegram_purchase_prices'];
 botBooleans.forEach(key => {
 if (data[key] !== undefined) data[key] = data[key] ? 'true' : 'false';
 });
 
 setFormData(data);
 }
 }, [settings]);

 const handleSave = async () => {
 try {
 const dataToSave: Record<string, any> = { ...formData };
 if (dataToSave.company_name !== undefined) {
 dataToSave.name = dataToSave.company_name;
 delete dataToSave.company_name;
 }
 delete dataToSave.id;
 delete dataToSave.created_at;
 
 if (dataToSave.tax_enabled === 'true') dataToSave.tax_enabled = 1;
 else if (dataToSave.tax_enabled === 'false') dataToSave.tax_enabled = 0;
 
 if (dataToSave.print_show_logo === 'true') dataToSave.print_show_logo = 1;
 else if (dataToSave.print_show_logo === 'false') dataToSave.print_show_logo = 0;

 if (dataToSave.auto_backup_enabled === 'true') dataToSave.auto_backup_enabled = 1;
 else if (dataToSave.auto_backup_enabled === 'false') dataToSave.auto_backup_enabled = 0;

 const botBooleans = ['telegram_bot_enabled', 'telegram_sales_report', 'telegram_income_statement', 'telegram_purchases_report', 'telegram_inventory_movement', 'telegram_customer_balances', 'telegram_balance_sheet', 'telegram_purchase_prices'];
 botBooleans.forEach(key => {
 if (dataToSave[key] === 'true') dataToSave[key] = 1;
 else if (dataToSave[key] === 'false') dataToSave[key] = 0;
 });

 await (window as any).api.settings.update(dataToSave);
 fetchSettings();
 toast.success('تم حفظ الإعدادات بنجاح');
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء الحفظ');
 }
 };

 const loadBasicData = async (type: string) => {
 try {
 let data = [];
 if (type === 'warehouses') data = await (window as any).api.basicData.getWarehouses();
 else if (type === 'categories') data = await (window as any).api.basicData.getCategories();
 else if (type === 'units') data = await (window as any).api.basicData.getUnits();
 else if (type === 'treasury') data = await (window as any).api.basicData.getTreasuryCategories();
 setBasicDataList(data);
 } catch (e) {
 toast.error('خطأ في جلب البيانات الأساسية');
 }
 };

 const openBasicDataTab = (type: string) => {
 setActiveBasicDataTab(type);
 loadBasicData(type);
 };

 const handleCreateBasicData = async () => {
 if (!newBasicDataName) return toast.warning('الرجاء إدخال الاسم');
 try {
 if (activeBasicDataTab === 'warehouses') {
 await (window as any).api.basicData.createWarehouse({ name: newBasicDataName, location: newBasicDataDesc });
 } else if (activeBasicDataTab === 'categories') {
 await (window as any).api.basicData.createCategory({ name: newBasicDataName, description: newBasicDataDesc });
 } else if (activeBasicDataTab === 'units') {
 await (window as any).api.basicData.createUnit({ name: newBasicDataName });
 } else if (activeBasicDataTab === 'treasury') {
 await (window as any).api.basicData.createTreasuryCategory({ name: newBasicDataName, type: newTreasuryType });
 }
 setIsBasicDataModalOpen(false);
 setNewBasicDataName('');
 setNewBasicDataDesc('');
 loadBasicData(activeBasicDataTab!);
 toast.success('تمت الإضافة بنجاح');
 } catch (e) {
 toast.error('حدث خطأ أثناء الإضافة');
 }
 };

 const handleDeleteBasicData = (id: number) => {
 setConfirmAction({
 isOpen: true,
 title: 'حذف البيانات',
 message: 'هل أنت متأكد من الحذف؟',
 type: 'danger',
 onConfirm: async () => {
 try {
 if (activeBasicDataTab === 'warehouses') await (window as any).api.basicData.deleteWarehouse(id);
 else if (activeBasicDataTab === 'categories') await (window as any).api.basicData.deleteCategory(id);
 else if (activeBasicDataTab === 'units') await (window as any).api.basicData.deleteUnit(id);
 else if (activeBasicDataTab === 'treasury') await (window as any).api.basicData.deleteTreasuryCategory(id);
 loadBasicData(activeBasicDataTab!);
 toast.success('تم الحذف بنجاح');
 } catch (e: any) {
 toast.error(e.message || 'حدث خطأ أثناء الحذف');
 }
 }
 });
 };

 const handleChange = (key: string, value: string) => {
 setFormData(prev => ({ ...prev, [key]: value }));
 };

 const handleImageUpload = (key: string, file: File) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 handleChange(key, e.target?.result as string);
 };
 reader.readAsDataURL(file);
 };

 const handleRestoreDefaultTemplate = () => {
 let defaultCode = '';
 const isPosTemplate = formData[`${activeDesignTab}_template_type`] === 'pos';

 if (isPosTemplate) {
 if (activeDesignTab === 'sales') defaultCode = defaultSalesPosTemplate;
 else if (activeDesignTab === 'purchase') defaultCode = defaultPurchasePosTemplate;
 handleChange(`${activeDesignTab}_pos_custom_html`, defaultCode);
 } else {
 if (activeDesignTab === 'sales') defaultCode = defaultSalesTemplate;
 else if (activeDesignTab === 'purchase') defaultCode = defaultPurchaseTemplate;
 else if (activeDesignTab === 'reports') defaultCode = defaultReportTemplate;
 else if (activeDesignTab === 'treasury') defaultCode = defaultTreasuryTemplate;
 else if (activeDesignTab === 'statement') defaultCode = defaultStatementTemplate;
 handleChange(`${activeDesignTab}_custom_html`, defaultCode);
 }

 toast.success('تم استعادة التصميم الافتراضي. لا تنس حفظ التغييرات.');
 };

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Header Area */}
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">إعدادات النظام</h1>
 <p className="text-text-muted text-sm mt-1">تخصيص النظام، إدارة المستخدمين، والنسخ الاحتياطي بواجهة متقدمة.</p>
 </div>

 <div className="flex flex-col lg:flex-row gap-8">
 {/* Sidebar Tabs */}
 <div className="w-full lg:w-[320px] shrink-0">
 <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-2 sticky top-6">
 <h3 className="font-black text-gray-800 text-lg px-2 pb-2 border-b border-gray-100 mb-2">أقسام الإعدادات</h3>
 {filteredTabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "flex items-center gap-4 w-full p-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group relative overflow-hidden",
 activeTab === tab.id 
 ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/20 hover:-translate-y-0.5" 
 : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-transparent hover:border-gray-100"
 )}
 >
 {activeTab === tab.id && (
 <div className="absolute top-0 right-0 w-full h-full bg-white/10"></div>
 )}
 <div className={cn(
 "p-2.5 rounded-xl transition-all duration-300 z-10", 
 activeTab === tab.id 
 ? "bg-white/20 text-white shadow-inner" 
 : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-primary group-hover:shadow-sm"
 )}>
 {tab.icon}
 </div>
 <span className="z-10">{tab.label}</span>
 {activeTab === tab.id && (
 <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white animate-pulse z-10"></div>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 p-6 md:p-10 shadow-sm min-h-[600px] overflow-hidden relative">
 {activeTab === 'app_settings' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary/20">
 <SettingsIcon size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">إعدادات التطبيق</h2>
 <p className="text-gray-500 text-sm mt-1">التحكم بإعدادات التشغيل والربط السحابي مع Firebase.</p>
 </div>
 </div>

 <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
 <div>
 <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
 تشغيل التطبيق تلقائياً
 <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">نظام Windows</span>
 </h4>
 <p className="text-sm text-gray-500 mt-1 max-w-md">عند تفعيل هذا الخيار، سيتم تشغيل التطبيق في الخلفية بمجرد تشغيل جهاز الكمبيوتر لضمان استمرار المزامنة.</p>
 </div>
 <div onClick={toggleAutoStart} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", autoStartEnabled ? "bg-success" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md", autoStartEnabled ? "left-1" : "right-1")}></div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="bg-gray-50 p-6 border-b border-gray-200">
 <h4 className="font-black text-gray-800 text-lg mb-1 flex items-center gap-2">
 <Database className="text-primary" size={20} />
 ربط التطبيق مع السحابي
 </h4>
 <p className="text-sm text-gray-500">قم بإدخال بيانات إعدادات الخادم السحابي لتفعيل المزامنة السحابية الفورية.</p>
 </div>

 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">مفتاح API (API Key)</label>
 <input 
 value={formData['firebase_api_key'] || ''} 
 onChange={e => handleChange('firebase_api_key', e.target.value)} 
 type="text" 
 placeholder="AIzaSy..."
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>
 
 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">نطاق المصادقة (Auth Domain)</label>
 <input 
 value={formData['firebase_auth_domain'] || ''} 
 onChange={e => handleChange('firebase_auth_domain', e.target.value)} 
 type="text" 
 placeholder="app-name.firebaseapp.com"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>

 <div className="space-y-1.5 md:col-span-2">
 <label className="text-sm font-bold text-gray-700">رابط قاعدة البيانات (Database URL)</label>
 <input 
 value={formData['firebase_database_url'] || ''} 
 onChange={e => handleChange('firebase_database_url', e.target.value)} 
 type="url" 
 placeholder="https://app-name.firebaseio.com"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">معرف المشروع (Project ID)</label>
 <input 
 value={formData['firebase_project_id'] || ''} 
 onChange={e => handleChange('firebase_project_id', e.target.value)} 
 type="text" 
 placeholder="app-name"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">مساحة التخزين (Storage Bucket)</label>
 <input 
 value={formData['firebase_storage_bucket'] || ''} 
 onChange={e => handleChange('firebase_storage_bucket', e.target.value)} 
 type="text" 
 placeholder="app-name.firebasestorage.app"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">مرسل التنبيهات (Messaging Sender ID)</label>
 <input 
 value={formData['firebase_messaging_sender_id'] || ''} 
 onChange={e => handleChange('firebase_messaging_sender_id', e.target.value)} 
 type="text" 
 placeholder="1234567890"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">معرف التطبيق (App ID)</label>
 <input 
 value={formData['firebase_app_id'] || ''} 
 onChange={e => handleChange('firebase_app_id', e.target.value)} 
 type="text" 
 placeholder="1:1234567890:web:abcde"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-left font-mono text-sm" 
 dir="ltr"
 />
 </div>
 </div>

 <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
 <div className="w-full sm:w-auto">
 <div className="text-xs font-bold text-gray-500 mb-1">معرف الشركة الخاص بك (Company ID)</div>
 <code className="bg-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 font-mono" dir="ltr">
 {formData['company_id'] || 'سيتم التوليد تلقائياً...'}
 </code>
 </div>
 <div className="flex gap-3 w-full sm:w-auto">
 <button 
 onClick={testApiConnection}
 disabled={apiConnectionStatus === 'testing' || (!formData['firebase_project_id'] && !formData['firebase_database_url'])}
 className="flex-1 sm:flex-none bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors font-bold disabled:opacity-50"
 >
 {apiConnectionStatus === 'testing' ? 'جاري الفحص...' : 'فحص الاتصال'}
 </button>
 <button 
 onClick={handleSave} 
 className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-8 py-2.5 rounded-xl hover:bg-primary-light transition-colors font-bold shadow-md shadow-primary/20"
 >
 <Save size={18} />
 <span>حفظ الإعدادات</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'company' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
 <Building2 size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">بيانات الشركة</h2>
 <p className="text-gray-500 text-sm mt-1">تحديث معلومات الشركة، اللوجو، وتفاصيل التواصل المطبوعة على الفواتير.</p>
 </div>
 </div>

 <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm">
 <div className="relative group shrink-0">
 <div className="w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center border-2 border-dashed border-primary/30 cursor-pointer overflow-hidden shadow-sm group-hover:border-primary transition-colors">
 <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload('logo', e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="اختر شعار الشركة" />
 {formData['logo'] ? (
 <img src={formData['logo']} alt="Logo" className="w-full h-full object-contain p-2" />
 ) : (
 <div className="flex flex-col items-center text-primary/50 group-hover:text-primary transition-colors">
 <Upload size={32} className="mb-2" />
 <span className="text-xs font-bold">رفع الشعار</span>
 </div>
 )}
 </div>
 {formData['logo'] && (
 <button 
 onClick={() => handleChange('logo', '')} 
 className="absolute -top-3 -right-3 w-8 h-8 bg-white text-danger rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:bg-danger hover:text-white transition-colors z-20"
 title="حذف اللوجو"
 >
 <Trash2 size={14} />
 </button>
 )}
 </div>
 <div className="flex-1 space-y-2 text-center md:text-right">
 <h3 className="font-bold text-gray-800 text-lg">شعار الشركة (اللوجو)</h3>
 <p className="text-sm text-gray-500 leading-relaxed max-w-md">سيتم طباعة هذا الشعار على كافة الفواتير، التقارير والسندات في النظام. يُنصح باستخدام صورة بخلفية شفافة (PNG) وبأبعاد مربعة.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-sm font-bold text-gray-700">الاسم التجاري للشركة <span className="text-danger">*</span></label>
 <input value={formData['company_name'] || ''} onChange={e => handleChange('company_name', e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-lg font-bold text-gray-800" placeholder="مثال: شركة النور للتجارة العامة..." />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">الرقم الضريبي (إن وجد)</label>
 <input value={formData['tax_number'] || ''} onChange={e => handleChange('tax_number', e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold" />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">رقم الهاتف الأساسي</label>
 <input value={formData['phone'] || ''} onChange={e => handleChange('phone', e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold" dir="ltr" />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-bold text-gray-700">البريد الإلكتروني للتواصل</label>
 <input value={formData['email'] || ''} onChange={e => handleChange('email', e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold" dir="ltr" />
 </div>
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-sm font-bold text-gray-700">العنوان الكامل والتفصيلي</label>
 <textarea value={formData['address'] || ''} onChange={e => handleChange('address', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all h-24 resize-none font-bold" placeholder="المحافظة - المنطقة - الشارع - تفاصيل المبنى..." />
 </div>
 </div>

 <div className="flex justify-end">
 <button onClick={handleSave} className="flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-10 py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg">
 <Save size={20} />
 <span>تأكيد وحفظ البيانات</span>
 </button>
 </div>
 </div>
 )}

 {activeTab === 'backup' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
 <Database size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">النسخ الاحتياطي والأمان</h2>
 <p className="text-gray-500 text-sm mt-1">إدارة النسخ الاحتياطية وحماية قاعدة البيانات من الفقدان.</p>
 </div>
 </div>

 <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 flex items-start gap-5 shadow-sm">
 <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm shrink-0">
 <ShieldCheck size={28} />
 </div>
 <div>
 <h3 className="font-bold text-emerald-800 text-lg mb-2">حماية بياناتك هي أولويتنا</h3>
 <p className="text-sm text-emerald-700/80 leading-relaxed max-w-2xl">
 ننصح دائماً بأخذ نسخة احتياطية من قاعدة البيانات بشكل دوري وحفظها في مكان آمن (مثل قرص صلب خارجي أو المزامنة مع سحابة إلكترونية).
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="p-8 bg-white border border-gray-200 rounded-2xl space-y-5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group cursor-pointer relative overflow-hidden" onClick={async () => {
 try {
 await (window as any).api.settings.exportBackup();
 if (notifyDataBackup) {
 addNotification({
 text: 'تم أخذ نسخة احتياطية من النظام بنجاح',
 time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
 type: 'backup',
 is_read: false
 });
 }
 } catch (error) {
 console.error(error);
 }
 }}>
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors"></div>
 <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 relative z-10 group-hover:scale-110 transition-transform">
 <Download size={32} />
 </div>
 <div className="relative z-10">
 <h3 className="font-black text-gray-800 text-xl mb-2">تصدير نسخة احتياطية</h3>
 <p className="text-sm text-gray-500 leading-relaxed mb-6 h-10">
 قم بإنشاء نسخة من قاعدة البيانات الحالية بصيغة آمنة وحفظها على جهازك.
 </p>
 <button className="w-full py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
 بدء التصدير الآن
 </button>
 </div>
 </div>

 <div className="p-8 bg-white border border-gray-200 rounded-2xl space-y-5 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 transition-all group cursor-pointer relative overflow-hidden" onClick={async () => {
 try {
 const res = await (window as any).api.settings.importBackup();
 if (res.success) toast.success('تم استيراد النسخة بنجاح. سيتم إعادة تشغيل التطبيق.');
 } catch(e) {
 toast.error('حدث خطأ أثناء الاستيراد');
 }
 }}>
 <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 group-hover:bg-red-100 transition-colors"></div>
 <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-2 relative z-10 group-hover:scale-110 transition-transform">
 <Upload size={32} />
 </div>
 <div className="relative z-10">
 <h3 className="font-black text-gray-800 text-xl mb-2">استيراد نسخة احتياطية</h3>
 <p className="text-sm text-gray-500 leading-relaxed mb-6 h-10">
 استبدال قاعدة البيانات الحالية بنسخة تم حفظها مسبقاً. <span className="text-red-500 font-bold">(تحذير: سيمسح البيانات الحالية)</span>
 </p>
 <button className="w-full py-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold group-hover:bg-red-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
 بدء الاستيراد الآن
 </button>
 </div>
 </div>
 </div>

 <div className="pt-8 border-t border-gray-100">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
 <Database size={20} />
 </div>
 <h4 className="font-bold text-gray-800 text-lg">إعدادات النسخ الاحتياطي التلقائي</h4>
 </div>
 
 <div className="space-y-6 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
 <div className="flex items-center justify-between border-b border-gray-100 pb-6">
 <div>
 <h4 className="font-bold text-gray-800 text-lg">تفعيل النسخ الاحتياطي التلقائي للقرص</h4>
 <p className="text-sm text-gray-500 mt-1 max-w-md">حفظ نسخة تلقائية على مسار محدد في جهازك كل فترة زمنية معينة.</p>
 </div>
 <div onClick={() => handleChange('auto_backup_enabled', formData['auto_backup_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", formData['auto_backup_enabled'] === 'true' ? "bg-success" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md", formData['auto_backup_enabled'] === 'true' ? "left-1" : "right-1")}></div>
 </div>
 </div>

 {formData['auto_backup_enabled'] === 'true' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in pt-2">
 <div className="space-y-2 md:col-span-2">
 <label className="text-sm font-bold text-gray-700">مجلد التخزين (مسار الحفظ التلقائي)</label>
 <div className="flex gap-3">
 <input 
 type="text" 
 readOnly
 value={formData['auto_backup_path'] || ''} 
 placeholder="لم يتم تحديد مسار"
 className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none font-mono text-sm text-left text-gray-700" 
 dir="ltr"
 />
 <button 
 onClick={async () => {
 try {
 const res = await (window as any).api.settings.selectDirectory();
 if (res.success && res.filePath) {
 handleChange('auto_backup_path', res.filePath);
 }
 } catch(e) {
 console.error('Error selecting directory', e);
 }
 }}
 className="px-6 py-3.5 bg-gray-100 text-gray-700 border border-gray-200 hover:border-primary hover:text-primary rounded-xl font-bold text-sm transition-all whitespace-nowrap"
 >
 تحديد مسار
 </button>
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">التكرار الزمني</label>
 <select 
 value={formData['auto_backup_frequency'] || 'daily'} 
 onChange={e => handleChange('auto_backup_frequency', e.target.value)}
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-gray-700"
 >
 <option value="daily">يومياً (كل 24 ساعة)</option>
 <option value="weekly">أسبوعياً (كل 7 أيام)</option>
 <option value="monthly">شهرياً (كل 30 يوم)</option>
 </select>
 </div>
 
 <div className="flex items-end justify-end pt-4">
 <button onClick={handleSave} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold">
 <Save size={18} />
 <span>حفظ إعدادات النسخ التلقائي</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="pt-8 border-t border-gray-100">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
 <RefreshCw size={20} />
 </div>
 <h4 className="font-bold text-gray-800 text-lg">صيانة قاعدة البيانات المتقدمة</h4>
 </div>
 <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
 <div>
 <h5 className="font-black text-orange-800 text-lg mb-2">إعادة احتساب أرصدة العملاء والموردين الكلية</h5>
 <p className="text-sm text-orange-700/80 leading-relaxed max-w-2xl">
 يقوم هذا الإجراء بمراجعة كافة الفواتير والسندات من الصفر، وإعادة حساب الأرصدة الحالية لجميع الجهات لضمان الدقة المطلقة (يُستخدم فقط في حالة الاشتباه بوجود خلل في الرصيد).
 </p>
 </div>
 <button 
 onClick={async () => {
 if(window.confirm('هل أنت متأكد من رغبتك في إعادة احتساب الأرصدة لجميع الجهات؟ قد تستغرق هذه العملية بعض الوقت بناءً على حجم البيانات.')) {
 try {
 await (window as any).api.settings.recalculateBalances();
 toast.success('تمت إعادة احتساب الأرصدة وتصحيحها بنجاح!');
 } catch(e) {
 toast.error('حدث خطأ أثناء عملية الاحتساب');
 }
 }
 }}
 className="shrink-0 w-full md:w-auto px-8 py-3.5 bg-white text-orange-600 border border-orange-200 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <RefreshCw size={18} />
 بدء إعادة الاحتساب
 </button>
 </div>
 </div>

 <div className="pt-8 border-t border-gray-100">
 <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white rounded-lg shadow-sm">
 <Save size={20} className="text-gray-400" />
 </div>
 <div>
 <h4 className="font-bold text-gray-700">تاريخ النسخ الاحتياطي التلقائي الأخير</h4>
 <p className="text-xs text-gray-500 mt-0.5">آخر مرة تم فيها حفظ نسخة تلقائية.</p>
 </div>
 </div>
 <div className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl">
 {formData['last_backup_date'] ? (
 <p className="text-sm font-black text-gray-800" dir="ltr">{new Date(formData['last_backup_date']).toLocaleString('ar-EG')}</p>
 ) : (
 <p className="text-sm font-bold text-gray-400 italic">لا يوجد سجل حتى الآن.</p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'users' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
 <UsersIcon size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">إدارة المستخدمين والصلاحيات</h2>
 <p className="text-gray-500 text-sm mt-1">إضافة مستخدمين جدد، تعديل بياناتهم، وتخصيص صلاحيات الوصول بدقة.</p>
 </div>
 </div>

 <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-fit mb-8 shadow-inner">
 <button 
 onClick={() => setActiveUsersTab('list')}
 className={cn("flex items-center gap-2 px-8 py-2.5 rounded-xl transition-all duration-300 font-bold", activeUsersTab === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <UsersIcon size={18} />
 <span>قائمة المستخدمين</span>
 </button>
 <button 
 onClick={() => setActiveUsersTab('permissions')}
 className={cn("flex items-center gap-2 px-8 py-2.5 rounded-xl transition-all duration-300 font-bold", activeUsersTab === 'permissions' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <ShieldCheck size={18} />
 <span>صلاحيات النظام</span>
 </button>
 </div>

 {activeUsersTab === 'list' && (
 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
 <div>
 <h3 className="font-bold text-gray-800 text-lg">مستخدمي النظام</h3>
 <p className="text-sm text-gray-500">لديك {usersList.length} مستخدم مسجل</p>
 </div>
 <button 
 onClick={() => {
 setEditingUserId(null);
 setNewUser({ username: '', password: '', full_name: '', role: 'accountant', mobile_permission: 'full' });
 setIsUserModalOpen(true);
 }}
 className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-light transition-all flex items-center gap-2 shadow-md shadow-primary/20"
 >
 <Plus size={18} />
 إضافة مستخدم جديد
 </button>
 </div>

 <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
 <table className="w-full text-right">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="p-4 text-sm font-bold text-gray-600">الاسم الكامل</th>
 <th className="p-4 text-sm font-bold text-gray-600">اسم المستخدم (للدخول)</th>
 <th className="p-4 text-sm font-bold text-gray-600">الدور الوظيفي</th>
 <th className="p-4 text-sm font-bold text-gray-600">الحالة</th>
 <th className="p-4 text-sm font-bold text-gray-600 text-center">الإجراءات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {usersList.map((u) => (
 <tr key={u.id} className="hover:bg-gray-50 transition-colors">
 <td className="p-4 text-sm font-bold text-gray-800">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-black shadow-inner">
 {u.name?.charAt(0) || 'U'}
 </div>
 {u.name}
 </div>
 </td>
 <td className="p-4 text-sm font-mono text-gray-600 bg-gray-50/50">{u.username}</td>
 <td className="p-4 text-sm">
 <span className={cn(
 "px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border",
 u.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" : "bg-orange-50 text-orange-600 border-orange-200"
 )}>
 {u.role === 'admin' ? 'مدير نظام' : u.role === 'accountant' ? 'محاسب' : 'بائع'}
 </span>
 </td>
 <td className="p-4">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
 u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
 )}>
 <span className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-green-500" : "bg-red-500")}></span>
 {u.is_active ? 'نشط' : 'معطل'}
 </span>
 </td>
 <td className="p-4 text-center">
 <div className="flex items-center justify-center gap-2">
 <button 
 className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors border border-transparent hover:border-primary/20"
 title="تعديل المستخدم"
 onClick={() => {
 setEditingUserId(u.id);
 setNewUser({ username: u.username, password: '', full_name: u.name, role: u.role, mobile_permission: u.mobile_permission || 'full' });
 setIsUserModalOpen(true);
 }}
 >
 <Edit size={16} />
 </button>
 <button 
 className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors border border-transparent hover:border-danger/20"
 title="حذف المستخدم"
 onClick={() => {
 setConfirmAction({
 isOpen: true,
 title: 'حذف المستخدم',
 message: 'هل أنت متأكد من حذف هذا المستخدم؟',
 type: 'danger',
 onConfirm: async () => {
 try {
 await (window as any).api.users.delete(u.id);
 setUsersList(usersList.filter(user => user.id !== u.id));
 toast.success('تم حذف المستخدم بنجاح');
 } catch (err: any) {
 toast.error(err.message || 'حدث خطأ أثناء الحذف');
 }
 }
 });
 }}
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeUsersTab === 'permissions' && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm gap-4">
 <div>
 <h3 className="font-black text-blue-900 text-lg mb-2">إدارة صلاحيات النظام</h3>
 <p className="text-sm text-blue-800/80">تحكم دقيق بصلاحيات كل مستخدم في النظام لضمان الأمان والخصوصية لبياناتك.</p>
 </div>
 <button 
 onClick={() => {
 initializePermissions();
 toast.success('تم فحص النظام وتهيئة الصلاحيات بنجاح!');
 }}
 className="bg-white text-blue-700 border border-blue-200 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm w-full md:w-auto shrink-0"
 >
 تهيئة الصلاحيات المفقودة
 </button>
 </div>

 <div className="flex flex-wrap gap-4 mb-6">
 <button 
 onClick={() => setSelectedRole('admin')}
 className={cn("px-8 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 shadow-sm", selectedRole === 'admin' ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200 hover:border-primary/50")}
 >
 مدير النظام (Admin)
 </button>
 <button 
 onClick={() => setSelectedRole('accountant')}
 className={cn("px-8 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 shadow-sm", selectedRole === 'accountant' ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200 hover:border-primary/50")}
 >
 محاسب (Accountant)
 </button>
 <button 
 onClick={() => setSelectedRole('seller')}
 className={cn("px-8 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 shadow-sm", selectedRole === 'seller' ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-200 hover:border-primary/50")}
 >
 بائع (Seller)
 </button>
 </div>

 {selectedRole !== 'admin' && (
 <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200">
 <div className="flex-1 text-sm font-bold text-gray-600 flex items-center">أدوات مساعدة سريعة:</div>
 <button 
 onClick={() => {
 setRolePermissions(selectedRole, availablePermissions.map(p => p.id));
 toast.success('تم إعطاء صلاحيات كاملة للتطبيق');
 }}
 className="bg-white border border-primary text-primary px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-colors shadow-sm"
 >
 إعطاء صلاحيات كاملة
 </button>
 <button 
 onClick={() => {
 setRolePermissions(selectedRole, availablePermissions.filter(p => p.id.endsWith('.view')).map(p => p.id));
 toast.success('تم إعطاء صلاحيات عرض فقط');
 }}
 className="bg-white border border-indigo-400 text-indigo-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500 hover:text-white transition-colors shadow-sm"
 >
 صلاحيات عرض فقط
 </button>
 </div>
 )}

 <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
 {Object.entries(
 availablePermissions.reduce((acc, perm) => {
 if (!acc[perm.group]) acc[perm.group] = [];
 acc[perm.group].push(perm);
 return acc;
 }, {} as Record<string, typeof availablePermissions>)
 ).map(([group, permissions]) => (
 <div key={group} className="border-b border-gray-100 last:border-0">
 <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
 <div className="w-2 h-6 bg-primary rounded-full"></div>
 <h4 className="font-black text-gray-800">{group}</h4>
 </div>
 <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {permissions.map((perm) => (
 <div key={perm.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
 <span className="text-sm font-bold text-gray-700">{perm.name}</span>
 <div 
 onClick={() => toggleRolePermission(selectedRole, perm.id)} 
 className={cn(
 "w-12 h-6 rounded-full relative transition-colors cursor-pointer shadow-inner shrink-0", 
 (rolePermissions[selectedRole] || []).includes(perm.id) ? "bg-success" : "bg-gray-300",
 selectedRole === 'admin' && "opacity-50 cursor-not-allowed"
 )}
 >
 <div className={cn(
 "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", 
 (rolePermissions[selectedRole] || []).includes(perm.id) ? "left-1" : "right-1"
 )}></div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'design' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
 <Palette size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">التخصيص والتصميم</h2>
 <p className="text-gray-500 text-sm mt-1">تخصيص ألوان وتصميم الفواتير والتقارير والطباعة.</p>
 </div>
 </div>

 <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-fit mb-8 shadow-inner overflow-x-auto max-w-full">
 <button 
 onClick={() => setActiveDesignTab('sales')}
 className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold whitespace-nowrap shrink-0", activeDesignTab === 'sales' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <TrendingUp size={18} />
 <span>المبيعات</span>
 </button>
 <button 
 onClick={() => setActiveDesignTab('purchase')}
 className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold whitespace-nowrap shrink-0", activeDesignTab === 'purchase' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <ShoppingCart size={18} />
 <span>المشتريات</span>
 </button>
 <button 
 onClick={() => setActiveDesignTab('reports')}
 className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold whitespace-nowrap shrink-0", activeDesignTab === 'reports' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <FileText size={18} />
 <span>التقارير</span>
 </button>
 <button 
 onClick={() => setActiveDesignTab('treasury')}
 className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold whitespace-nowrap shrink-0", activeDesignTab === 'treasury' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <Landmark size={18} />
 <span>الخزينة</span>
 </button>
 <button 
 onClick={() => setActiveDesignTab('statement')}
 className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold whitespace-nowrap shrink-0", activeDesignTab === 'statement' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700")}
 >
 <FileText size={18} />
 <span>كشف حساب</span>
 </button>
 </div>

 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
 <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">
 <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
 {activeDesignTab === 'sales' ? 'تصميم فاتورة المبيعات' : activeDesignTab === 'purchase' ? 'تصميم فاتورة المشتريات' : activeDesignTab === 'reports' ? 'تصميم التقارير' : activeDesignTab === 'treasury' ? 'تصميم سند الخزينة' : 'تصميم كشف الحساب'}
 </h3>
 <button 
 onClick={() => setIsPreviewModalOpen(true)}
 className="px-6 py-2.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl font-bold hover:bg-purple-600 hover:text-white hover:border-transparent transition-all flex items-center gap-2 shadow-sm"
 >
 <Eye size={18} />
 معاينة التصميم
 </button>
 </div>

 <div className="flex flex-col sm:flex-row bg-gray-100 p-1.5 rounded-2xl mb-8 gap-1 shadow-inner">
 <button 
 onClick={() => handleChange(`${activeDesignTab}_template_type`, 'internal')}
 className={cn("flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300", formData[`${activeDesignTab}_template_type`] === 'internal' || !formData[`${activeDesignTab}_template_type`] ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-700 hover:bg-white/50")}
 >
 التصميم الداخلي (افتراضي)
 </button>
 <button
 onClick={() => {
 handleChange(`${activeDesignTab}_template_type`, 'pos');
 if (!formData[`${activeDesignTab}_pos_custom_html`]) {
 let defaultCode = '';
 if (activeDesignTab === 'sales') defaultCode = defaultSalesPosTemplate;
 else if (activeDesignTab === 'purchase') defaultCode = defaultPurchasePosTemplate;
 handleChange(`${activeDesignTab}_pos_custom_html`, defaultCode);
 }
 }}
 className={cn("flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300", formData[`${activeDesignTab}_template_type`] === 'pos' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-700 hover:bg-white/50")}
 >
 طباعة كاشير (80مم)
 </button>
 <button 
 onClick={() => handleChange(`${activeDesignTab}_template_type`, 'external')}
 className={cn("flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300", formData[`${activeDesignTab}_template_type`] === 'external' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-700 hover:bg-white/50")}
 >
 ورق مروس (ترويسة/تذييل)
 </button>
 <button 
 onClick={() => {
 handleChange(`${activeDesignTab}_template_type`, 'custom');
 if (!formData[`${activeDesignTab}_custom_html`]) {
 let defaultCode = '';
 if (activeDesignTab === 'sales') defaultCode = defaultSalesTemplate;
 else if (activeDesignTab === 'purchase') defaultCode = defaultPurchaseTemplate;
 else if (activeDesignTab === 'reports') defaultCode = defaultReportTemplate;
 else if (activeDesignTab === 'treasury') defaultCode = defaultTreasuryTemplate;
 else if (activeDesignTab === 'statement') defaultCode = defaultStatementTemplate;
 handleChange(`${activeDesignTab}_custom_html`, defaultCode);
 }
 }}
 className={cn("flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300", formData[`${activeDesignTab}_template_type`] === 'custom' ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-700 hover:bg-white/50")}
 >
 تصميم حر (HTML)
 </button>
 </div>

 <div className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
 <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
 <span>حجم الشعار / الترويسة</span>
 <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold">{formData[`${activeDesignTab}_logo_size`] || 120} بكسل</span>
 </label>
 <div className="flex items-center gap-6">
 <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">تصغير</span>
 <input 
 type="range" 
 min="20" max="300" step="5"
 value={formData[`${activeDesignTab}_logo_size`] || 120} 
 onChange={e => handleChange(`${activeDesignTab}_logo_size`, e.target.value)} 
 className="flex-1 accent-purple-500 h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
 />
 <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">تكبير</span>
 </div>
 </div>

 {(!formData[`${activeDesignTab}_template_type`] || formData[`${activeDesignTab}_template_type`] === 'internal') && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">اللون الأساسي للطباعة</label>
 <div className="flex gap-3 items-center w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white transition-all">
 <input 
 value={formData[`${activeDesignTab}_print_color`] || '#1E40AF'} 
 onChange={e => handleChange(`${activeDesignTab}_print_color`, e.target.value)} 
 type="color" 
 className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0" 
 />
 <input 
 value={formData[`${activeDesignTab}_print_color`] || '#1E40AF'} 
 onChange={e => handleChange(`${activeDesignTab}_print_color`, e.target.value)} 
 type="text" 
 className="flex-1 bg-transparent border-none outline-none font-mono text-lg font-bold text-gray-700" 
 dir="ltr"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">نص التذييل (ملاحظات الفاتورة/التقرير)</label>
 <textarea 
 value={formData[`${activeDesignTab}_footer_text`] || ''} 
 onChange={e => handleChange(`${activeDesignTab}_footer_text`, e.target.value)} 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all h-[76px] resize-none font-bold text-gray-700" 
 placeholder="أدخل النص الذي سيظهر في أسفل الصفحة..."
 />
 </div>
 
 <div className="md:col-span-2 flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
 <div>
 <h4 className="font-bold text-gray-800 text-lg">إظهار شعار الشركة</h4>
 <p className="text-sm text-gray-500 mt-1">عرض شعار الشركة في أعلى الورقة المطبوعة.</p>
 </div>
 <div onClick={() => handleChange('print_show_logo', formData['print_show_logo'] === 'true' ? 'false' : 'true')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", formData['print_show_logo'] === 'true' ? "bg-success" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", formData['print_show_logo'] === 'true' ? "left-1" : "right-1")}></div>
 </div>
 </div>
 </div>
 )}
 
 {formData[`${activeDesignTab}_template_type`] === 'external' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">صورة الترويسة (Header Image)</label>
 <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-6 text-center hover:bg-gray-100 hover:border-primary/50 transition-all relative group h-40 flex flex-col justify-center items-center">
 <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload(`${activeDesignTab}_header_image`, e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
 {formData[`${activeDesignTab}_header_image`] ? (
 <img src={formData[`${activeDesignTab}_header_image`]} alt="Header" className="h-full w-full object-contain" />
 ) : (
 <div className="text-gray-500 flex flex-col items-center">
 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all">
 <Upload size={24} />
 </div>
 <span className="text-sm font-bold">اضغط هنا لرفع صورة الترويسة</span>
 </div>
 )}
 </div>
 {formData[`${activeDesignTab}_header_image`] && (
 <div className="flex justify-end">
 <button onClick={() => handleChange(`${activeDesignTab}_header_image`, '')} className="text-danger text-sm hover:underline mt-1 font-bold">حذف الصورة</button>
 </div>
 )}
 </div>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">صورة التذييل (Footer Image)</label>
 <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-6 text-center hover:bg-gray-100 hover:border-primary/50 transition-all relative group h-40 flex flex-col justify-center items-center">
 <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload(`${activeDesignTab}_footer_image`, e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
 {formData[`${activeDesignTab}_footer_image`] ? (
 <img src={formData[`${activeDesignTab}_footer_image`]} alt="Footer" className="h-full w-full object-contain" />
 ) : (
 <div className="text-gray-500 flex flex-col items-center">
 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all">
 <Upload size={24} />
 </div>
 <span className="text-sm font-bold">اضغط هنا لرفع صورة التذييل</span>
 </div>
 )}
 </div>
 {formData[`${activeDesignTab}_footer_image`] && (
 <div className="flex justify-end">
 <button onClick={() => handleChange(`${activeDesignTab}_footer_image`, '')} className="text-danger text-sm hover:underline mt-1 font-bold">حذف الصورة</button>
 </div>
 )}
 </div>
 
 <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl text-sm text-blue-800 flex items-start gap-3 shadow-sm">
 <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
 <p className="leading-relaxed font-bold">
 <strong>ملاحظة هامة:</strong> عند تفعيل التصميم الخارجي (الورق المروس)، لن يتم طباعة شعار الشركة أو الألوان الخاصة بالنظام، بل سيتم دمج صور الترويسة والتذييل التي قمت برفعها مباشرة في أعلى وأسفل جدول البيانات المطبوع.
 </p>
 </div>
 </div>
 )}
 
 {formData[`${activeDesignTab}_template_type`] === 'custom' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 p-6 rounded-t-2xl gap-4">
 <div className="text-white">
 <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
 <Code size={20} className="text-purple-400" />
 محرر أكواد التصميم (HTML/CSS)
 </h4>
 <p className="text-sm text-gray-400">تحكم كامل بتصميم الفاتورة. استخدم المتغيرات مثل {"{{total}}"} ليتم استبدالها تلقائياً.</p>
 </div>
 <button
 onClick={handleRestoreDefaultTemplate}
 className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold text-sm transition-colors border border-white/10 whitespace-nowrap"
 >
 استعادة التصميم الافتراضي
 </button>
 </div>

 <textarea
 value={formData[`${activeDesignTab}_custom_html`] || ''}
 onChange={e => handleChange(`${activeDesignTab}_custom_html`, e.target.value)}
 className="w-full h-[500px] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-6 rounded-b-2xl outline-none focus:ring-2 focus:ring-purple-500/50 -mt-4 border-t-0 border border-gray-800 shadow-inner"
 dir="ltr"
 placeholder="<!-- قم بوضع كود HTML الخاص بك هنا، أو اضغط على (استعادة التصميم الافتراضي) للبدء بقالب احترافي جاهز -->"
 />
 </div>
 )}

 {formData[`${activeDesignTab}_template_type`] === 'pos' && (
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 p-6 rounded-t-2xl gap-4">
 <div className="text-white">
 <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
 <Code size={20} className="text-blue-400" />
 محرر أكواد طباعة الكاشير (HTML/CSS)
 </h4>
 <p className="text-sm text-gray-400">تحكم كامل بتصميم فاتورة الكاشير 80 مم. استخدم المتغيرات مثل {"{{total}}"} ليتم استبدالها تلقائياً.</p>
 </div>
 <button
 onClick={handleRestoreDefaultTemplate}
 className="px-5 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold text-sm transition-colors border border-white/10 whitespace-nowrap"
 >
 استعادة تصميم الكاشير
 </button>
 </div>

 <textarea
 value={formData[`${activeDesignTab}_pos_custom_html`] || ''}
 onChange={e => handleChange(`${activeDesignTab}_pos_custom_html`, e.target.value)}
 className="w-full h-[500px] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-6 rounded-b-2xl outline-none focus:ring-2 focus:ring-blue-500/50 -mt-4 border-t-0 border border-gray-800 shadow-inner"
 dir="ltr"
 placeholder="<!-- قم بوضع كود HTML الخاص بك هنا، أو اضغط على (استعادة تصميم الكاشير) للبدء بقالب احترافي جاهز -->"
 />
 </div>
 )}

 <div className="flex justify-end pt-8 border-t border-gray-100 mt-8">
 <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-10 py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold text-lg">
 <Save size={20} />
 <span>حفظ التغييرات</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'general' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
 <SettingsIcon size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">إعدادات عامة</h2>
 <p className="text-gray-500 text-sm mt-1">تكوين إعدادات النظام الأساسية والضرائب والمظهر.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
 <Moon size={24} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800">الوضع الليلي (Dark Mode)</h4>
 <p className="text-sm text-gray-500 mt-1 max-w-[200px]">تغيير مظهر التطبيق للوضع المظلم لراحة العين.</p>
 </div>
 </div>
 <div onClick={() => handleChange('theme', formData['theme'] === 'dark' ? 'light' : 'dark')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", formData['theme'] === 'dark' ? "bg-indigo-500" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", formData['theme'] === 'dark' ? "left-1" : "right-1")}></div>
 </div>
 </div>

 <div className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
 <Calculator size={24} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800">تفعيل الضريبة</h4>
 <p className="text-sm text-gray-500 mt-1 max-w-[200px]">تطبيق ضريبة القيمة المضافة على الفواتير.</p>
 </div>
 </div>
 <div onClick={() => handleChange('tax_enabled', formData['tax_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", formData['tax_enabled'] === 'true' ? "bg-emerald-500" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", formData['tax_enabled'] === 'true' ? "left-1" : "right-1")}></div>
 </div>
 </div>

 <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors gap-4">
 <div className="flex items-start gap-4 w-full sm:w-auto">
 <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
 <Bell size={24} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800">صوت الإشعارات</h4>
 <p className="text-sm text-gray-500 mt-1">تفعيل أو إيقاف صوت التنبيه عند وصول إشعار جديد.</p>
 </div>
 </div>
 <div className="flex items-center gap-6 w-full sm:w-auto justify-end">
 <button 
 onClick={(e) => { e.preventDefault(); testSound(); }}
 className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 hover:text-primary transition-colors flex items-center gap-2"
 >
 <Play size={16} />
 اختبار الصوت
 </button>
 <div onClick={() => setSoundEnabled(!soundEnabled)} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", soundEnabled ? "bg-amber-500" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", soundEnabled ? "left-1" : "right-1")}></div>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">نسبة الضريبة المضافة (%)</label>
 <div className="relative">
 <input 
 value={formData['tax_rate'] || ''} 
 onChange={e => handleChange('tax_rate', e.target.value)} 
 type="number" 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-lg font-bold text-gray-800 pl-12" 
 />
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">سعر صرف الدولار (مقابل الدينار)</label>
 <div className="relative">
 <input 
 value={formData['exchange_rate'] || ''} 
 onChange={e => handleChange('exchange_rate', e.target.value)} 
 type="number" 
 placeholder="مثال: 1500" 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-lg font-bold text-gray-800 pl-16" 
 />
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">IQD/$</span>
 </div>
 </div>
 </div>
 
 <div className="flex justify-end pt-8 border-t border-gray-100 mt-8">
 <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-10 py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold text-lg">
 <Save size={20} />
 <span>تأكيد وحفظ الإعدادات</span>
 </button>
 </div>
 </div>
 )}

 {activeTab === 'basic_data' && (
 <div className="space-y-8 animate-fade-in">
 {!activeBasicDataTab ? (
 <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm text-center relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32"></div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32"></div>
 
 <div className="relative z-10">
 <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white">
 <Box className="text-primary" size={48} />
 </div>
 <h3 className="text-3xl font-black text-gray-800 mb-3">البيانات الأساسية للنظام</h3>
 <p className="text-gray-500 mb-10 max-w-lg mx-auto text-lg">قم بإدارة التصنيفات، وحدات القياس، المخازن، وتصنيفات الخزينة من هنا لضمان تنظيم دقيق لبياناتك.</p>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <button onClick={() => openBasicDataTab('warehouses')} className="p-8 bg-white border border-gray-200 rounded-[1.5rem] font-bold hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
 <Box size={32} />
 </div>
 <span className="text-gray-800 group-hover:text-primary transition-colors text-lg">إدارة المخازن</span>
 </button>
 
 <button onClick={() => openBasicDataTab('categories')} className="p-8 bg-white border border-gray-200 rounded-[1.5rem] font-bold hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
 <List size={32} />
 </div>
 <span className="text-gray-800 group-hover:text-indigo-600 transition-colors text-lg">تصنيفات الأصناف</span>
 </button>
 
 <button onClick={() => openBasicDataTab('units')} className="p-8 bg-white border border-gray-200 rounded-[1.5rem] font-bold hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
 <Ruler size={32} />
 </div>
 <span className="text-gray-800 group-hover:text-emerald-600 transition-colors text-lg">وحدات القياس</span>
 </button>
 
 <button onClick={() => openBasicDataTab('treasury')} className="p-8 bg-white border border-gray-200 rounded-[1.5rem] font-bold hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all group flex flex-col items-center gap-4 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
 <Landmark size={32} />
 </div>
 <span className="text-gray-800 group-hover:text-amber-600 transition-colors text-lg">تصنيفات الخزينة</span>
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
 <div className="flex items-center gap-4">
 <button onClick={() => setActiveBasicDataTab(null)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 font-bold flex items-center gap-2">
 <ArrowRight size={18} />
 عودة للقائمة
 </button>
 <h3 className="font-black text-gray-800 text-xl border-r-2 border-primary pr-4">
 {activeBasicDataTab === 'warehouses' ? 'إدارة المخازن' : activeBasicDataTab === 'categories' ? 'تصنيفات الأصناف' : activeBasicDataTab === 'units' ? 'وحدات القياس' : 'تصنيفات الخزينة'}
 </h3>
 </div>
 <button 
 onClick={() => setIsBasicDataModalOpen(true)}
 className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
 >
 <Plus size={18} />
 إضافة عنصر جديد
 </button>
 </div>
 
 <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
 <table className="w-full text-right">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="p-4 text-sm font-bold text-gray-600 w-1/3">الاسم</th>
 {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && <th className="p-4 text-sm font-bold text-gray-600">{activeBasicDataTab === 'categories' ? 'الوصف' : 'الموقع'}</th>}
 {activeBasicDataTab === 'treasury' && <th className="p-4 text-sm font-bold text-gray-600">النوع</th>}
 <th className="p-4 text-sm font-bold text-gray-600 w-24 text-center">إجراء</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {basicDataList.map((item) => (
 <tr key={item.id} className="hover:bg-gray-50 transition-colors">
 <td className="p-4 font-bold text-gray-800">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-primary/50"></div>
 {item.name}
 </div>
 </td>
 {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && <td className="p-4 text-sm text-gray-500">{item.description || item.location || <span className="text-gray-300 italic">لا يوجد</span>}</td>}
 {activeBasicDataTab === 'treasury' && (
 <td className="p-4 text-sm">
 <span className={cn(
 "px-3 py-1 rounded-lg text-xs font-bold shadow-sm border",
 item.type === 'income' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
 )}>
 {item.type === 'income' ? 'إيراد' : 'مصروف'}
 </span>
 {item.is_system ? <span className="mr-2 text-xs text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">نظامي</span> : null}
 </td>
 )}
 <td className="p-4 text-center">
 {!item.is_system ? (
 <button onClick={() => handleDeleteBasicData(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200" title="حذف">
 <Trash2 size={18} />
 </button>
 ) : (
 <span className="text-gray-300 text-xs font-bold" title="لا يمكن حذف عنصر أساسي في النظام">غير متاح</span>
 )}
 </td>
 </tr>
 ))}
 {basicDataList.length === 0 && (
 <tr>
 <td colSpan={4} className="p-12 text-center text-gray-500 italic bg-gray-50/50">
 <div className="flex flex-col items-center gap-3">
 <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center">
 <Box size={32} />
 </div>
 <span>لا توجد بيانات مسجلة حالياً</span>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'financial_year' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
 <Landmark size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">إعدادات السنة المالية</h2>
 <p className="text-gray-500 text-sm mt-1">تحديد فترات السنة المالية وإغلاق الحسابات وإدارة الجرد المخزني.</p>
 </div>
 </div>

 <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mt-16"></div>
 <div className="relative z-10">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
 <Calendar size={28} />
 </div>
 <div>
 <h3 className="text-xl font-black text-gray-800">تحديد السنة المالية</h3>
 <p className="text-gray-500 text-sm mt-1">حدد تاريخ بداية ونهاية السنة المالية لشركتك لضبط التقارير.</p>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">تاريخ البداية</label>
 <input 
 type="date" 
 value={formData.financial_year_start || ''}
 onChange={e => handleChange('financial_year_start', e.target.value)}
 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-gray-700">تاريخ النهاية المتوقع</label>
 <input 
 type="date" 
 value={formData.financial_year_end || ''}
 onChange={e => handleChange('financial_year_end', e.target.value)}
 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
 />
 </div>
 </div>
 <div className="flex justify-end pt-6 border-t border-gray-100">
 <button onClick={handleCloseFiscalYear} className="px-8 py-3.5 rounded-xl bg-white border-2 border-indigo-600 text-indigo-700 font-bold hover:bg-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">
 <Lock size={18} />
 إغلاق السنة الحسابية الحالية و تدوير الأرصدة
 </button>
 </div>
 </div>
 </div>

 <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
 <div className="relative z-10">
 <div className="flex items-center gap-4 mb-6 border-b border-amber-200/50 pb-6">
 <div className="p-4 bg-white/50 rounded-2xl text-amber-600 shadow-sm">
 <Box size={28} />
 </div>
 <div>
 <h3 className="text-xl font-black text-amber-900">أداة الجرد المخزني</h3>
 <p className="text-amber-700/80 text-sm mt-1">إجراء عمليات الجرد الفعلي ومطابقة الأرصدة وإصدار التسويات.</p>
 </div>
 </div>
 
 <p className="text-sm font-bold text-amber-800 mb-8 leading-relaxed max-w-3xl">
 تساعدك هذه الأداة المتخصصة على عمل جرد فعلي للمخزون وتسوية أي فروقات قد تظهر بين الرصيد الدفتري المسجل في النظام والرصيد الفعلي المتوفر في المخزن. سيقوم النظام تلقائياً بإنشاء سندات تسوية (بالزيادة أو النقصان) لضبط المخزون.
 </p>
 <div className="flex justify-end">
 <button onClick={() => setIsStocktakeModalOpen(true)} className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all hover:shadow-lg hover:shadow-amber-500/30 flex items-center gap-2">
 <ClipboardCheck size={20} />
 بدء عملية جرد مخزني جديدة
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'server' && <ServerSettingsTab />}

 {activeTab === 'about' && (
 <div className="space-y-8 animate-fade-in text-center py-12">
 <div className="relative inline-block">
 <div className="w-48 h-48 mx-auto flex items-center justify-center drop-shadow-2xl mb-8 relative">
 <div className="absolute inset-0 bg-white rounded-full shadow-lg border-4 border-white overflow-hidden">
 <img src={appLogo} alt="شعار النظام" className="w-full h-full object-contain p-4" />
 </div>
 </div>
 </div>
 
 <div>
 <h2 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">برنامج المخزون برو</h2>
 <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">النظام المحاسبي الأذكى لإدارة المخزون والمبيعات والحسابات بكل احترافية وسهولة.</p>
 </div>
 
 <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 mt-10 relative overflow-hidden text-right">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
 
 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white rounded-xl shadow-sm text-gray-500"><Info size={20} /></div>
 <span className="font-bold text-gray-600">إصدار النظام</span>
 </div>
 <span className="font-black text-primary text-lg bg-primary/10 px-3 py-1 rounded-lg">v1.0.5</span>
 </div>
 
 <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-gray-100 rounded-xl text-gray-500"><Calendar size={20} /></div>
 <span className="font-bold text-gray-600">تاريخ الإصدار</span>
 </div>
 <span className="font-bold text-gray-800">2026</span>
 </div>
 
 <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-gray-100 rounded-xl text-gray-500"><Code size={20} /></div>
 <span className="font-bold text-gray-600">التطوير والبرمجة</span>
 </div>
 <span className="font-bold text-gray-800">المطور برو</span>
 </div>
 
 <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500"><MessageCircle size={20} /></div>
 <span className="font-bold text-blue-800">الدعم الفني المباشر</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-blue-900 text-lg" dir="ltr">07844112111</span>
 <a href="https://wa.me/9647844112111" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white p-2.5 rounded-xl hover:scale-110 hover:shadow-lg hover:shadow-[#25D366]/30 transition-all" title="تواصل معنا عبر واتساب">
 <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
 </svg>
 </a>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'subscriptions' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
 <ShieldCheck size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">حالة التفعيل والاشتراك</h2>
 <p className="text-gray-500 text-sm mt-1">إدارة رخصة استخدام النظام وتفاصيل الاشتراك الخاصة بك.</p>
 </div>
 </div>
 
 <div className={cn(
 "p-8 rounded-3xl border shadow-sm relative overflow-hidden transition-all duration-300",
 isActivated ? "bg-white border-emerald-100 hover:shadow-emerald-500/10" : "bg-red-50/50 border-red-200"
 )}>
 {isActivated && (
 <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -ml-32 -mt-32 pointer-events-none"></div>
 )}
 
 <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
 <div className={cn(
 "w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-bold text-white shadow-xl shrink-0 transition-transform hover:scale-105",
 isActivated ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30" : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30"
 )}>
 {isActivated ? <ShieldCheck size={40} /> : <Info size={40} />}
 </div>
 
 <div className="flex-1 text-center md:text-right">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
 <h3 className={cn("font-black text-2xl", isActivated ? "text-emerald-800" : "text-red-800")}>
 {isActivated ? 'النظام مفعل ويعمل بكفاءة' : 'النظام غير مفعل حالياً'}
 </h3>
 {isActivated && (
 <button 
 onClick={() => {
 setConfirmAction({
 isOpen: true,
 title: 'تأكيد إلغاء التفعيل',
 message: 'هل أنت متأكد من إلغاء التفعيل المحلي الحالي؟ ستحتاج لإدخال الكود مرة أخرى ليعمل النظام.',
 type: 'danger',
 onConfirm: () => {
 useLicenseStore.getState().deactivateSystem();
 window.location.reload();
 }
 });
 }}
 className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-xl transition-all text-sm font-bold shadow-sm"
 >
 إلغاء تنشيط الرخصة
 </button>
 )}
 </div>
 
 <p className={cn("text-lg font-bold", isActivated ? "text-emerald-600/80" : "text-red-600/80")}>
 نوع الرخصة: {activationType === 'lifetime' ? 'رخصة مدى الحياة' 
 : activationType === '1_year' ? 'اشتراك سنوي'
 : activationType === '1_month' ? 'اشتراك شهري'
 : activationType === '14_days' ? 'نسخة تجريبية 14 يوم'
 : 'يرجى تفعيل النظام للتمتع بكافة الميزات'}
 </p>
 </div>
 </div>

 {isActivated && expiryDate && activationType !== 'lifetime' && (
 <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
 <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
 <Calendar size={24} />
 </div>
 <div>
 <span className="text-sm font-bold text-gray-500 block mb-1">تاريخ انتهاء الصلاحية</span>
 <span className="font-black text-gray-800 text-lg" dir="ltr">
 {new Date(expiryDate).toLocaleDateString('ar-EG', { 
 year: 'numeric', month: 'long', day: 'numeric' 
 })}
 </span>
 </div>
 </div>
 
 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-colors">
 <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
 <Clock size={24} />
 </div>
 <div>
 <span className="text-sm font-bold text-gray-500 block mb-1">المدة المتبقية للاشتراك</span>
 <span className="font-black text-primary text-xl">
 {Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} <span className="text-base font-bold text-gray-600">يوم</span>
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 
 {(!isActivated || activationType === '14_days') && (
 <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 text-center relative overflow-hidden shadow-sm">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full pointer-events-none"></div>
 <div className="relative z-10">
 <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm text-indigo-600 flex items-center justify-center mb-4">
 <Key size={32} />
 </div>
 <h4 className="text-2xl font-black text-indigo-900 mb-2">قم بترقية اشتراكك الآن</h4>
 <p className="text-indigo-700 mb-8 max-w-lg mx-auto">قم بإدخال رمز التفعيل الخاص بك للحصول على جميع مميزات النظام والتمتع بتحديثات مستمرة ودعم فني متميز.</p>
 <button 
 onClick={() => {
 toast.info('اضغط على زر التفعيل في الشريط العلوي (أيقونة الدرع)، أو أعد تحميل الصفحة إذا كان مخفياً.', {
 position: "top-center",
 autoClose: 5000,
 hideProgressBar: false,
 closeOnClick: true,
 pauseOnHover: true,
 draggable: true,
 progress: undefined,
 theme: "colored",
 });
 }}
 className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
 >
 اضغط هنا لمعرفة طريقة التفعيل
 </button>
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'bot' && (
 <div className="space-y-8 animate-fade-in">
 <div className="p-8 bg-gradient-to-br from-[#0088cc]/10 to-indigo-50 rounded-[2rem] border border-[#0088cc]/20 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden shadow-sm">
 <div className="absolute top-0 right-0 w-64 h-64 bg-[#0088cc]/10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
 
 <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#0088cc] to-blue-600 text-white flex items-center justify-center shadow-lg shadow-[#0088cc]/30 shrink-0 relative z-10">
 <MessageCircle size={40} />
 </div>
 <div className="relative z-10 text-center md:text-right flex-1">
 <h3 className="font-black text-2xl text-[#0088cc] mb-2">إعدادات بوت تيليجرام (Telegram Bot)</h3>
 <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
 قم بربط النظام ببوت تيليجرام الخاص بك للحصول على التقارير المالية والمخزنية من أي مكان وعبر أوامر بسيطة وبكل أمان وسرعة.
 </p>
 </div>
 </div>

 <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm space-y-8">
 <div className="flex items-center justify-between pb-6 border-b border-gray-100">
 <div className="flex items-center gap-4">
 <div className={cn("p-3 rounded-xl", formData['telegram_bot_enabled'] === 'true' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>
 <SettingsIcon size={24} />
 </div>
 <div>
 <h4 className="font-bold text-gray-800 text-xl">تفعيل البوت</h4>
 <p className="text-sm text-gray-500 mt-1">السماح للبوت بالاتصال والعمل مع النظام.</p>
 </div>
 </div>
 <div onClick={() => handleChange('telegram_bot_enabled', formData['telegram_bot_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors shadow-inner", formData['telegram_bot_enabled'] === 'true' ? "bg-[#0088cc]" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow", formData['telegram_bot_enabled'] === 'true' ? "left-1" : "right-1")}></div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-8">
 <div className="space-y-3">
 <label className="text-sm font-bold text-gray-700">رمز الشركة (Company ID)</label>
 <div className="flex items-center gap-3">
 <div className="relative flex-1">
 <input 
 value={formData['company_id'] || 'سيتم توليده تلقائياً...'} 
 readOnly
 type="text" 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-12 outline-none text-left font-mono font-bold text-gray-700 focus:bg-white transition-colors" dir="ltr" 
 />
 <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
 </div>
 <button 
 type="button"
 onClick={() => {
 navigator.clipboard.writeText(formData['company_id'] || '');
 toast.success('تم نسخ رمز الشركة بنجاح');
 }}
 className="bg-[#0088cc] text-white whitespace-nowrap px-6 py-4 rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-[#0088cc]/30 transition-all font-bold flex items-center gap-2"
 >
 <Copy size={18} />
 نسخ الرمز
 </button>
 </div>
 <p className="text-sm text-gray-500">يُستخدم هذا الرمز لربط حساب تيليجرام الخاص بك ببيانات هذه الشركة فقط بأمان تام.</p>
 </div>

 <div className="space-y-3">
 <label className="text-sm font-bold text-gray-700">رمز البوت (Bot Token)</label>
 <div className="relative">
 <input 
 value={formData['telegram_bot_token'] || ''} 
 onChange={e => handleChange('telegram_bot_token', e.target.value)} 
 type="text" 
 placeholder="مثال: 123456789:ABCDefghIJKlmNoPQRsTUVwxyZ"
 className="w-full bg-white border border-gray-200 rounded-xl p-4 pl-12 outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] text-left font-mono transition-all" dir="ltr" 
 />
 <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
 </div>
 <p className="text-sm text-gray-500">يتم الحصول عليه من <a href="https://t.me/BotFather" target="_blank" className="text-[#0088cc] font-bold hover:underline">@BotFather</a> في تيليجرام.</p>
 </div>

 <div className="space-y-3">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 معرف المحادثة (Chat ID) 
 <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-normal">اختياري - لزيادة الأمان</span>
 </label>
 <div className="relative">
 <input 
 value={formData['telegram_chat_id'] || ''} 
 onChange={e => handleChange('telegram_chat_id', e.target.value)} 
 type="text" 
 placeholder="مثال: 12345678"
 className="w-full bg-white border border-gray-200 rounded-xl p-4 pl-12 outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] text-left font-mono transition-all" dir="ltr" 
 />
 <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
 </div>
 <p className="text-sm text-gray-500">لتحديد من يمكنه طلب التقارير بصرامة. إذا تركته فارغاً، فأي شخص لديه البوت يمكنه الاستعلام.</p>
 </div>
 </div>

 <div className="mt-10 pt-8 border-t border-gray-100">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <FileText size={20} />
 </div>
 <h4 className="font-black text-gray-800 text-xl">التقارير المسموح للبوت بإرسالها</h4>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { key: 'telegram_sales_report', label: 'تقرير المبيعات اليومي', command: '/sales' },
 { key: 'telegram_income_statement', label: 'قائمة الدخل اليومية', command: '/income' },
 { key: 'telegram_purchases_report', label: 'تقرير المشتريات اليومي', command: '/purchases' },
 { key: 'telegram_inventory_movement', label: 'حركة المخزون', command: '/inventory' },
 { key: 'telegram_customer_balances', label: 'أرصدة العملاء', command: '/customers' },
 { key: 'telegram_balance_sheet', label: 'الميزانية العمومية', command: '/balancesheet' },
 { key: 'telegram_purchase_prices', label: 'كشف تغيير الأسعار', command: null },
 ].map(report => (
 <div key={report.key} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-5 rounded-2xl border border-gray-100 transition-colors">
 <div>
 <span className="font-bold text-gray-800 block mb-1">{report.label}</span>
 {report.command && <span className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-0.5 rounded" dir="ltr">{report.command}</span>}
 </div>
 <div onClick={() => handleChange(report.key, formData[report.key] === 'true' ? 'false' : 'true')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner", formData[report.key] === 'true' ? "bg-emerald-500" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow", formData[report.key] === 'true' ? "left-1" : "right-1")}></div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-4">
 <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088cc] to-blue-600 text-white px-10 py-4 rounded-xl hover:shadow-lg hover:shadow-[#0088cc]/30 hover:-translate-y-0.5 transition-all font-bold text-lg">
 <Save size={20} />
 <span>حفظ إعدادات البوت بنجاح</span>
 </button>
 </div>
 </div>
 )}

 {activeTab === 'updates' && (
 <div className="space-y-8 animate-fade-in">
 <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
 <RefreshCw size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-gray-800">تحديثات النظام</h2>
 <p className="text-gray-500 text-sm mt-1">احصل على أحدث الميزات والإصلاحات الأمنية بكل سهولة.</p>
 </div>
 </div>

 <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-200 transition-colors">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
 <Zap size={24} />
 </div>
 <div>
 <h4 className="font-bold text-xl text-gray-800 mb-1">التحديث التلقائي للنظام</h4>
 <p className="text-sm text-gray-500 max-w-md">السماح للنظام بالبحث عن تحديثات وتثبيتها تلقائياً عند توفرها للحصول على أداء مثالي دائماً.</p>
 </div>
 </div>
 <div onClick={toggleAutoUpdate} className={cn("w-16 h-8 rounded-full relative cursor-pointer transition-colors shadow-inner shrink-0", autoUpdateEnabled ? "bg-emerald-500" : "bg-gray-300")}>
 <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow", autoUpdateEnabled ? "left-1" : "right-1")}></div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center transition-all hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="relative z-10 w-full flex flex-col items-center">
 <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
 <Download size={48} />
 </div>
 <h4 className="font-black text-2xl text-gray-800 mb-3">تحديث عبر الإنترنت</h4>
 <p className="text-gray-500 mb-8 max-w-xs">بحث مباشر عن أحدث التحديثات وتنزيلها وتثبيتها بنقرة واحدة.</p>
 <button onClick={() => startUpdateProcess('internet')} className="bg-blue-500 text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-all font-bold w-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
 <Download size={20} />
 البحث عن تحديثات الآن
 </button>
 </div>
 </div>

 <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center transition-all hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 group relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <div className="relative z-10 w-full flex flex-col items-center">
 <div className="w-24 h-24 bg-purple-50 text-purple-500 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
 <Upload size={48} />
 </div>
 <h4 className="font-black text-2xl text-gray-800 mb-3">تحديث عبر الكمبيوتر (محلي)</h4>
 <p className="text-gray-500 mb-8 max-w-xs">اختر ملف التحديث الذي قمت بتحميله مسبقاً (.zip) لتثبيته يدوياً.</p>
 <button 
 onClick={() => startUpdateProcess('local')}
 className="bg-white text-purple-600 border-2 border-purple-200 px-8 py-3.5 rounded-xl hover:bg-purple-50 transition-all font-bold w-full hover:border-purple-600 flex items-center justify-center gap-2 text-lg">
 <FolderUp size={20} />
 اختيار ملف التحديث
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <Modal isOpen={isUserModalOpen} onClose={() => { setIsUserModalOpen(false); setEditingUserId(null); }} title={editingUserId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}>
 <div className="p-6">
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16} className="text-primary"/> الاسم الكامل</label>
 <input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} type="text" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm" placeholder="أدخل الاسم الكامل" />
 </div>
 
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16} className="text-primary"/> اسم المستخدم</label>
 <input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} type="text" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm" disabled={!!editingUserId} placeholder="أدخل اسم المستخدم" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Key size={16} className="text-primary"/> كلمة المرور {editingUserId && <span className="text-xs text-text-muted font-normal">(اتركها فارغة إذا لا تريد التغيير)</span>}</label>
 <input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} type="password" placeholder="••••••••" className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm" />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><ShieldCheck size={16} className="text-primary"/> الصلاحية</label>
 <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm appearance-none cursor-pointer">
 <option value="admin">مدير نظام</option>
 <option value="accountant">محاسب</option>
 <option value="sales">بائع</option>
 </select>
 </div>
 
 <div className="space-y-3 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
 <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
 <SettingsIcon size={18} className="text-blue-500" />
 صلاحيات تطبيق الموبايل
 </label>
 <div className="flex gap-4">
 <button 
 onClick={() => setNewUser({...newUser, mobile_permission: 'full'})}
 className={cn("flex-1 py-4 px-4 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 shadow-sm", newUser.mobile_permission === 'full' ? "border-blue-500 bg-white text-blue-600 shadow-blue-500/20" : "border-transparent bg-white text-gray-500 hover:border-blue-200")}
 >
 <ShieldCheck size={18} />
 صلاحيات كاملة للتطبيق
 </button>
 <button 
 onClick={() => setNewUser({...newUser, mobile_permission: 'view_only'})}
 className={cn("flex-1 py-4 px-4 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 shadow-sm", newUser.mobile_permission === 'view_only' ? "border-red-500 bg-white text-red-600 shadow-red-500/20" : "border-transparent bg-white text-gray-500 hover:border-red-200")}
 >
 <Eye size={18} />
 صلاحيات عرض فقط
 </button>
 </div>
 <p className="text-xs text-blue-600/70 mt-2 font-medium">تطبق هذه الصلاحية على تطبيق الهاتف المحمول (Android/iOS) الخاص بهذا المستخدم.</p>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-100">
 <button onClick={() => setIsUserModalOpen(false)} className="px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 font-bold transition-colors">إلغاء</button>
 <button onClick={handleCreateUser} className="px-8 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold flex items-center gap-2">
 <Save size={20} />
 حفظ المستخدم
 </button>
 </div>
 </div>
 </Modal>

 <Modal isOpen={isBasicDataModalOpen} onClose={() => setIsBasicDataModalOpen(false)} title={`إضافة ${activeBasicDataTab === 'warehouses' ? 'مخزن' : activeBasicDataTab === 'categories' ? 'تصنيف أصناف' : activeBasicDataTab === 'units' ? 'وحدة قياس' : 'تصنيف خزينة'}`}>
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 <Edit size={16} className="text-primary"/>
 الاسم
 </label>
 <input value={newBasicDataName} onChange={e => setNewBasicDataName(e.target.value)} type="text" placeholder="أدخل الاسم هنا..." className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm text-lg" />
 </div>

 {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && (
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 <FileText size={16} className="text-primary"/>
 {activeBasicDataTab === 'categories' ? 'الوصف (اختياري)' : 'الموقع (اختياري)'}
 </label>
 <input value={newBasicDataDesc} onChange={e => setNewBasicDataDesc(e.target.value)} type="text" placeholder="أدخل تفاصيل إضافية..." className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm" />
 </div>
 )}
 
 {activeBasicDataTab === 'treasury' && (
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 <RefreshCw size={16} className="text-primary"/>
 النوع
 </label>
 <select value={newTreasuryType} onChange={e => setNewTreasuryType(e.target.value)} className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm appearance-none cursor-pointer">
 <option value="income">إيرادات</option>
 <option value="expense">مصروفات</option>
 </select>
 </div>
 )}

 <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
 <button onClick={() => setIsBasicDataModalOpen(false)} className="px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 font-bold transition-colors">إلغاء</button>
 <button onClick={handleCreateBasicData} className="px-8 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold flex items-center gap-2">
 <Plus size={20} />
 حفظ
 </button>
 </div>
 </div>
 </Modal>

 <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={`معاينة - ${activeDesignTab === 'sales' ? 'المبيعات' : activeDesignTab === 'purchase' ? 'المشتريات' : 'التقارير'}`} size="xl">
 <div className="space-y-4">
 <div className="bg-white p-8 rounded-xl border border-border shadow-sm min-h-[400px]">
 {formData[`${activeDesignTab}_template_type`] === 'pos' ? (
 <div className="flex justify-center">
 <div 
 dangerouslySetInnerHTML={{ 
 __html: (() => {
 let html = formData[`${activeDesignTab}_pos_custom_html`] || (activeDesignTab === 'sales' ? defaultSalesPosTemplate : defaultPurchasePosTemplate);
 
 // Process {{#if ...}} ... {{/if}} conditionals
 const processConditional = (variableName: string, hasValue: boolean) => {
 const regex = new RegExp(`\\{\\{#if ${variableName}\\}\\}(.*?)\\{\\{/if\\}\\}`, 'gs');
 html = html.replace(regex, hasValue ? '$1' : '');
 };
 
 processConditional('company_address', !!formData['address']);
 processConditional('company_phone', !!formData['phone']);
 processConditional('tax_amount', true); // Always show in preview
 processConditional('paid_amount', true); // Always show in preview
 processConditional('remaining_amount', true); // Always show in preview
 processConditional('party_phone', true); // Always show in preview
 
 // Replace all variables
 html = html
 .replaceAll('{{company_name}}', formData['company_name'] || 'اسم الشركة التجريبي')
 .replaceAll('{{company_address}}', formData['address'] || 'عنوان الشركة، شارع ١٢٣')
 .replaceAll('{{company_phone}}', formData['phone'] || '0123456789')
 .replaceAll('{{tax_number_html}}', formData['tax_number'] ? `<p style="margin: 1mm 0; font-size: 10px; color: #000;">الرقم الضريبي: ${formData['tax_number']}</p>` : '')
 .replaceAll('{{pos_logo_img}}', formData['print_show_logo'] !== 'false' && formData['logo'] ? `<div style="width: 40px; height: 40px; border: 2px solid #000; border-radius: 50%; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;"><img src="${formData['logo']}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : '')
 .replaceAll('{{invoice_number}}', 'INV-2026-0001')
 .replaceAll('{{date}}', '2026-01-01 10:30')
 .replaceAll('{{party_name}}', 'عميل / مورد افتراضي')
 .replaceAll('{{party_phone}}', '0500000000')
 .replaceAll('{{subtotal}}', '1,000.00')
 .replaceAll('{{tax_amount}}', '150.00')
 .replaceAll('{{tax_rate}}', '15')
 .replaceAll('{{total}}', '1,150.00')
 .replaceAll('{{paid_amount}}', '1,000.00')
 .replaceAll('{{remaining_amount}}', '150.00')
 .replaceAll('{{items_table_rows}}', `
 <tr style="border-bottom: 1px solid #000000;">
 <td style="padding: 2mm 0; text-align: right; font-size: 10px; color: #000000;">صنف تجريبي رقم ١</td>
 <td style="padding: 2mm 0; text-align: center; font-size: 10px; color: #000000;">2</td>
 <td style="padding: 2mm 0; text-align: center; font-size: 10px; color: #000000;">500.00</td>
 <td style="padding: 2mm 0; text-align: center; font-size: 10px; font-weight: 700; color: #000000;">1,000.00</td>
 </tr>
 `)
 .replaceAll('{{current_timestamp}}', new Date().toLocaleString('ar-IQ'));
 
 return html;
 })()
 }} 
 />
 </div>
 ) : formData[`${activeDesignTab}_template_type`] === 'custom' ? (
 <div 
 dangerouslySetInnerHTML={{ 
 __html: (formData[`${activeDesignTab}_custom_html`] || '')
 .replaceAll('{{company_name}}', formData['company_name'] || 'اسم الشركة التجريبي')
 .replaceAll('{{company_address}}', formData['address'] || 'عنوان الشركة، شارع ١٢٣')
 .replaceAll('{{company_phone}}', formData['phone'] || '0123456789')
 .replaceAll('{{tax_number_html}}', formData['tax_number'] ? `<p style="margin: 5px 0 0; color: #000; font-size: 14px;">الرقم الضريبي: ${formData['tax_number']}</p>` : '')
 .replaceAll('{{logo_img}}', formData['print_show_logo'] !== 'false' && formData['logo'] ? `<img src="${formData['logo']}" style="height: ${formData[`${activeDesignTab}_logo_size`] || 60}px; object-fit: contain;" />` : '')
 .replaceAll('{{invoice_type_label}}', activeDesignTab === 'sales' ? 'فاتورة مبيعات' : activeDesignTab === 'purchase' ? 'فاتورة مشتريات' : 'تقرير')
 .replaceAll('{{invoice_number}}', 'INV-2026-0001')
 .replaceAll('{{date}}', '2026-01-01')
 .replaceAll('{{start_date}}', '2026-01-01')
 .replaceAll('{{end_date}}', '2026-12-31')
 .replaceAll('{{party_title}}', activeDesignTab === 'purchase' ? 'بيانات المورد' : 'بيانات العميل')
 .replaceAll('{{party_name}}', 'عميل / مورد افتراضي')
 .replaceAll('{{party_contact_html}}', '<div style="text-align: left; color: #000; font-size: 14px;"><p style="margin: 0;">هاتف: 0500000000</p></div>')
 .replaceAll('{{report_title}}', 'اسم التقرير (مثال: تقرير المبيعات)')
 .replaceAll('{{report_content}}', '<div style="padding: 20px; text-align: center; color: #000; border: 2px dashed #000; padding: 15px;">جداول ومحتويات التقرير ستظهر هنا...</div>')
 .replaceAll('{{subtotal}}', '1,000.00')
 .replaceAll('{{tax_amount}}', '150.00')
 .replaceAll('{{total}}', '1,150.00')
 .replaceAll('{{items_table_rows}}', `
 <tr style="border-bottom: 1px solid #000;">
 <td style="padding: 12px; font-weight: bold;">صنف تجريبي رقم ١</td>
 <td style="padding: 12px; text-align: center;">2</td>
 <td style="padding: 12px; text-align: center;">500.00</td>
 <td style="padding: 12px; text-align: center;">1,000.00</td>
 </tr>
 `)
 .replaceAll('{{footer_text_html}}', formData[`${activeDesignTab}_footer_text`] ? `<div style="margin-top: 30px; text-align: center; font-size: 14px; color: #000; border: 1px solid #000; padding: 15px;">${formData[`${activeDesignTab}_footer_text`]}</div>` : '')
 }} 
 />
 ) : formData[`${activeDesignTab}_template_type`] === 'external' ? (
 <div className="space-y-8 flex flex-col items-center">
 {formData[`${activeDesignTab}_header_image`] ? (
 <img src={formData[`${activeDesignTab}_header_image`]} alt="Header" className="w-full object-contain" style={{ height: `${formData[`${activeDesignTab}_logo_size`] || 60}px` }} />
 ) : (
 <div className="w-full h-32 bg-white border-2 border-dashed border-black flex items-center justify-center text-black">صورة الترويسة غير متوفرة</div>
 )}
 
 <div className="w-full py-8 border-y-2 border-dashed border-black text-center text-black">
 <p className="font-bold mb-2">مساحة محتوى الفاتورة أو التقرير</p>
 <p className="text-sm">هنا ستظهر جداول الأصناف أو التقارير المالية</p>
 </div>
 
 {formData[`${activeDesignTab}_footer_image`] ? (
 <img src={formData[`${activeDesignTab}_footer_image`]} alt="Footer" className="w-full object-contain" />
 ) : (
 <div className="w-full h-32 bg-white border-2 border-dashed border-black flex items-center justify-center text-black">صورة التذييل غير متوفرة</div>
 )}
 </div>
 ) : (
 <div>
 <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
 <div className="flex items-center gap-4">
 {formData['print_show_logo'] === 'true' && formData['logo'] && (
 <img src={formData['logo']} alt="Logo" className="object-contain" style={{ height: `${formData[`${activeDesignTab}_logo_size`] || 60}px` }} />
 )}
 <div>
 <h1 className="text-3xl font-bold mb-2" style={{ color: '#000' }}>اسم الشركة الافتراضي</h1>
 <p className="text-sm" style={{ color: '#000' }}>العنوان - الهاتف - الرقم الضريبي</p>
 </div>
 </div>
 <div className="p-4" style={{ backgroundColor: '#fff', border: '2px solid #000' }}>
 <h2 className="text-2xl font-bold mb-2 border-b pb-2" style={{ color: '#000', borderColor: '#000' }}>
 {activeDesignTab === 'sales' ? 'فاتورة مبيعات ضريبية' : activeDesignTab === 'purchase' ? 'فاتورة مشتريات' : 'تقرير مالي'}
 </h2>
 <p className="text-sm" style={{ color: '#000' }}>التاريخ: 2026-01-01</p>
 </div>
 </div>
 <table className="w-full mb-8 border-collapse">
 <thead>
 <tr style={{ backgroundColor: '#fff', color: '#000', borderBottom: '2px solid #000' }}>
 <th className="border border-black p-2 text-right">الصنف</th>
 <th className="border border-black p-2 text-center">الكمية</th>
 <th className="border border-black p-2 text-center">السعر</th>
 <th className="border border-black p-2 text-center">الإجمالي</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td className="border border-black p-2">صنف تجريبي 1</td>
 <td className="border border-black p-2 text-center">1</td>
 <td className="border border-black p-2 text-center">150</td>
 <td className="border border-black p-2 text-center">150</td>
 </tr>
 <tr>
 <td className="border border-black p-2">صنف تجريبي 2</td>
 <td className="border border-black p-2 text-center">2</td>
 <td className="border border-black p-2 text-center">50</td>
 <td className="border border-black p-2 text-center">100</td>
 </tr>
 </tbody>
 </table>
 {formData[`${activeDesignTab}_footer_text`] && (
 <div className="mt-8 text-center text-sm font-bold p-4 border border-black" style={{ color: '#000' }}>
 {formData[`${activeDesignTab}_footer_text`]}
 </div>
 )}
 </div>
 )}
 </div>
 <div className="flex justify-end pt-4 border-t border-border mt-4">
 <button onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إغلاق المعاينة</button>
 </div>
 </div>
 </Modal>

 <ConfirmModal
 isOpen={confirmAction?.isOpen || false}
 title={confirmAction?.title || ''}
 message={confirmAction?.message || ''}
 type={confirmAction?.type || 'danger'}
 onConfirm={() => {
 if (confirmAction?.onConfirm) confirmAction.onConfirm();
 setConfirmAction(null);
 }}
 onCancel={() => setConfirmAction(null)}
 />

 <StocktakeModal 
 isOpen={isStocktakeModalOpen}
 onClose={() => setIsStocktakeModalOpen(false)}
 />

 <Modal isOpen={isUpdateModalOpen} onClose={() => {}} title={updateStatus === 'completed' ? "اكتمل التحديث" : "جاري تحديث النظام"}>
 <div className="p-10 flex flex-col items-center justify-center text-center">
 {updateStatus === 'completed' ? (
 <div className="animate-fade-in flex flex-col items-center">
 <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/30 transform rotate-3 hover:rotate-6 transition-all">
 <ShieldCheck className="text-white" size={48} />
 </div>
 <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">تم التحديث بنجاح</h3>
 <p className="text-gray-500 mb-8 max-w-sm text-lg leading-relaxed">تم تحميل وتثبيت التحديث الجديد بنجاح. يرجى إعادة تشغيل النظام لتطبيق التحديثات والاستمتاع بالميزات الجديدة.</p>
 <button 
 onClick={() => {
 (window as any).api.updater.installUpdate();
 }}
 className="bg-gradient-to-r from-primary to-primary-light text-white px-10 py-4 rounded-2xl font-bold w-full shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-3"
 >
 <RefreshCw size={24} className="animate-spin-slow" />
 إعادة تشغيل النظام الآن
 </button>
 </div>
 ) : (
 <div className="w-full flex flex-col items-center">
 <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/30 animate-pulse">
 <Download className="text-white animate-bounce" size={48} />
 </div>
 <h3 className="text-2xl font-black text-gray-800 mb-6 tracking-tight">جاري تنزيل التحديثات...</h3>
 
 <div className="w-full bg-gray-100 rounded-full h-6 mb-3 overflow-hidden border border-gray-200/50 shadow-inner relative">
 <div 
 className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 relative overflow-hidden" 
 style={{ width: `${updateProgress}%` }}
 >
 <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
 </div>
 </div>
 <div className="flex justify-between w-full text-sm font-bold text-gray-500 px-2">
 <span>{updateProgress.toFixed(0)}%</span>
 <span className="text-primary animate-pulse">يرجى الانتظار</span>
 </div>
 </div>
 )}
 </div>
 </Modal>
 </div>
 );
};

export default Settings;
