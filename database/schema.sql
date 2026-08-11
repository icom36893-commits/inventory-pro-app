-- ===== إعدادات الشركة =====
CREATE TABLE company_settings (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  logo BLOB,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  currency TEXT DEFAULT 'SAR',
  invoice_prefix TEXT DEFAULT 'INV',
  tax_enabled INTEGER DEFAULT 0,
  tax_rate REAL DEFAULT 15.0,
  theme TEXT DEFAULT 'light',
  print_primary_color TEXT DEFAULT '#1E40AF',
  print_template_style TEXT DEFAULT 'modern',
  print_footer_text TEXT,
  print_show_logo INTEGER DEFAULT 1,
  sales_template_type TEXT DEFAULT 'internal',
  sales_print_color TEXT DEFAULT '#1E40AF',
  sales_footer_text TEXT,
  sales_header_image BLOB,
  sales_footer_image BLOB,
  sales_custom_html TEXT,
  purchase_template_type TEXT DEFAULT 'internal',
  purchase_print_color TEXT DEFAULT '#1E40AF',
  purchase_footer_text TEXT,
  purchase_header_image BLOB,
  purchase_footer_image BLOB,
  purchase_custom_html TEXT,
  reports_template_type TEXT DEFAULT 'internal',
  reports_print_color TEXT DEFAULT '#1E40AF',
  reports_footer_text TEXT,
  reports_header_image BLOB,
  reports_footer_image BLOB,
  reports_custom_html TEXT,
  treasury_template_type TEXT DEFAULT 'internal',
  treasury_print_color TEXT DEFAULT '#1E40AF',
  treasury_footer_text TEXT,
  treasury_header_image BLOB,
  treasury_footer_image BLOB,
  treasury_custom_html TEXT,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  telegram_bot_enabled INTEGER DEFAULT 0,
  telegram_sales_report INTEGER DEFAULT 0,
  telegram_income_statement INTEGER DEFAULT 0,
  telegram_purchases_report INTEGER DEFAULT 0,
  telegram_inventory_movement INTEGER DEFAULT 0,
  telegram_customer_balances INTEGER DEFAULT 0,
  telegram_balance_sheet INTEGER DEFAULT 0,
  telegram_purchase_prices INTEGER DEFAULT 0,
  last_low_stock_alert_date TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== المستخدمون =====
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- admin | user | accountant
  is_active INTEGER DEFAULT 1,
  profile_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== تصنيفات الأصناف =====
CREATE TABLE product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

-- ===== وحدات القياس =====
CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL -- قطعة، كيلو، متر...
);

-- ===== المخازن =====
CREATE TABLE warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  is_active INTEGER DEFAULT 1
);

-- ===== الأصناف =====
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES product_categories(id),
  unit_id INTEGER REFERENCES units(id),
  default_supplier_id INTEGER,
  purchase_price REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  opening_stock REAL DEFAULT 0,
  current_stock REAL DEFAULT 0,
  warehouse_id INTEGER REFERENCES warehouses(id),
  allow_negative_stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== العملاء والموردون =====
CREATE TABLE parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('customer', 'supplier')),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  opening_balance_iqd REAL DEFAULT 0,
  opening_balance_usd REAL DEFAULT 0,
  current_balance_iqd REAL DEFAULT 0,
  current_balance_usd REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== الفواتير (مبيعات ومشتريات) =====
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sale', 'purchase', 'sale_return', 'purchase_return')),
  party_id INTEGER REFERENCES parties(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'amount', -- amount | percent
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  payment_method TEXT CHECK(payment_method IN ('cash', 'partial', 'credit')),
  status TEXT DEFAULT 'confirmed', -- draft | confirmed | cancelled
  buyer_name TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== بنود الفواتير =====
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL
);

-- ===== الخزينة =====
CREATE TABLE treasury_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL, -- customer_payment | supplier_payment | salary | rent | other
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'IQD',
  party_id INTEGER REFERENCES parties(id),
  invoice_id INTEGER REFERENCES invoices(id),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== سجل حركات العملاء/الموردين =====
CREATE TABLE party_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER REFERENCES parties(id),
  type TEXT NOT NULL, -- invoice | payment | discount | return
  reference_id INTEGER, -- invoice_id أو treasury_id
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  balance_iqd REAL DEFAULT 0,
  balance_usd REAL DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== تصنيفات الخزينة =====
CREATE TABLE treasury_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')),
  is_system INTEGER DEFAULT 0
);

-- ===== الإشعارات =====
CREATE TABLE system_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== عمليات الجرد المخزني =====
CREATE TABLE inventory_stocktakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stocktake_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft', -- draft | applied
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stocktake_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stocktake_id INTEGER REFERENCES inventory_stocktakes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  system_qty REAL NOT NULL DEFAULT 0,
  actual_qty REAL NOT NULL DEFAULT 0,
  difference REAL NOT NULL DEFAULT 0,
  notes TEXT
);

-- ===== المعدات =====
CREATE TABLE equipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_qty INTEGER DEFAULT 1,
  available_qty INTEGER DEFAULT 1,
  status TEXT DEFAULT 'available',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== إعارة المعدات =====
CREATE TABLE equipment_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER REFERENCES equipments(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  qty_borrowed INTEGER DEFAULT 1,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  return_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== مصاريف إضافية للفواتير =====
CREATE TABLE invoice_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  party_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount REAL NOT NULL,
  details TEXT
);

-- ===== تصنيفات الصناديق =====
CREATE TABLE fund_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_system INTEGER DEFAULT 0
);

-- ===== الصناديق =====
CREATE TABLE funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  opening_balance_iqd REAL DEFAULT 0,
  opening_balance_usd REAL DEFAULT 0,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== القيود اليومية =====
CREATE TABLE journal_vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_voucher_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER REFERENCES journal_vouchers(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  account_id INTEGER,
  debit_iqd REAL DEFAULT 0,
  credit_iqd REAL DEFAULT 0,
  debit_usd REAL DEFAULT 0,
  credit_usd REAL DEFAULT 0,
  description TEXT,
  category TEXT
);

-- ===== ������� ���������� =====
CREATE TABLE role_permissions (
  role TEXT PRIMARY KEY,
  permissions TEXT
);
