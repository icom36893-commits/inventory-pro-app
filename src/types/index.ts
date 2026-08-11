export interface Product {
  id: number;
  code: string;
  name: string;
  category_id?: number;
  unit_id?: number;
  purchase_price: number;
  sale_price: number;
  currency?: string;
  current_stock: number;
  warehouse_id?: number;
  allow_negative_stock?: boolean;
  is_active: boolean;
  is_initial?: boolean;
}

export interface Party {
  id: number;
  code: string;
  type: 'customer' | 'supplier';
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_balance_iqd?: number;
  opening_balance_usd?: number;
  current_balance_iqd: number;
  current_balance_usd: number;
  is_active: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  type: 'sale' | 'purchase' | 'sale_return' | 'purchase_return';
  party_id: number;
  date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  payment_method: 'cash' | 'partial' | 'credit';
  status: string;
}

export interface TreasuryTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  party_id?: number;
}

export interface Fund {
  id: number;
  name: string;
  category: string;
  opening_balance_iqd: number;
  opening_balance_usd: number;
  is_system?: number;
  created_at?: string;
}

export interface StatementRow {
  date: string;
  operation_type: string;
  movement_type: string;
  reference_number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface JournalVoucherEntry {
  account_type: 'party' | 'fund';
  account_id: number;
  debit_iqd: number;
  credit_iqd: number;
  debit_usd: number;
  credit_usd: number;
  description: string;
}

export interface JournalVoucher {
  date: string;
  notes: string;
  entries: JournalVoucherEntry[];
}

