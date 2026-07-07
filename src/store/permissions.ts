import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  initializePermissions: () => void;
  toggleRolePermission: (role: string, permissionId: string) => void;
  hasPermission: (role: string, permissionId: string) => boolean;
}

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
  { id: 'sales.return', name: 'إنشاء مرتجع مبيعات', group: 'المبيعات' },
  // المشتريات
  { id: 'purchases.view', name: 'عرض المشتريات', group: 'المشتريات' },
  { id: 'purchases.create', name: 'إنشاء فاتورة مشتريات', group: 'المشتريات' },
  { id: 'purchases.return', name: 'إنشاء مرتجع مشتريات', group: 'المشتريات' },
  // المخزون
  { id: 'inventory.view', name: 'عرض المخزون', group: 'المخزون' },
  { id: 'inventory.create', name: 'إضافة صنف', group: 'المخزون' },
  { id: 'inventory.edit', name: 'تعديل صنف', group: 'المخزون' },
  { id: 'inventory.delete', name: 'حذف صنف', group: 'المخزون' },
  { id: 'inventory.warehouses', name: 'إدارة المخازن', group: 'المخزون' },
  // العملاء والموردين
  { id: 'parties.view', name: 'عرض العملاء والموردين', group: 'العملاء والموردين' },
  { id: 'parties.create', name: 'إضافة عميل/مورد', group: 'العملاء والموردين' },
  { id: 'parties.statement', name: 'كشف الحساب', group: 'العملاء والموردين' },
  // الخزينة (المالية)
  { id: 'treasury.view', name: 'عرض الخزينة', group: 'الخزينة (المالية)' },
  { id: 'treasury.receipt', name: 'إضافة سند قبض', group: 'الخزينة (المالية)' },
  { id: 'treasury.payment', name: 'إضافة سند صرف', group: 'الخزينة (المالية)' },
  // التقارير
  { id: 'reports.sales', name: 'تقارير المبيعات', group: 'التقارير' },
  { id: 'reports.purchases', name: 'تقارير المشتريات', group: 'التقارير' },
  { id: 'reports.profits', name: 'تقارير الأرباح', group: 'التقارير' },
  { id: 'reports.inventory', name: 'تقارير المخزون', group: 'التقارير' },
  // الإعدادات
  { id: 'settings.company', name: 'إعدادات الشركة', group: 'الإعدادات' },
  { id: 'settings.users', name: 'إدارة المستخدمين والصلاحيات', group: 'الإعدادات' },
  { id: 'settings.backup', name: 'النسخ الاحتياطي', group: 'الإعدادات' },
  { id: 'settings.design', name: 'تخصيص التصميم', group: 'الإعدادات' },
  { id: 'settings.basic_data', name: 'البيانات الأساسية', group: 'الإعدادات' }
];

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      availablePermissions: SYSTEM_FEATURES,
      rolePermissions: {
        admin: SYSTEM_FEATURES.map(p => p.id), // Admin always has all permissions
        accountant: ['sales.view', 'purchases.view', 'inventory.view', 'parties.view', 'treasury.view'], // Example defaults
        seller: ['sales.create', 'sales.view', 'inventory.view', 'parties.view'] // Example defaults
      },
      initializePermissions: () => set((state) => {
        // Merge new system features with existing ones
        const currentIds = new Set(state.availablePermissions.map(p => p.id));
        const newFeatures = SYSTEM_FEATURES.filter(f => !currentIds.has(f.id));
        
        const updatedPermissions = [...state.availablePermissions, ...newFeatures];
        
        // Ensure admin has all permissions
        const newRolePermissions = { ...state.rolePermissions };
        newRolePermissions.admin = updatedPermissions.map(p => p.id);

        return {
          availablePermissions: updatedPermissions,
          rolePermissions: newRolePermissions
        };
      }),
      toggleRolePermission: (role, permissionId) => set((state) => {
        if (role === 'admin') return state; // Cannot modify admin permissions

        const rolePerms = state.rolePermissions[role] || [];
        const hasPerm = rolePerms.includes(permissionId);
        
        return {
          rolePermissions: {
            ...state.rolePermissions,
            [role]: hasPerm 
              ? rolePerms.filter(id => id !== permissionId)
              : [...rolePerms, permissionId]
          }
        };
      }),
      hasPermission: (role, permissionId) => {
        if (role === 'admin') return true;
        const perms = get().rolePermissions[role] || [];
        return perms.includes(permissionId);
      }
    }),
    {
      name: 'permissions-storage'
    }
  )
);
