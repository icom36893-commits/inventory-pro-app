import { create } from 'zustand';

export interface Permission {
  id: string;
  name: string;
  group: string;
}

export interface RolePermissions {
  [role: string]: string[];
}

export interface PermissionsState {
  availablePermissions: Permission[];
  rolePermissions: RolePermissions;
  initializePermissions: () => Promise<void>;
  toggleRolePermission: (role: string, permissionId: string) => Promise<void>;
  setRolePermissions: (role: string, permissions: string[]) => Promise<void>;
  hasPermission: (role: string, permissionId: string) => boolean;
  isPermissionAlertOpen: boolean;
  showPermissionAlert: () => void;
  hidePermissionAlert: () => void;
}

// (SYSTEM_FEATURES declaration remains the same)

export const SYSTEM_FEATURES: Permission[] = [
  // لوحة التحكم
  { id: 'dashboard.view', name: 'عرض لوحة التحكم', group: 'لوحة التحكم' },
  { id: 'dashboard.card_sales', name: 'عرض إجمالي المبيعات', group: 'لوحة التحكم' },
  { id: 'dashboard.card_purchases', name: 'عرض إجمالي المشتريات', group: 'لوحة التحكم' },
  { id: 'dashboard.card_treasury', name: 'عرض رصيد الخزينة', group: 'لوحة التحكم' },
  { id: 'dashboard.card_debts', name: 'عرض مديونيات العملاء', group: 'لوحة التحكم' },
  { id: 'dashboard.chart_movement', name: 'عرض حركة المبيعات والمشتريات', group: 'لوحة التحكم' },
  { id: 'dashboard.chart_expenses', name: 'عرض توزيع المصروفات', group: 'لوحة التحكم' },
  { id: 'dashboard.table_invoices', name: 'عرض آخر فواتير المبيعات', group: 'لوحة التحكم' },
  { id: 'dashboard.table_low_stock', name: 'عرض أصناف منخفضة المخزون', group: 'لوحة التحكم' },
  // المبيعات
  { id: 'sales.view', name: 'عرض المبيعات', group: 'المبيعات' },
  { id: 'sales.create', name: 'إنشاء فاتورة مبيعات', group: 'المبيعات' },
  { id: 'sales.edit', name: 'تعديل فاتورة مبيعات', group: 'المبيعات' },
  { id: 'sales.delete', name: 'حذف فاتورة مبيعات', group: 'المبيعات' },
  { id: 'sales.return', name: 'إنشاء مرتجع مبيعات', group: 'المبيعات' },
  // المشتريات
  { id: 'purchases.view', name: 'عرض المشتريات', group: 'المشتريات' },
  { id: 'purchases.create', name: 'إنشاء فاتورة مشتريات', group: 'المشتريات' },
  { id: 'purchases.edit', name: 'تعديل فاتورة مشتريات', group: 'المشتريات' },
  { id: 'purchases.delete', name: 'حذف فاتورة مشتريات', group: 'المشتريات' },
  { id: 'purchases.return', name: 'إنشاء مرتجع مشتريات', group: 'المشتريات' },
  // المخزون
  { id: 'inventory.view', name: 'عرض المخزون', group: 'المخزون' },
  { id: 'inventory.create', name: 'إضافة صنف', group: 'المخزون' },
  { id: 'inventory.edit', name: 'تعديل صنف', group: 'المخزون' },
  { id: 'inventory.delete', name: 'حذف صنف', group: 'المخزون' },
  { id: 'inventory.initial_items', name: 'إدارة رصيد أولية', group: 'المخزون' },
  { id: 'inventory.warehouses', name: 'إدارة المخازن', group: 'المخزون' },
  // العملاء والموردين
  { id: 'parties.view', name: 'عرض العملاء والموردين', group: 'العملاء والموردين' },
  { id: 'parties.create', name: 'إضافة عميل/مورد', group: 'العملاء والموردين' },
  { id: 'parties.edit', name: 'تعديل عميل/مورد', group: 'العملاء والموردين' },
  { id: 'parties.delete', name: 'حذف عميل/مورد', group: 'العملاء والموردين' },
  { id: 'parties.statement', name: 'كشف الحساب', group: 'العملاء والموردين' },
  // الخزينة (المالية)
  { id: 'treasury.view', name: 'عرض الخزينة', group: 'الخزينة (المالية)' },
  { id: 'treasury.receipt', name: 'إضافة سند قبض', group: 'الخزينة (المالية)' },
  { id: 'treasury.payment', name: 'إضافة سند صرف', group: 'الخزينة (المالية)' },
  { id: 'treasury.edit', name: 'تعديل حركة مالية', group: 'الخزينة (المالية)' },
  { id: 'treasury.delete', name: 'حذف حركة مالية', group: 'الخزينة (المالية)' },
  { id: 'treasury.funds', name: 'إدارة الصناديق', group: 'الخزينة (المالية)' },
  { id: 'treasury.statement', name: 'كشف الحساب', group: 'الخزينة (المالية)' },
  { id: 'treasury.journals', name: 'القيود اليومية', group: 'الخزينة (المالية)' },
  // المعدات
  { id: 'equipment.view', name: 'عرض المعدات', group: 'المعدات' },
  { id: 'equipment.create', name: 'إضافة معدة', group: 'المعدات' },
  { id: 'equipment.edit', name: 'تعديل معدة', group: 'المعدات' },
  { id: 'equipment.delete', name: 'حذف معدة', group: 'المعدات' },
  { id: 'equipment.loan', name: 'تسليم واسترجاع المعدات', group: 'المعدات' },
  // التقارير
  { id: 'reports.income', name: 'قائمة الدخل', group: 'التقارير' },
  { id: 'reports.sales', name: 'تقرير المبيعات', group: 'التقارير' },
  { id: 'reports.purchases', name: 'تقرير المشتريات', group: 'التقارير' },
  { id: 'reports.inventory', name: 'حركة المخزون', group: 'التقارير' },
  { id: 'reports.balances', name: 'أرصدة العملاء', group: 'التقارير' },
  { id: 'reports.balance_sheet', name: 'الميزانية العمومية', group: 'التقارير' },
  { id: 'reports.purchase_prices', name: 'كشف تغير الأسعار', group: 'التقارير' },
  // الإعدادات
  { id: 'settings.company', name: 'إعدادات الشركة', group: 'الإعدادات' },
  { id: 'settings.general', name: 'إعدادات عامة', group: 'الإعدادات' },
  { id: 'settings.app_settings', name: 'اعدادات التطبيق', group: 'الإعدادات' },
  { id: 'settings.basic_data', name: 'البيانات الأساسية', group: 'الإعدادات' },
  { id: 'settings.design', name: 'تخصيص التصميم', group: 'الإعدادات' },
  { id: 'settings.users', name: 'إدارة المستخدمين والصلاحيات', group: 'الإعدادات' },
  { id: 'settings.backup', name: 'النسخ الاحتياطي', group: 'الإعدادات' },
  { id: 'settings.subscriptions', name: 'الاشتراكات والتفعيل', group: 'الإعدادات' },
  { id: 'settings.bot', name: 'تنبيهات التليجرام', group: 'الإعدادات' },
  { id: 'settings.updates', name: 'تحديثات النظام', group: 'الإعدادات' },
  { id: 'settings.financial_year', name: 'السنة المالية', group: 'الإعدادات' },
  { id: 'settings.server', name: 'إعدادات السيرفر', group: 'الإعدادات' }
];

export const usePermissionsStore = create<PermissionsState>()((set, get) => ({
  availablePermissions: SYSTEM_FEATURES,
  isPermissionAlertOpen: false,
  showPermissionAlert: () => set({ isPermissionAlertOpen: true }),
  hidePermissionAlert: () => set({ isPermissionAlertOpen: false }),
  rolePermissions: {
    admin: SYSTEM_FEATURES.map(p => p.id), // Admin always has all permissions
    accountant: ['sales.view', 'purchases.view', 'inventory.view', 'parties.view', 'treasury.view'], // Example defaults
    seller: ['sales.create', 'sales.view', 'inventory.view', 'parties.view'] // Example defaults
  },
  initializePermissions: async () => {
    try {
      const dbPermissions = await (window as any).api.permissions.getAll();
      set((state) => {
        const updatedPermissions = [...SYSTEM_FEATURES];
        const newRolePermissions = { ...state.rolePermissions, ...dbPermissions };
        newRolePermissions.admin = updatedPermissions.map(p => p.id);
        
        return {
          availablePermissions: updatedPermissions,
          rolePermissions: newRolePermissions
        };
      });
    } catch (e) {
      console.error('Failed to load permissions from DB', e);
      set((state) => {
        const updatedPermissions = [...SYSTEM_FEATURES];
        const newRolePermissions = { ...state.rolePermissions };
        newRolePermissions.admin = updatedPermissions.map(p => p.id);
        return {
          availablePermissions: updatedPermissions,
          rolePermissions: newRolePermissions
        };
      });
    }
  },
  toggleRolePermission: async (role, permissionId) => {
    if (role === 'admin') return;

    const state = get();
    const rolePerms = state.rolePermissions[role] || [];
    const hasPerm = rolePerms.includes(permissionId);
    
    const newPerms = hasPerm 
      ? rolePerms.filter(id => id !== permissionId)
      : [...rolePerms, permissionId];

    set({
      rolePermissions: {
        ...state.rolePermissions,
        [role]: newPerms
      }
    });

    try {
      await (window as any).api.permissions.update(role, newPerms);
    } catch (e) {
      console.error('Failed to save permissions to DB', e);
    }
  },
  setRolePermissions: async (role, permissions) => {
    if (role === 'admin') return;
    set((state) => ({
      rolePermissions: {
        ...state.rolePermissions,
        [role]: permissions
      }
    }));

    try {
      await (window as any).api.permissions.update(role, permissions);
    } catch (e) {
      console.error('Failed to save permissions to DB', e);
    }
  },
  hasPermission: (role, permissionId) => {
    if (role === 'admin') return true;
    const perms = get().rolePermissions[role] || [];
    return perms.includes(permissionId);
  }
}));
