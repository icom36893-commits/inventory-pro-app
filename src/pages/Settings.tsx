import React, { useState, useEffect } from 'react';
import { 
  Building2, 
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
  RefreshCw
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useSettingsStore, useLicenseStore, useNotificationStore } from '../store';
import { usePermissionsStore } from '../store/permissions';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { defaultSalesTemplate } from '../templates/defaultSales';
import { defaultPurchaseTemplate } from '../templates/defaultPurchase';
import { defaultReportTemplate } from '../templates/defaultReport';
import { defaultTreasuryTemplate } from '../templates/defaultTreasury';
import { defaultStatementTemplate } from '../templates/defaultStatement';
import StocktakeModal from '../components/stocktake/StocktakeModal';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
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
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'accountant' });
  const [activeUsersTab, setActiveUsersTab] = useState<'list' | 'permissions'>('list');
  const [selectedRole, setSelectedRole] = useState<string>('accountant');
  
  // Stocktake state
  const [isStocktakeModalOpen, setIsStocktakeModalOpen] = useState(false);
  
  // Update state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(localStorage.getItem('autoUpdateEnabled') === 'true');

  const toggleAutoUpdate = () => {
    const newValue = !autoUpdateEnabled;
    setAutoUpdateEnabled(newValue);
    localStorage.setItem('autoUpdateEnabled', String(newValue));
  };

  const { availablePermissions, rolePermissions, toggleRolePermission, initializePermissions } = usePermissionsStore();

  // Basic Data State
  const [activeBasicDataTab, setActiveBasicDataTab] = useState<string | null>(null);
  const [basicDataList, setBasicDataList] = useState<any[]>([]);
  const [isBasicDataModalOpen, setIsBasicDataModalOpen] = useState(false);
  const [newBasicDataName, setNewBasicDataName] = useState('');
  const [newBasicDataDesc, setNewBasicDataDesc] = useState('');
  const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '/logo.png?v=3');
  const [newTreasuryType, setNewTreasuryType] = useState('income');

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
      setIsUpdateModalOpen(true);
      setUpdateStatus('downloading');
      setUpdateProgress(0);

      (window as any).api.updater.onUpdateProgress((progress: any) => {
        setUpdateProgress(Math.round(progress.percent));
      });

      (window as any).api.updater.onUpdateDownloaded(() => {
        setUpdateStatus('completed');
      });

      (window as any).api.updater.onError((error: string) => {
        toast.error('حدث خطأ: ' + error);
        setIsUpdateModalOpen(false);
      });

      (window as any).api.updater.onUpdateNotAvailable(() => {
        toast.info('نظامك محدث إلى أحدث نسخة.');
        setIsUpdateModalOpen(false);
      });

      await (window as any).api.updater.checkForUpdates();
    }
  };

  useEffect(() => {
    fetchSettings();
    loadUsers();
  }, [fetchSettings]);

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
      setNewUser({ username: '', password: '', full_name: '', role: 'accountant' });
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
    if (activeDesignTab === 'sales') defaultCode = defaultSalesTemplate;
    else if (activeDesignTab === 'purchase') defaultCode = defaultPurchaseTemplate;
    else if (activeDesignTab === 'reports') defaultCode = defaultReportTemplate;
    else if (activeDesignTab === 'treasury') defaultCode = defaultTreasuryTemplate;
    else if (activeDesignTab === 'statement') defaultCode = defaultStatementTemplate;

    handleChange(`${activeDesignTab}_custom_html`, defaultCode);
    toast.success('تم استعادة التصميم الافتراضي. لا تنس حفظ التغييرات.');
  };

  const tabs = [
    { id: 'company', label: 'بيانات الشركة', icon: <Building2 size={18} /> },
    { id: 'general', label: 'إعدادات عامة', icon: <SettingsIcon size={18} /> },
    { id: 'basic_data', label: 'البيانات الأساسية', icon: <Box size={18} /> },
    { id: 'design', label: 'تخصيص وتصميم', icon: <Palette size={18} /> },
    { id: 'users', label: 'المستخدمين', icon: <UsersIcon size={18} /> },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: <Database size={18} /> },
    { id: 'subscriptions', label: 'تفاصيل الاشتراك', icon: <ShieldCheck size={18} /> },
    { id: 'bot', label: 'إعدادات البوت', icon: <MessageCircle size={18} /> },
    { id: 'updates', label: 'التحديثات', icon: <RefreshCw size={18} /> },
    { id: 'financial_year', label: 'السنة الحسابية', icon: <Landmark size={18} /> },
    { id: 'about', label: 'حول التطبيق', icon: <Info size={18} /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">إعدادات النظام</h1>
        <p className="text-text-muted text-sm">تخصيص النظام، إدارة المستخدمين، والنسخ الاحتياطي.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 w-full p-4 rounded-2xl transition-all font-bold text-sm",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg" 
                  : "bg-white text-text-muted hover:bg-bg-main border border-border"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-border p-8 shadow-sm">
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-2xl bg-bg-main flex items-center justify-center border-2 border-dashed border-border cursor-pointer hover:bg-border transition-colors relative group overflow-hidden">
                  <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload('logo', e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {formData['logo'] ? (
                    <img src={formData['logo']} alt="Logo" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <Upload className="text-text-muted" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">لوجو الشركة</h3>
                  <p className="text-xs text-text-muted">اضغط لرفع صورة اللوجو (يفضل بصيغة PNG)</p>
                  {formData['logo'] && (
                    <button onClick={() => handleChange('logo', '')} className="text-danger text-xs hover:underline mt-1 font-bold">حذف اللوجو</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-text-muted">اسم الشركة</label>
                  <input value={formData['company_name'] || ''} onChange={e => handleChange('company_name', e.target.value)} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-text-muted">الرقم الضريبي</label>
                  <input value={formData['tax_number'] || ''} onChange={e => handleChange('tax_number', e.target.value)} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-text-muted">الهاتف</label>
                  <input value={formData['phone'] || ''} onChange={e => handleChange('phone', e.target.value)} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-text-muted">البريد الإلكتروني</label>
                  <input value={formData['email'] || ''} onChange={e => handleChange('email', e.target.value)} type="email" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-bold text-text-muted">العنوان</label>
                  <textarea value={formData['address'] || ''} onChange={e => handleChange('address', e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 h-24" />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-border">
                <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg font-bold">
                  <Save size={18} />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-8">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex items-start gap-4">
                <ShieldCheck className="text-primary mt-1" size={32} />
                <div>
                  <h3 className="font-bold text-primary mb-1">حماية بياناتك هي أولويتنا</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    ننصح دائماً بأخذ نسخة احتياطية من قاعدة البيانات بشكل دوري وحفظها في مكان آمن (مثل قرص صلب خارجي أو سحابة إلكترونية).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-border rounded-3xl space-y-4 hover:border-primary transition-colors group cursor-pointer" onClick={async () => {
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
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success mb-2">
                    <Download size={24} />
                  </div>
                  <h3 className="font-bold text-text-primary">تصدير نسخة احتياطية</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    قم بإنشاء نسخة من قاعدة البيانات الحالية وحفظها على جهازك.
                  </p>
                  <button className="w-full py-3 bg-success text-white rounded-xl font-bold hover:bg-success/90 transition-all shadow-md group-hover:scale-105">
                    بدء التصدير الآن
                  </button>
                </div>

                <div className="p-6 bg-white border border-border rounded-3xl space-y-4 hover:border-danger transition-colors group cursor-pointer" onClick={async () => {
                  try {
                    const res = await (window as any).api.settings.importBackup();
                    if (res.success) toast.success('تم استيراد النسخة بنجاح. سيتم إعادة تشغيل التطبيق.');
                  } catch(e) {
                    toast.error('حدث خطأ أثناء الاستيراد');
                  }
                }}>
                  <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger mb-2">
                    <Upload size={24} />
                  </div>
                  <h3 className="font-bold text-text-primary">استيراد نسخة احتياطية</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    استبدال قاعدة البيانات الحالية بنسخة تم حفظها مسبقاً. (سيؤدي هذا لمسح البيانات الحالية!)
                  </p>
                  <button className="w-full py-3 bg-danger text-white rounded-xl font-bold hover:bg-danger/90 transition-all shadow-md group-hover:scale-105">
                    بدء الاستيراد الآن
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <h4 className="font-bold text-text-primary mb-4">إعدادات النسخ الاحتياطي التلقائي (Google Drive)</h4>
                
                <div className="space-y-6 bg-bg-main p-6 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-border pb-6">
                    <div>
                      <h4 className="font-bold text-text-primary">تفعيل النسخ الاحتياطي التلقائي</h4>
                      <p className="text-xs text-text-muted mt-1">تفعيل أو تعطيل ميزة النسخ الاحتياطي التلقائي.</p>
                    </div>
                    <div onClick={() => handleChange('auto_backup_enabled', formData['auto_backup_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", formData['auto_backup_enabled'] === 'true' ? "bg-primary" : "bg-border")}>
                       <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData['auto_backup_enabled'] === 'true' ? "left-1" : "right-1")}></div>
                    </div>
                  </div>

                  {formData['auto_backup_enabled'] === 'true' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-muted">مجلد التخزين (Google Drive)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly
                            value={formData['auto_backup_path'] || ''} 
                            placeholder="لم يتم تحديد مسار"
                            className="flex-1 bg-white border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono text-left" 
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
                            className="px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-light transition-colors whitespace-nowrap"
                          >
                            تحديد مسار
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-muted">التكرار الزمني</label>
                        <select 
                          value={formData['auto_backup_frequency'] || 'daily'} 
                          onChange={e => handleChange('auto_backup_frequency', e.target.value)}
                          className="w-full bg-white border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                        >
                          <option value="daily">يومي</option>
                          <option value="weekly">أسبوعي</option>
                          <option value="monthly">شهري</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2 pt-4 flex justify-end">
                        <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-light transition-all shadow-md font-bold text-sm">
                          <Save size={16} />
                          <span>حفظ إعدادات النسخ التلقائي</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <h4 className="font-bold text-text-primary mb-4">تاريخ النسخ الاحتياطي التلقائي الأخير</h4>
                <div className="bg-bg-main p-4 rounded-2xl text-center">
                  {formData['last_backup_date'] ? (
                    <p className="text-sm font-bold text-primary" dir="ltr">{new Date(formData['last_backup_date']).toLocaleString('ar-EG')}</p>
                  ) : (
                    <p className="text-sm text-text-muted italic">لا يوجد سجل عمليات نسخ احتياطي سابقة.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex bg-white p-1 rounded-2xl border border-border w-fit mb-6">
                <button 
                  onClick={() => setActiveUsersTab('list')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeUsersTab === 'list' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <UsersIcon size={18} />
                  <span>قائمة المستخدمين</span>
                </button>
                <button 
                  onClick={() => setActiveUsersTab('permissions')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeUsersTab === 'permissions' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <ShieldCheck size={18} />
                  <span>صلاحيات المستخدمين</span>
                </button>
              </div>

              {activeUsersTab === 'list' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-text-primary text-lg">إدارة المستخدمين</h3>
                    <button 
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUser({ username: '', password: '', full_name: '', role: 'accountant' });
                        setIsUserModalOpen(true);
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-light transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      إضافة مستخدم جديد
                    </button>
                  </div>

              <div className="overflow-hidden border border-border rounded-2xl">
                <table className="w-full text-right">
                  <thead className="bg-bg-main">
                    <tr>
                      <th className="p-4 text-xs font-bold text-text-muted">الاسم الكامل</th>
                      <th className="p-4 text-xs font-bold text-text-muted">اسم المستخدم</th>
                      <th className="p-4 text-xs font-bold text-text-muted">الصلاحية</th>
                      <th className="p-4 text-xs font-bold text-text-muted">الحالة</th>
                      <th className="p-4 text-xs font-bold text-text-muted w-16 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-bg-main/50 transition-colors">
                        <td className="p-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            {u.name}
                          </div>
                        </td>
                        <td className="p-4 text-sm font-mono">{u.username}</td>
                        <td className="p-4 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold",
                            u.role === 'admin' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          )}>
                            {u.role === 'admin' ? 'مدير نظام' : u.role === 'accountant' ? 'محاسب' : 'بائع'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full ml-2",
                            u.is_active ? "bg-success" : "bg-danger"
                          )}></span>
                          <span className="text-xs">{u.is_active ? 'نشط' : 'معطل'}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="تعديل المستخدم"
                              onClick={() => {
                              setEditingUserId(u.id);
                              setNewUser({ username: u.username, password: '', full_name: u.name, role: u.role });
                              setIsUserModalOpen(true);
                            }}
                          >
                            <Edit size={16} />
                            </button>
                            <button 
                              className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
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
              </>
              )}

              {activeUsersTab === 'permissions' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <div>
                      <h3 className="font-bold text-primary text-lg mb-2">إدارة صلاحيات النظام</h3>
                      <p className="text-sm text-text-muted">تحكم دقيق بصلاحيات كل مستخدم في النظام لضمان الأمان.</p>
                    </div>
                    <button 
                      onClick={() => {
                        initializePermissions();
                        toast.success('تم فحص النظام وتهيئة الصلاحيات بنجاح!');
                      }}
                      className="bg-white text-primary border border-primary px-6 py-2 rounded-xl font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      تهيئة الصلاحيات المفقودة
                    </button>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setSelectedRole('admin')}
                      className={cn("px-6 py-3 rounded-xl font-bold text-sm border transition-colors", selectedRole === 'admin' ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/50")}
                    >
                      مدير النظام
                    </button>
                    <button 
                      onClick={() => setSelectedRole('accountant')}
                      className={cn("px-6 py-3 rounded-xl font-bold text-sm border transition-colors", selectedRole === 'accountant' ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/50")}
                    >
                      محاسب
                    </button>
                    <button 
                      onClick={() => setSelectedRole('seller')}
                      className={cn("px-6 py-3 rounded-xl font-bold text-sm border transition-colors", selectedRole === 'seller' ? "bg-primary text-white border-primary" : "bg-white text-text-muted border-border hover:border-primary/50")}
                    >
                      بائع
                    </button>
                  </div>

                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                    {Object.entries(
                      availablePermissions.reduce((acc, perm) => {
                        if (!acc[perm.group]) acc[perm.group] = [];
                        acc[perm.group].push(perm);
                        return acc;
                      }, {} as Record<string, typeof availablePermissions>)
                    ).map(([group, permissions]) => (
                      <div key={group} className="border-b border-border last:border-0">
                        <div className="bg-bg-main px-6 py-3 border-b border-border">
                          <h4 className="font-bold text-text-primary text-sm">{group}</h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {permissions.map((perm) => (
                            <div key={perm.id} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-text-primary">{perm.name}</span>
                              <div 
                                onClick={() => toggleRolePermission(selectedRole, perm.id)} 
                                className={cn(
                                  "w-11 h-6 rounded-full relative transition-colors cursor-pointer", 
                                  (rolePermissions[selectedRole] || []).includes(perm.id) ? "bg-success" : "bg-border",
                                  selectedRole === 'admin' && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", 
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
            <div className="space-y-6">
              <div className="flex bg-white p-1 rounded-2xl border border-border w-fit mb-6">
                <button 
                  onClick={() => setActiveDesignTab('sales')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeDesignTab === 'sales' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <TrendingUp size={18} />
                  <span>المبيعات</span>
                </button>
                <button 
                  onClick={() => setActiveDesignTab('purchase')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeDesignTab === 'purchase' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <ShoppingCart size={18} />
                  <span>المشتريات</span>
                </button>
                <button 
                  onClick={() => setActiveDesignTab('reports')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeDesignTab === 'reports' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <FileText size={18} />
                  <span>التقارير</span>
                </button>
                <button 
                  onClick={() => setActiveDesignTab('treasury')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeDesignTab === 'treasury' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <Landmark size={18} />
                  <span>الخزينة</span>
                </button>
                <button 
                  onClick={() => setActiveDesignTab('statement')}
                  className={cn("flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold", activeDesignTab === 'statement' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main")}
                >
                  <FileText size={18} />
                  <span>كشف حساب</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-text-primary text-lg">
                    {activeDesignTab === 'sales' ? 'تصميم فاتورة المبيعات' : activeDesignTab === 'purchase' ? 'تصميم فاتورة المشتريات' : activeDesignTab === 'reports' ? 'تصميم التقارير' : activeDesignTab === 'treasury' ? 'تصميم سند الخزينة' : 'تصميم كشف الحساب'}
                  </h3>
                  <button 
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="px-4 py-2 bg-bg-main text-primary rounded-xl font-bold hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    <Eye size={18} />
                    معاينة التصميم
                  </button>
                </div>

                <div className="flex bg-bg-main p-1 rounded-2xl mb-6">
                  <button 
                    onClick={() => handleChange(`${activeDesignTab}_template_type`, 'internal')}
                    className={cn("flex-1 py-2 rounded-xl font-bold text-sm transition-all", formData[`${activeDesignTab}_template_type`] === 'internal' || !formData[`${activeDesignTab}_template_type`] ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary")}
                  >
                    التصميم الداخلي (افتراضي)
                  </button>
                  <button 
                    onClick={() => handleChange(`${activeDesignTab}_template_type`, 'external')}
                    className={cn("flex-1 py-2 rounded-xl font-bold text-sm transition-all", formData[`${activeDesignTab}_template_type`] === 'external' ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary")}
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
                    className={cn("flex-1 py-2 rounded-xl font-bold text-sm transition-all", formData[`${activeDesignTab}_template_type`] === 'custom' ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text-primary")}
                  >
                    تصميم حر (HTML مخصص)
                  </button>
                </div>

                <div className="mb-6 p-4 bg-bg-main rounded-2xl border border-border space-y-2">
                  <label className="text-sm font-bold text-text-primary flex justify-between">
                    <span>تغيير حجم قياس اللوجو / الترويسة</span>
                    <span className="text-primary">{formData[`${activeDesignTab}_logo_size`] || 60} بكسل</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted">تصغير</span>
                    <input 
                      type="range" 
                      min="20" max="300" step="5"
                      value={formData[`${activeDesignTab}_logo_size`] || 60} 
                      onChange={e => handleChange(`${activeDesignTab}_logo_size`, e.target.value)} 
                      className="flex-1 accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-text-muted">تكبير</span>
                  </div>
                </div>


                {(!formData[`${activeDesignTab}_template_type`] || formData[`${activeDesignTab}_template_type`] === 'internal') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-text-muted">اللون الأساسي</label>
                      <div className="flex gap-2 items-center w-full bg-bg-main rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20">
                        <input 
                          value={formData[`${activeDesignTab}_print_color`] || '#1E40AF'} 
                          onChange={e => handleChange(`${activeDesignTab}_print_color`, e.target.value)} 
                          type="color" 
                          className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" 
                        />
                        <input 
                          value={formData[`${activeDesignTab}_print_color`] || '#1E40AF'} 
                          onChange={e => handleChange(`${activeDesignTab}_print_color`, e.target.value)} 
                          type="text" 
                          className="flex-1 bg-transparent border-none outline-none font-mono text-sm" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-text-muted">نص التذييل (الفوتر)</label>
                      <textarea 
                        value={formData[`${activeDesignTab}_footer_text`] || ''} 
                        onChange={e => handleChange(`${activeDesignTab}_footer_text`, e.target.value)} 
                        className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 h-24" 
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between p-4 bg-bg-main rounded-2xl">
                      <div>
                        <h4 className="font-bold text-text-primary">إظهار اللوجو</h4>
                        <p className="text-xs text-text-muted">إظهار شعار الشركة في أعلى الورقة.</p>
                      </div>
                      <div onClick={() => handleChange('print_show_logo', formData['print_show_logo'] === 'true' ? 'false' : 'true')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", formData['print_show_logo'] === 'true' ? "bg-primary" : "bg-border")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData['print_show_logo'] === 'true' ? "left-1" : "right-1")}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData[`${activeDesignTab}_template_type`] === 'external' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-muted">صورة الترويسة (Header Image)</label>
                      <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:bg-bg-main transition-colors relative group">
                        <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload(`${activeDesignTab}_header_image`, e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {formData[`${activeDesignTab}_header_image`] ? (
                          <img src={formData[`${activeDesignTab}_header_image`]} alt="Header" className="h-20 mx-auto object-contain" />
                        ) : (
                          <div className="text-text-muted py-4">
                            <Upload className="mx-auto mb-2" size={24} />
                            <span className="text-sm">اضغط لرفع صورة الترويسة</span>
                          </div>
                        )}
                      </div>
                      {formData[`${activeDesignTab}_header_image`] && (
                        <button onClick={() => handleChange(`${activeDesignTab}_header_image`, '')} className="text-danger text-xs hover:underline mt-1 font-bold">حذف الترويسة</button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-muted">صورة التذييل (Footer Image)</label>
                      <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:bg-bg-main transition-colors relative group">
                        <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleImageUpload(`${activeDesignTab}_footer_image`, e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {formData[`${activeDesignTab}_footer_image`] ? (
                          <img src={formData[`${activeDesignTab}_footer_image`]} alt="Footer" className="h-20 mx-auto object-contain" />
                        ) : (
                          <div className="text-text-muted py-4">
                            <Upload className="mx-auto mb-2" size={24} />
                            <span className="text-sm">اضغط لرفع صورة التذييل</span>
                          </div>
                        )}
                      </div>
                      {formData[`${activeDesignTab}_footer_image`] && (
                        <button onClick={() => handleChange(`${activeDesignTab}_footer_image`, '')} className="text-danger text-xs hover:underline mt-1 font-bold">حذف التذييل</button>
                      )}
                    </div>
                    <div className="md:col-span-2 bg-primary/5 p-4 rounded-xl text-sm text-primary">
                      <strong>ملاحظة هامة:</strong> عند تفعيل التصميم الخارجي، لن يتم طباعة شعار الشركة أو الألوان الخاصة بالنظام، بل سيتم دمج صور الترويسة والتذييل التي قمت برفعها مباشرة مع جدول الفاتورة.
                    </div>
                  </div>
                )}
                
                {formData[`${activeDesignTab}_template_type`] === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-primary mb-1">محرر أكواد التصميم (HTML/CSS)</h4>
                        <p className="text-sm text-text-muted">تحكم كامل بتصميم الفاتورة. استخدم المتغيرات مثل {"{{total}}"} ليتم استبدالها تلقائياً.</p>
                      </div>
                      <button 
                        onClick={handleRestoreDefaultTemplate}
                        className="px-4 py-2 bg-white text-danger border border-danger/20 rounded-xl font-bold text-sm hover:bg-danger hover:text-white transition-colors"
                      >
                        استعادة التصميم الافتراضي الاحترافي
                      </button>
                    </div>
                    
                    <textarea 
                      value={formData[`${activeDesignTab}_custom_html`] || ''} 
                      onChange={e => handleChange(`${activeDesignTab}_custom_html`, e.target.value)} 
                      className="w-full h-96 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-6 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                      dir="ltr"
                      placeholder="<!-- قم بوضع كود HTML الخاص بك هنا، أو اضغط على (استعادة التصميم الافتراضي) للبدء بقالب احترافي جاهز -->"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-6 border-t border-border mt-8">
                  <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg font-bold">
                    <Save size={18} />
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl">
                 <div>
                   <h4 className="font-bold text-text-primary">الوضع الليلي (Dark Mode)</h4>
                   <p className="text-xs text-text-muted">تغيير مظهر التطبيق للوضع المظلم لراحة العين.</p>
                 </div>
                 <div onClick={() => handleChange('theme', formData['theme'] === 'dark' ? 'light' : 'dark')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", formData['theme'] === 'dark' ? "bg-primary" : "bg-border")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData['theme'] === 'dark' ? "left-1" : "right-1")}></div>
                 </div>
               </div>
               <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl">
                 <div>
                   <h4 className="font-bold text-text-primary">تفعيل الضريبة</h4>
                   <p className="text-xs text-text-muted">تطبيق ضريبة القيمة المضافة على الفواتير.</p>
                 </div>
                 <div onClick={() => handleChange('tax_enabled', formData['tax_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", formData['tax_enabled'] === 'true' ? "bg-primary" : "bg-border")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData['tax_enabled'] === 'true' ? "left-1" : "right-1")}></div>
                 </div>
               </div>
               <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl">
                 <div>
                   <h4 className="font-bold text-text-primary">صوت الإشعارات</h4>
                   <p className="text-xs text-text-muted">تفعيل أو إيقاف صوت التنبيه عند وصول إشعار جديد.</p>
                 </div>
                 <div className="flex items-center gap-4">
                   <button 
                     onClick={(e) => { e.preventDefault(); testSound(); }}
                     className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors"
                   >
                     اختبار الصوت
                   </button>
                   <div onClick={() => setSoundEnabled(!soundEnabled)} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", soundEnabled ? "bg-primary" : "bg-border")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", soundEnabled ? "left-1" : "right-1")}></div>
                   </div>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-sm font-bold text-text-muted">نسبة الضريبة (%)</label>
                    <input value={formData['tax_rate'] || ''} onChange={e => handleChange('tax_rate', e.target.value)} type="number" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                 <div className="space-y-1">
                    <label className="text-sm font-bold text-text-muted">سعر صرف الدولار (مقابل الدينار)</label>
                    <input value={formData['exchange_rate'] || ''} onChange={e => handleChange('exchange_rate', e.target.value)} type="number" placeholder="مثال: 1500" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                
                <div className="flex justify-end pt-6 border-t border-border">
                  <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg font-bold">
                    <Save size={18} />
                    <span>حفظ التغييرات</span>
                  </button>
                </div>
            </div>
          )}

          {activeTab === 'basic_data' && (
            <div className="space-y-6">
              {!activeBasicDataTab ? (
                <div className="bg-bg-main p-8 rounded-2xl text-center">
                  <Box className="mx-auto text-primary mb-4" size={48} />
                  <h3 className="text-xl font-bold text-text-primary mb-2">إدارة البيانات الأساسية</h3>
                  <p className="text-text-muted mb-6">قم بإدارة التصنيفات، وحدات القياس، المخازن، وتصنيفات الخزينة من هنا.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => openBasicDataTab('warehouses')} className="p-4 bg-white border border-border rounded-xl font-bold hover:border-primary hover:text-primary transition-colors">
                      إدارة المخازن
                    </button>
                    <button onClick={() => openBasicDataTab('categories')} className="p-4 bg-white border border-border rounded-xl font-bold hover:border-primary hover:text-primary transition-colors">
                      تصنيفات الأصناف
                    </button>
                    <button onClick={() => openBasicDataTab('units')} className="p-4 bg-white border border-border rounded-xl font-bold hover:border-primary hover:text-primary transition-colors">
                      وحدات القياس
                    </button>
                    <button onClick={() => openBasicDataTab('treasury')} className="p-4 bg-white border border-border rounded-xl font-bold hover:border-primary hover:text-primary transition-colors">
                      تصنيفات الخزينة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setActiveBasicDataTab(null)} className="p-2 bg-bg-main rounded-xl hover:bg-border transition-colors text-text-muted">عودة</button>
                      <h3 className="font-bold text-text-primary text-lg">
                        {activeBasicDataTab === 'warehouses' ? 'المخازن' : activeBasicDataTab === 'categories' ? 'تصنيفات الأصناف' : activeBasicDataTab === 'units' ? 'وحدات القياس' : 'تصنيفات الخزينة'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsBasicDataModalOpen(true)}
                      className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-light transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      إضافة جديد
                    </button>
                  </div>
                  <div className="overflow-hidden border border-border rounded-2xl">
                    <table className="w-full text-right">
                      <thead className="bg-bg-main">
                        <tr>
                          <th className="p-4 text-xs font-bold text-text-muted">الاسم</th>
                          {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && <th className="p-4 text-xs font-bold text-text-muted">{activeBasicDataTab === 'categories' ? 'الوصف' : 'الموقع'}</th>}
                          {activeBasicDataTab === 'treasury' && <th className="p-4 text-xs font-bold text-text-muted">النوع</th>}
                          <th className="p-4 text-xs font-bold text-text-muted w-24">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {basicDataList.map((item) => (
                          <tr key={item.id} className="hover:bg-bg-main/50">
                            <td className="p-4 font-bold text-sm">{item.name}</td>
                            {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && <td className="p-4 text-sm text-text-muted">{item.description || item.location || '-'}</td>}
                            {activeBasicDataTab === 'treasury' && <td className="p-4 text-sm">{item.type === 'income' ? 'إيراد' : 'مصروف'} {item.is_system ? '(أساسي)' : ''}</td>}
                            <td className="p-4">
                              <button onClick={() => handleDeleteBasicData(item.id)} className="text-danger text-xs hover:underline font-bold">حذف</button>
                            </td>
                          </tr>
                        ))}
                        {basicDataList.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-text-muted italic">لا توجد بيانات</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'financial_year' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">إعدادات السنة الحسابية</h2>
                    <p className="text-text-muted text-sm mt-1">تحديد السنة المالية وإغلاق الحسابات</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">بداية السنة المالية</label>
                    <input 
                      type="date" 
                      value={formData.financial_year_start || ''}
                      onChange={e => handleChange('financial_year_start', e.target.value)}
                      className="w-full bg-bg-main border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">نهاية السنة المالية</label>
                    <input 
                      type="date" 
                      value={formData.financial_year_end || ''}
                      onChange={e => handleChange('financial_year_end', e.target.value)}
                      className="w-full bg-bg-main border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleCloseFiscalYear} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-colors">
                    إغلاق السنة الحسابية الحالية
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
                  <div className="p-3 bg-warning/10 rounded-xl text-warning">
                    <Box size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">الجرد المخزني</h2>
                    <p className="text-text-muted text-sm mt-1">إجراء عمليات الجرد ومطابقة الأرصدة</p>
                  </div>
                </div>
                
                <p className="text-sm text-text-muted mb-6 leading-relaxed">
                  هذه الأداة تساعدك على عمل جرد فعلي للمخزون وتسوية الفروقات بين الرصيد الدفتري في النظام والرصيد الفعلي في المخزن. سيقوم النظام بإنشاء إيصالات تسوية تلقائية عند وجود فروقات.
                </p>
                <div className="flex justify-start">
                  <button onClick={() => setIsStocktakeModalOpen(true)} className="px-6 py-3 rounded-xl bg-warning hover:opacity-90 text-white font-bold transition-colors">
                    بدء جرد مخزني جديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 text-center py-8">
                <div className="w-48 h-48 mx-auto flex items-center justify-center drop-shadow-2xl mb-6 relative group cursor-pointer" onClick={() => document.getElementById('appLogoInput')?.click()}>
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/10"></div>
                  <img src={appLogo} alt="شعار النظام" className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105 relative z-10" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={32} />
                    <span className="text-xs mt-2 font-bold bg-white/80 px-2 py-1 rounded">تغيير الشعار</span>
                  </div>
                  <input type="file" id="appLogoInput" className="hidden" accept="image/*" onChange={handleAppLogoUpload} />
                </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">برنامج المخزون برو</h2>
              <p className="text-text-muted text-lg mb-6">نظام محاسبي متكامل لإدارة المخزون والمبيعات</p>
              
              <div className="max-w-md mx-auto bg-bg-main p-6 rounded-2xl text-right space-y-4">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">الإصدار:</span>
                  <span className="font-bold">1.0.0</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">تاريخ الإصدار:</span>
                  <span className="font-bold">2026</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 items-center">
                  <span className="text-text-muted">مطورين النظام:</span>
                  <span className="font-bold">المطور برو</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 items-center">
                  <span className="text-text-muted">الدعم الفني:</span>
                  <span className="font-bold">pro@iqa5.site</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 items-center">
                  <span className="text-text-muted">اتصال الدعم الفني:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" dir="ltr">07844112111</span>
                    <a href="https://wa.me/9647844112111" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white p-1.5 rounded-full hover:scale-105 transition-transform" title="مراسلة واتساب">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary mb-6 border-b border-border pb-4">تفاصيل التفعيل والاشتراك</h2>
              
              <div className="bg-bg-main p-6 rounded-2xl border border-border">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md",
                    isActivated ? "bg-success" : "bg-danger"
                  )}>
                    {isActivated ? <ShieldCheck size={24} /> : <Info size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">
                      {isActivated ? 'النظام مفعل' : 'النظام غير مفعل'}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {activationType === 'lifetime' ? 'رخصة مدى الحياة' 
                        : activationType === '1_year' ? 'اشتراك سنوي'
                        : activationType === '1_month' ? 'اشتراك شهري'
                        : activationType === '14_days' ? 'نسخة تجريبية 14 يوم'
                        : 'يرجى تفعيل النظام للتمتع بكافة الميزات'}
                    </p>
                  </div>
                </div>

                {expiryDate && activationType !== 'lifetime' && (
                  <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                      <span className="text-xs text-text-muted block mb-1">تاريخ الانتهاء</span>
                      <span className="font-bold text-text-primary" dir="ltr">
                        {new Date(expiryDate).toLocaleDateString('ar-EG', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                      <span className="text-xs text-text-muted block mb-1">المدة المتبقية</span>
                      <span className="font-bold text-primary">
                        {Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} يوم
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {(!isActivated || activationType === '14_days') && (
                <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                  <h4 className="font-bold text-primary mb-2">ترقية الاشتراك</h4>
                  <p className="text-sm text-text-muted mb-4">قم بإدخال رمز التفعيل للحصول على جميع المميزات بدون قيود.</p>
                  <button 
                    onClick={() => {
                      // Trigger ActivationModal from Settings if possible, or direct user
                      // @ts-ignore
                      toast.info('اضغط على زر التفعيل في الشريط العلوي، أو أعد تحميل الصفحة إذا كان مخفياً.');
                    }}
                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-light transition-colors"
                  >
                    للتفعيل يرجى استخدام زر التفعيل في أعلى الشاشة
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bot' && (
            <div className="space-y-8">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex items-start gap-4">
                <MessageCircle className="text-primary mt-1" size={32} />
                <div>
                  <h3 className="font-bold text-primary mb-1">إعدادات بوت تيليجرام</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    قم بربط النظام ببوت تيليجرام للحصول على التقارير المالية والمخزنية من أي مكان وعبر أوامر بسيطة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-main p-6 rounded-3xl border border-border">
                <div className="md:col-span-2 flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h4 className="font-bold text-text-primary text-lg">تفعيل البوت</h4>
                    <p className="text-sm text-text-muted">السماح للبوت بالاتصال والعمل مع النظام</p>
                  </div>
                  <div onClick={() => handleChange('telegram_bot_enabled', formData['telegram_bot_enabled'] === 'true' ? 'false' : 'true')} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors", formData['telegram_bot_enabled'] === 'true' ? "bg-primary" : "bg-border")}>
                    <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm", formData['telegram_bot_enabled'] === 'true' ? "left-1" : "right-1")}></div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-text-muted">رمز البوت (Bot Token)</label>
                  <input 
                    value={formData['telegram_bot_token'] || ''} 
                    onChange={e => handleChange('telegram_bot_token', e.target.value)} 
                    type="text" 
                    placeholder="مثال: 123456789:ABCDefghIJKlmNoPQRsTUVwxyZ"
                    className="w-full bg-white border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-left" dir="ltr" />
                  <p className="text-xs text-text-muted mt-1">يتم الحصول عليه من <a href="https://t.me/BotFather" target="_blank" className="text-primary hover:underline">@BotFather</a> في تيليجرام</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-text-muted">معرف المحادثة (Chat ID) (اختياري - لزيادة الأمان)</label>
                  <input 
                    value={formData['telegram_chat_id'] || ''} 
                    onChange={e => handleChange('telegram_chat_id', e.target.value)} 
                    type="text" 
                    placeholder="مثال: 12345678"
                    className="w-full bg-white border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 text-left" dir="ltr" />
                  <p className="text-xs text-text-muted mt-1">لتحديد من يمكنه طلب التقارير. إذا تركته فارغاً، فأي شخص لديه البوت يمكنه الاستعلام.</p>
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="font-bold text-text-primary text-lg mb-4 pb-2 border-b border-border">التقارير المسموح للبوت بإرسالها</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'telegram_sales_report', label: 'تقرير المبيعات اليومي (/sales)' },
                      { key: 'telegram_income_statement', label: 'قائمة الدخل اليومية (/income)' },
                      { key: 'telegram_purchases_report', label: 'تقرير المشتريات اليومي (/purchases)' },
                      { key: 'telegram_inventory_movement', label: 'حركة المخزون (/inventory)' },
                      { key: 'telegram_customer_balances', label: 'أرصدة العملاء (/customers)' },
                      { key: 'telegram_balance_sheet', label: 'الميزانية العمومية (/balancesheet)' },
                      { key: 'telegram_purchase_prices', label: 'كشف تغيير الأسعار' },
                    ].map(report => (
                      <div key={report.key} className="flex items-center justify-between bg-white p-4 rounded-xl border border-border">
                        <span className="font-bold text-text-primary text-sm">{report.label}</span>
                        <div onClick={() => handleChange(report.key, formData[report.key] === 'true' ? 'false' : 'true')} className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", formData[report.key] === 'true' ? "bg-primary" : "bg-border")}>
                          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData[report.key] === 'true' ? "left-1" : "right-1")}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-border">
                <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg font-bold">
                  <Save size={18} />
                  <span>حفظ إعدادات البوت</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-8">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 flex items-start gap-4">
                <RefreshCw className="text-primary mt-1" size={32} />
                <div>
                  <h3 className="font-bold text-primary mb-1">تحديثات النظام</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    من هنا يمكنك تحديث النظام إلى أحدث نسخة إما عبر الإنترنت مباشرة أو من خلال ملف تحديث متوفر على الكمبيوتر.
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex items-center justify-between transition-all hover:border-primary/30">
                <div>
                  <h4 className="font-bold text-lg mb-1">التحديث التلقائي للنظام</h4>
                  <p className="text-sm text-text-muted">تفعيل البحث عن تحديثات وتثبيتها تلقائياً عند بدء تشغيل النظام مع التنبيه المسبق.</p>
                </div>
                <div onClick={toggleAutoUpdate} className={cn("w-14 h-7 rounded-full relative cursor-pointer transition-colors", autoUpdateEnabled ? "bg-primary" : "bg-border")}>
                  <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all", autoUpdateEnabled ? "left-1" : "right-1")}></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center transition-all hover:border-primary/30 hover:shadow-md">
                  <Download className="text-primary mb-4" size={48} />
                  <h4 className="font-bold text-lg mb-2">تحديث عبر الإنترنت</h4>
                  <p className="text-sm text-text-muted mb-6 h-10">سيتم البحث عن أحدث التحديثات وتنزيلها وتثبيتها تلقائياً.</p>
                  <button onClick={() => startUpdateProcess('internet')} className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-light transition-all font-bold w-full shadow-md">
                    تحديث النظام عبر الانترنيت
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center text-center transition-all hover:border-primary/30 hover:shadow-md">
                  <Upload className="text-primary mb-4" size={48} />
                  <h4 className="font-bold text-lg mb-2">تحديث عبر الكمبيوتر</h4>
                  <p className="text-sm text-text-muted mb-6 h-10">اختر ملف التحديث الذي قمت بتحميله مسبقاً لتثبيته يدوياً.</p>
                  <button 
                    onClick={() => startUpdateProcess('local')}
                    className="bg-white text-primary border-2 border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-all font-bold w-full">
                    تحديث النظام عبر الكمبيوتر
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => { setIsUserModalOpen(false); setEditingUserId(null); }} title={editingUserId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">الاسم الكامل</label>
            <input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">اسم المستخدم</label>
              <input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none" disabled={!!editingUserId} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">كلمة المرور {editingUserId && <span className="text-xs text-text-muted font-normal">(اتركها فارغة إذا لا تريد التغيير)</span>}</label>
              <input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} type="password" placeholder="••••••" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">الصلاحية</label>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-3 outline-none">
              <option value="admin">مدير نظام</option>
              <option value="accountant">محاسب</option>
              <option value="sales">بائع</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
            <button onClick={handleCreateUser} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md font-bold">حفظ المستخدم</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBasicDataModalOpen} onClose={() => setIsBasicDataModalOpen(false)} title={`إضافة ${activeBasicDataTab === 'warehouses' ? 'مخزن' : activeBasicDataTab === 'categories' ? 'تصنيف أصناف' : activeBasicDataTab === 'units' ? 'وحدة قياس' : 'تصنيف خزينة'}`}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">الاسم</label>
            <input value={newBasicDataName} onChange={e => setNewBasicDataName(e.target.value)} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none" />
          </div>
          {(activeBasicDataTab === 'categories' || activeBasicDataTab === 'warehouses') && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">{activeBasicDataTab === 'categories' ? 'الوصف (اختياري)' : 'الموقع (اختياري)'}</label>
              <input value={newBasicDataDesc} onChange={e => setNewBasicDataDesc(e.target.value)} type="text" className="w-full bg-bg-main border-none rounded-xl p-3 outline-none" />
            </div>
          )}
          {activeBasicDataTab === 'treasury' && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">النوع</label>
              <select value={newTreasuryType} onChange={e => setNewTreasuryType(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-3 outline-none">
                <option value="income">إيرادات</option>
                <option value="expense">مصروفات</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button onClick={() => setIsBasicDataModalOpen(false)} className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
            <button onClick={handleCreateBasicData} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md font-bold">حفظ</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={`معاينة - ${activeDesignTab === 'sales' ? 'المبيعات' : activeDesignTab === 'purchase' ? 'المشتريات' : 'التقارير'}`} size="xl">
        <div className="space-y-4">
          <div className="bg-white p-8 rounded-xl border border-border shadow-sm min-h-[400px]">
            {formData[`${activeDesignTab}_template_type`] === 'custom' ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: (formData[`${activeDesignTab}_custom_html`] || '')
                    .replace('{{company_name}}', formData['company_name'] || 'اسم الشركة التجريبي')
                    .replace('{{company_address}}', formData['address'] || 'عنوان الشركة، شارع ١٢٣')
                    .replace('{{company_phone}}', formData['phone'] || '0123456789')
                    .replace('{{tax_number_html}}', formData['tax_number'] ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">الرقم الضريبي: ${formData['tax_number']}</p>` : '')
                    .replace('{{logo_img}}', formData['print_show_logo'] !== 'false' && formData['logo'] ? `<img src="${formData['logo']}" style="height: ${formData[`${activeDesignTab}_logo_size`] || 60}px; object-fit: contain;" />` : '')
                    .replace('{{invoice_type_label}}', activeDesignTab === 'sales' ? 'فاتورة مبيعات' : activeDesignTab === 'purchase' ? 'فاتورة مشتريات' : 'تقرير')
                    .replace('{{invoice_number}}', 'INV-2026-0001')
                    .replace('{{date}}', '2026-01-01')
                    .replace('{{start_date}}', '2026-01-01')
                    .replace('{{end_date}}', '2026-12-31')
                    .replace('{{party_title}}', activeDesignTab === 'purchase' ? 'بيانات المورد' : 'بيانات العميل')
                    .replace('{{party_name}}', 'عميل / مورد افتراضي')
                    .replace('{{party_contact_html}}', '<div style="text-align: left; color: #64748b; font-size: 14px;"><p style="margin: 0;">هاتف: 0500000000</p></div>')
                    .replace('{{report_title}}', 'اسم التقرير (مثال: تقرير المبيعات)')
                    .replace('{{report_content}}', '<div style="padding: 20px; text-align: center; color: #64748b; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px;">جداول ومحتويات التقرير ستظهر هنا...</div>')
                    .replace('{{subtotal}}', '1,000.00')
                    .replace('{{tax_amount}}', '150.00')
                    .replace('{{total}}', '1,150.00')
                    .replace('{{items_table_rows}}', `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; font-weight: bold;">صنف تجريبي رقم ١</td>
                        <td style="padding: 12px; text-align: center;">2</td>
                        <td style="padding: 12px; text-align: center;">500.00</td>
                        <td style="padding: 12px; text-align: center;">1,000.00</td>
                      </tr>
                    `)
                    .replace('{{footer_text_html}}', formData[`${activeDesignTab}_footer_text`] ? `<div style="margin-top: 30px; text-align: center; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 15px; border-radius: 8px;">${formData[`${activeDesignTab}_footer_text`]}</div>` : '')
                }} 
              />
            ) : formData[`${activeDesignTab}_template_type`] === 'external' ? (
              <div className="space-y-8 flex flex-col items-center">
                {formData[`${activeDesignTab}_header_image`] ? (
                  <img src={formData[`${activeDesignTab}_header_image`]} alt="Header" className="w-full object-contain" style={{ height: `${formData[`${activeDesignTab}_logo_size`] || 60}px` }} />
                ) : (
                  <div className="w-full h-32 bg-bg-main border-2 border-dashed border-border flex items-center justify-center text-text-muted">صورة الترويسة غير متوفرة</div>
                )}
                
                <div className="w-full py-8 border-y-2 border-dashed border-border text-center text-text-muted bg-gray-50/50">
                  <p className="font-bold mb-2">مساحة محتوى الفاتورة أو التقرير</p>
                  <p className="text-sm">هنا ستظهر جداول الأصناف أو التقارير المالية</p>
                </div>
                
                {formData[`${activeDesignTab}_footer_image`] ? (
                  <img src={formData[`${activeDesignTab}_footer_image`]} alt="Footer" className="w-full object-contain" />
                ) : (
                  <div className="w-full h-32 bg-bg-main border-2 border-dashed border-border flex items-center justify-center text-text-muted">صورة التذييل غير متوفرة</div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start border-b-2 border-border pb-6 mb-6" style={{ borderColor: formData[`${activeDesignTab}_print_color`] || '#1E40AF' }}>
                  <div className="flex items-center gap-4">
                    {formData['print_show_logo'] === 'true' && formData['logo'] && (
                      <img src={formData['logo']} alt="Logo" className="object-contain" style={{ height: `${formData[`${activeDesignTab}_logo_size`] || 60}px` }} />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold mb-2" style={{ color: formData[`${activeDesignTab}_print_color`] || '#1E40AF' }}>اسم الشركة الافتراضي</h1>
                      <p className="text-sm text-gray-600">العنوان - الهاتف - الرقم الضريبي</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: `${formData[`${activeDesignTab}_print_color`] || '#1E40AF'}10`, border: `1px solid ${formData[`${activeDesignTab}_print_color`] || '#1E40AF'}30` }}>
                    <h2 className="text-2xl font-bold mb-2 border-b pb-2" style={{ color: formData[`${activeDesignTab}_print_color`] || '#1E40AF', borderColor: `${formData[`${activeDesignTab}_print_color`] || '#1E40AF'}30` }}>
                      {activeDesignTab === 'sales' ? 'فاتورة مبيعات ضريبية' : activeDesignTab === 'purchase' ? 'فاتورة مشتريات' : 'تقرير مالي'}
                    </h2>
                    <p className="text-sm">التاريخ: 2026-01-01</p>
                  </div>
                </div>
                <table className="w-full mb-8 border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: formData[`${activeDesignTab}_print_color`] || '#1E40AF', color: 'white' }}>
                      <th className="border p-2 text-right">الصنف</th>
                      <th className="border p-2 text-center">الكمية</th>
                      <th className="border p-2 text-center">السعر</th>
                      <th className="border p-2 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">صنف تجريبي 1</td>
                      <td className="border p-2 text-center">1</td>
                      <td className="border p-2 text-center">150</td>
                      <td className="border p-2 text-center">150</td>
                    </tr>
                    <tr>
                      <td className="border p-2">صنف تجريبي 2</td>
                      <td className="border p-2 text-center">2</td>
                      <td className="border p-2 text-center">50</td>
                      <td className="border p-2 text-center">100</td>
                    </tr>
                  </tbody>
                </table>
                {formData[`${activeDesignTab}_footer_text`] && (
                  <div className="mt-8 text-center text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
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
        <div className="p-6 flex flex-col items-center justify-center text-center">
          {updateStatus === 'completed' ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الانتهاء من تحديث النظام</h3>
              <p className="text-gray-500 mb-6">تم تثبيت التحديث بنجاح. سيتم إعادة تشغيل النظام لتطبيق التغييرات.</p>
              <button 
                onClick={() => {
                  (window as any).api.updater.installUpdate();
                }}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold w-full shadow-md hover:bg-primary-light transition-all"
              >
                إغلاق وإعادة التشغيل
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Download className="text-primary animate-bounce" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">جاري جلب الملفات وتثبيت التحديث...</h3>
              
              <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden border border-gray-200">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${updateProgress}%` }}
                ></div>
              </div>
              <p className="text-primary font-bold text-lg">{updateProgress}%</p>
              <p className="text-sm text-gray-400 mt-4">الرجاء عدم إغلاق البرنامج أثناء التحديث.</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
