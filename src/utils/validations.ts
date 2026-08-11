import { z } from 'zod';

export const customerSupplierSchema = z.object({
  type: z.enum(['customer', 'supplier']),
  name: z.string().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل'),
  phone: z.string().optional().nullable(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional().nullable(),
  opening_balance_iqd: z.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً').default(0),
  opening_balance_usd: z.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً').default(0),
});

export const productSchema = z.object({
  name: z.string().min(2, 'اسم الصنف يجب أن يحتوي على حرفين على الأقل'),
  code: z.string().optional().nullable().or(z.literal('')),
  purchase_price: z.number().min(0, 'سعر الشراء لا يمكن أن يكون سالباً').default(0),
  sale_price: z.number().min(0, 'سعر البيع لا يمكن أن يكون سالباً'),
  currency: z.string().optional().nullable().or(z.literal('')),
  opening_stock: z.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً').default(0),
  category_id: z.string().or(z.number()).optional().nullable(),
  unit_id: z.string().or(z.number()).optional().nullable(),
  warehouse_id: z.string().or(z.number()).optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل'),
  description: z.string().optional().nullable()
});

export const unitSchema = z.object({
  name: z.string().min(1, 'اسم الوحدة مطلوب')
});

export const warehouseSchema = z.object({
  name: z.string().min(2, 'اسم المخزن يجب أن يحتوي على حرفين على الأقل'),
  location: z.string().optional().nullable()
});

export const treasuryCategorySchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل'),
  type: z.enum(['income', 'expense'])
});
