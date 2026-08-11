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

let dbPromise: Promise<Database> | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    try {
      dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      
      // Enable WAL mode for concurrent access and set busy timeout
      await dbInstance.exec('PRAGMA journal_mode = WAL;');
      await dbInstance.exec('PRAGMA busy_timeout = 5000;');

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
          
          // Seed empty company settings
          await dbInstance.run(`
            INSERT INTO company_settings (name, tax_number, phone, email, address, currency, tax_rate, tax_enabled, theme)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, '', '', '', '', '', 'IQD', 0.0, 0, 'light');
          
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

          // Seed fund categories
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('ايرادات خارجية', 1)`);
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('مصاريف عامة', 1)`);
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('مشاريع', 1)`);
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('رأس مال', 1)`);
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('موجودات ثابتة', 1)`);
          await dbInstance.run(`INSERT INTO fund_categories (name, is_system) VALUES ('صناديق أموال جاهزة', 1)`);

          // Seed general expenses fund
          await dbInstance.run(`INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system) VALUES ('المصاريف العامة', 'مصاريف', 0, 0, 1)`);

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
        await tryAlter("ALTER TABLE products ADD COLUMN is_initial INTEGER DEFAULT 0");
        await tryAlter("ALTER TABLE products ADD COLUMN original_purchase_price REAL DEFAULT 0");
        await tryAlter("ALTER TABLE products ADD COLUMN original_sale_price REAL DEFAULT 0");
        await tryAlter("ALTER TABLE parties ADD COLUMN current_balance_usd REAL DEFAULT 0");
        await tryAlter("ALTER TABLE users ADD COLUMN mobile_permission TEXT DEFAULT 'full'");
        await tryAlter(`
          CREATE TABLE IF NOT EXISTS invoice_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
            party_name TEXT,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            amount REAL NOT NULL,
            details TEXT
          )
        `);
        
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
        await tryAlter("ALTER TABLE company_settings ADD COLUMN company_id TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_api_key TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_auth_domain TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_database_url TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_project_id TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_storage_bucket TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_messaging_sender_id TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN firebase_app_id TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN sales_pos_custom_html TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN purchase_pos_custom_html TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN reports_pos_custom_html TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN treasury_pos_custom_html TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN statement_pos_custom_html TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN exchange_rate REAL DEFAULT 0");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN financial_year_start TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN financial_year_end TEXT");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN server_mode TEXT DEFAULT 'offline'");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN server_url TEXT DEFAULT ''");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN local_server_active INTEGER DEFAULT 0");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN local_server_role TEXT DEFAULT 'client'");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN local_server_ip TEXT DEFAULT ''");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN local_server_port TEXT DEFAULT '3000'");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN cloud_tunnel_active INTEGER DEFAULT 0");
        await tryAlter("ALTER TABLE company_settings ADD COLUMN cloud_tunnel_url TEXT DEFAULT ''");

        if (dbInstance) {
          // Ensure General Expenses Fund exists
          const hasGeneralExpensesFund = await dbInstance.get("SELECT 1 FROM funds WHERE name = 'المصاريف العامة' AND is_system = 1 LIMIT 1");
          if (!hasGeneralExpensesFund) {
            await dbInstance.run("INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system) VALUES ('المصاريف العامة', 'مصاريف', 0, 0, 1)");
          }
        }

        // Generate Company ID if it doesn't exist
        if (dbInstance) {
          const settings = await dbInstance.get("SELECT id, company_id FROM company_settings LIMIT 1");
          if (settings && !settings.company_id) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let newCompanyId = '';
            for(let i=0; i<3; i++) newCompanyId += letters.charAt(Math.floor(Math.random() * letters.length));
            for(let i=0; i<3; i++) newCompanyId += Math.floor(Math.random() * 10).toString();
            await dbInstance.run("UPDATE company_settings SET company_id = ? WHERE id = ?", [newCompanyId, settings.id]);
          }
        }
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
      try {
        await dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS equipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            total_qty INTEGER DEFAULT 1,
            available_qty INTEGER DEFAULT 1,
            status TEXT DEFAULT 'available',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS equipment_loans (
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
        `);
      } catch (e) {
        console.error("Error creating equipment tables:", e);
      }

      try {
        await dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS fund_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_system INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS funds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            opening_balance_iqd REAL DEFAULT 0,
            opening_balance_usd REAL DEFAULT 0,
            is_system INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await tryAlter("ALTER TABLE funds ADD COLUMN is_system INTEGER DEFAULT 0");

        // Cleanup duplicate main funds
        await dbInstance.run(`UPDATE funds SET is_system = 1 WHERE name IN ('الصندوق الرئيسي', 'عميل نقدي', 'مورد نقدي')`);
        
        await dbInstance.run(`
          DELETE FROM funds 
          WHERE is_system = 1 
          AND id NOT IN (SELECT MIN(id) FROM funds WHERE is_system = 1 GROUP BY name)
        `);

        // Seed the main fund if not exists
        const mainFund = await dbInstance.get("SELECT id FROM funds WHERE is_system = 1 AND name = 'الصندوق الرئيسي' LIMIT 1");
        if (!mainFund) {
          await dbInstance.run(`
            INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system)
            VALUES ('الصندوق الرئيسي', 'صناديق اموال جاهزه', 0, 0, 1)
          `);
        }

        const cashFund = await dbInstance.get("SELECT id FROM funds WHERE is_system = 1 AND name = 'عميل نقدي' LIMIT 1");
        if (!cashFund) {
          await dbInstance.run(`
            INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system)
            VALUES ('عميل نقدي', 'صناديق اموال جاهزه', 0, 0, 1)
          `);
        }

        const supplierFund = await dbInstance.get("SELECT id FROM funds WHERE is_system = 1 AND name = 'مورد نقدي' LIMIT 1");
        if (!supplierFund) {
          await dbInstance.run(`
            INSERT INTO funds (name, category, opening_balance_iqd, opening_balance_usd, is_system)
            VALUES ('مورد نقدي', 'صناديق اموال جاهزه', 0, 0, 1)
          `);
        }

        // Journal Vouchers and Statements
        await dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS journal_vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_number TEXT UNIQUE NOT NULL,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            notes TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS journal_voucher_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_id INTEGER REFERENCES journal_vouchers(id) ON DELETE CASCADE,
            account_type TEXT NOT NULL, -- 'party' | 'fund' | 'general'
            account_id INTEGER,
            debit_iqd REAL DEFAULT 0,
            credit_iqd REAL DEFAULT 0,
            debit_usd REAL DEFAULT 0,
            credit_usd REAL DEFAULT 0,
            description TEXT,
            category TEXT
          );
        `);

        // Alter treasury_transactions to add fund_id
        await tryAlter("ALTER TABLE treasury_transactions ADD COLUMN fund_id INTEGER REFERENCES funds(id)");

        // Alter journal_voucher_entries to add category
        await tryAlter("ALTER TABLE journal_voucher_entries ADD COLUMN category TEXT");
        
        // Create role_permissions table
        await dbInstance.run(`
          CREATE TABLE IF NOT EXISTS role_permissions (
            role TEXT PRIMARY KEY,
            permissions TEXT
          );
        `);

      } catch (e) {
        console.error("Error creating funds/journal/permissions tables:", e);
      }
      // ------------------

      return dbInstance;
    } catch (err) {
      dbPromise = null;
      throw err;
    }
  })();
  
  return dbPromise;
}

export default {
  getDb,
  closeDb
};
