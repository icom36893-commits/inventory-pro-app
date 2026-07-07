import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(process.cwd(), 'database', 'inventory.db')
  : path.join(app.getPath('userData'), 'inventory.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global database instance
let dbInstance: Database | null = null;

export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Initialize database if empty
  const tables = await dbInstance.all("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length === 0) {
    const schemaPath = isDev
      ? path.join(process.cwd(), 'database', 'schema.sql')
      : path.join(process.resourcesPath, 'database', 'schema.sql');
      
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await dbInstance.exec(schema);
      console.log('Database initialized successfully');
      
      // No default user seeded. Setup screen will handle this.
      
      // Seed empty company settings
      await dbInstance.run(`
        INSERT INTO company_settings (name, tax_number, phone, email, address, currency, tax_rate, tax_enabled, theme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, 
      '', 
      '', 
      '', 
      '', 
      '', 
      'IQD', 
      0.0, 
      0, 
      'light'
      );
      
      // Seed default warehouse
      await dbInstance.run(`INSERT INTO warehouses (name, location) VALUES ('المستودع الرئيسي', 'الرياض')`);
      
      // Seed default categories
      await dbInstance.run(`INSERT INTO product_categories (name, description) VALUES ('أجهزة إلكترونية', 'أجهزة كمبيوتر وشاشات')`);
      await dbInstance.run(`INSERT INTO product_categories (name, description) VALUES ('إكسسوارات', 'كابلات وملحقات')`);
      
      // Seed default units
      await dbInstance.run(`INSERT INTO units (name) VALUES ('قطعة')`);
      await dbInstance.run(`INSERT INTO units (name) VALUES ('كرتون')`);
      await dbInstance.run(`INSERT INTO units (name) VALUES ('متر')`);
      
      // Seed default treasury categories
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('مدفوعات العملاء', 'income', 1)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('مدفوعات الموردين', 'expense', 1)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('رواتب', 'expense', 0)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('إيجار', 'expense', 0)`);
      await dbInstance.run(`INSERT INTO treasury_categories (name, type, is_system) VALUES ('رأس مال', 'income', 0)`);


    }
  }

  // --- Migrations ---
  const tryAlter = async (sql: string) => {
    try {
      if (dbInstance) await dbInstance.exec(sql);
    } catch (e: any) {
      if (e && e.message && !e.message.includes('duplicate column name')) {
        console.error("Migration error for", sql, e);
      }
    }
  };

  try {
    await tryAlter("ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE invoices ADD COLUMN buyer_name TEXT");
    await tryAlter("ALTER TABLE treasury_transactions ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN currency TEXT DEFAULT 'IQD'");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE party_transactions ADD COLUMN balance_usd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN currency TEXT DEFAULT 'SAR'");
    
    await tryAlter("ALTER TABLE parties ADD COLUMN opening_balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN opening_balance_usd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN current_balance_iqd REAL DEFAULT 0");
    await tryAlter("ALTER TABLE products ADD COLUMN allow_negative_stock INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE parties ADD COLUMN current_balance_usd REAL DEFAULT 0");
    
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_primary_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_template_style TEXT DEFAULT 'modern'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN print_show_logo INTEGER DEFAULT 1");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_logo_size INTEGER DEFAULT 60");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_logo_size INTEGER DEFAULT 60");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_logo_size INTEGER DEFAULT 60");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_logo_size INTEGER DEFAULT 60");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_template_type TEXT DEFAULT 'internal'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_print_color TEXT DEFAULT '#1E40AF'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_footer_text TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_header_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_footer_image BLOB");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_custom_html TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_logo_size INTEGER DEFAULT 60");

    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_enabled INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_frequency TEXT DEFAULT 'daily'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN auto_backup_path TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN last_backup_date TEXT DEFAULT ''");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN logo TEXT");

    // Telegram Bot Settings
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_bot_token TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_chat_id TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_bot_enabled INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_sales_report INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_income_statement INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_purchases_report INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_inventory_movement INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_customer_balances INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_balance_sheet INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN telegram_purchase_prices INTEGER DEFAULT 0");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN last_low_stock_alert_date TEXT DEFAULT ''");
  } catch (e) {
    console.error("Global migration error:", e);
  }

  try {
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        type TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Error creating system_notifications:", e);
  }

  try {
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS inventory_stocktakes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stocktake_number TEXT UNIQUE NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'draft',
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stocktake_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stocktake_id INTEGER REFERENCES inventory_stocktakes(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        system_qty REAL NOT NULL DEFAULT 0,
        actual_qty REAL NOT NULL DEFAULT 0,
        difference REAL NOT NULL DEFAULT 0,
        notes TEXT
      );
    `);
  } catch (e) {
    console.error("Error creating stocktake tables:", e);
  }
  // ------------------

  return dbInstance;
}

export default {
  getDb,
  closeDb
};
