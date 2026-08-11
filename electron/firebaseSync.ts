import { getDb } from '../database/db';
import { db as realtimeDb } from './firebaseConfig';
import { ref, set } from 'firebase/database';

let syncInterval: NodeJS.Timeout | null = null;

export function initFirebaseSync() {
  console.log('Initializing Firebase Sync Service for Mobile App...');
  
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  
  // Initial sync on startup or re-init
  performSync();

  // Sync every 30 seconds
  syncInterval = setInterval(performSync, 30 * 1000);
}

export async function reInitFirebaseSync() {
  initFirebaseSync();
}

export async function performSync() {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');

    if (!settings || !settings.company_id) {
      return; // No company ID registered yet
    }

    const companyId = settings.company_id;

    // Helper: normalize currency to upper case and strip spaces — handles IQD/USD/$/دولار mixed cases
    const toCurrencyKey = (c: any): 'IQD' | 'USD' | 'OTHER' => {
      const s = String(c || '').trim().toUpperCase();
      if (s === 'USD' || s === '$' || s === 'دولار' || s === 'دولار أمريكي' || s === 'US') return 'USD';
      if (s === 'IQD' || s === 'د.ع' || s === 'دينار' || s === 'دينار عراقي' || s === 'IQ') return 'IQD';
      return s === 'USD' ? 'USD' : 'IQD';
    };

    // ===== ALL-TIME SALES BY CURRENCY =====
    const allInvoices = await db.all(`SELECT total, currency, type FROM invoices WHERE status IS NULL OR status != 'cancelled'`);
    let totalSalesIQD = 0, totalSalesUSD = 0, totalPurchasesIQD = 0, totalPurchasesUSD = 0;
    for (const inv of allInvoices) {
      const cur = toCurrencyKey(inv.currency);
      const t = Number(inv.total) || 0;
      if (String(inv.type) === 'sale') {
        if (cur === 'USD') totalSalesUSD += t; else totalSalesIQD += t;
      } else if (String(inv.type) === 'purchase') {
        if (cur === 'USD') totalPurchasesUSD += t; else totalPurchasesIQD += t;
      }
    }

    // ===== ALL-TIME TREASURY BALANCE (real treasury: income - expense) =====
    const allTreasury = await db.all(`SELECT amount, currency, type FROM treasury_transactions`);
    let treasuryBalanceIQD = 0, treasuryBalanceUSD = 0;
    for (const tx of allTreasury) {
      const cur = toCurrencyKey(tx.currency);
      const amt = Number(tx.amount) || 0;
      if (String(tx.type) === 'income') {
        if (cur === 'USD') treasuryBalanceUSD += amt; else treasuryBalanceIQD += amt;
      } else if (String(tx.type) === 'expense') {
        if (cur === 'USD') treasuryBalanceUSD -= amt; else treasuryBalanceIQD -= amt;
      }
    }

    // ===== PROFITS (as a different concept: sales - purchases) — keep both names for backwards compat
    const profitsIQD = totalSalesIQD - totalPurchasesIQD;
    const profitsUSD = totalSalesUSD - totalPurchasesUSD;

    // Total invoices count — ALL invoices
    const totalInvoices = await db.get(`SELECT COUNT(*) as count FROM invoices`);

    // Latest invoices
    const latestInvoices = await db.all(`
      SELECT i.id, i.invoice_number, i.total, i.currency, i.type, i.date, p.name as party_name 
      FROM invoices i
      LEFT JOIN parties p ON i.party_id = p.id
      ORDER BY i.id DESC LIMIT 5
    `);

    // Fetch alerts (Low stock)
    const lowStock = await db.all(`
      SELECT name, current_stock 
      FROM products 
      WHERE current_stock <= 5
      ORDER BY current_stock ASC LIMIT 5
    `);

    // Fetch users for mobile auth
    const users = await db.all(`SELECT id, username, name, role, profile_image, is_active, mobile_permission FROM users WHERE is_active = 1`);

    // Fetch all data for full sync
    const allSales = await db.all(`
      SELECT i.id, i.invoice_number, i.total, i.subtotal, i.discount_amount, i.currency, i.status, i.date, i.notes, i.payment_method, i.paid_amount, i.remaining_amount, i.party_id, i.buyer_name, i.type, p.name as customer 
      FROM invoices i LEFT JOIN parties p ON i.party_id = p.id WHERE i.type IN ('sale', 'sale_return') ORDER BY i.id DESC
    `);
    const allPurchases = await db.all(`
      SELECT i.id, i.invoice_number, i.total, i.subtotal, i.discount_amount, i.currency, i.status, i.date, i.notes, i.payment_method, i.paid_amount, i.remaining_amount, i.party_id, i.buyer_name, i.type, p.name as supplier 
      FROM invoices i LEFT JOIN parties p ON i.party_id = p.id WHERE i.type IN ('purchase', 'purchase_return') ORDER BY i.id DESC
    `);
    const inventory = await db.all(`
      SELECT p.*, c.name as category_name, u.name as unit_name, w.name as warehouse_name 
      FROM products p 
      LEFT JOIN product_categories c ON p.category_id = c.id 
      LEFT JOIN units u ON p.unit_id = u.id 
      LEFT JOIN warehouses w ON p.warehouse_id = w.id 
      ORDER BY p.id DESC
    `);
    const customers = await db.all(`SELECT * FROM parties WHERE type = 'customer' ORDER BY id DESC`);
    const suppliers = await db.all(`SELECT * FROM parties WHERE type = 'supplier' ORDER BY id DESC`);
    const treasury = await db.all(`
      SELECT t.*, p.name as party_name, p.type as party_type
      FROM treasury_transactions t
      LEFT JOIN parties p ON t.party_id = p.id
      WHERE t.invoice_id IS NULL
      ORDER BY t.id DESC
    `);
    const categories = await db.all(`SELECT * FROM product_categories ORDER BY id DESC`);
    const units = await db.all(`SELECT * FROM units ORDER BY id DESC`);
    const warehouses = await db.all(`SELECT * FROM warehouses ORDER BY id DESC`);
    const treasuryCategories = await db.all(`SELECT * FROM treasury_categories ORDER BY id DESC`);
    const funds = await db.all(`SELECT * FROM funds ORDER BY is_system DESC, id ASC`);
    const fundCategories = await db.all(`SELECT * FROM fund_categories ORDER BY id DESC`);

    // Fetch invoice items for each invoice
    const allInvoiceItems = await db.all(`
      SELECT ii.invoice_id, ii.id, ii.product_id, ii.quantity, ii.unit_price, ii.discount, ii.total, p.name as product_name, p.code as product_code
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      ORDER BY ii.invoice_id DESC, ii.id ASC
    `);

    // Fetch invoice expenses
    const allInvoiceExpenses = await db.all(`
      SELECT invoice_id, party_name, date, amount, details
      FROM invoice_expenses
    `);

    // Fetch Journal Vouchers
    const allJournalVouchers = await db.all(`SELECT * FROM journal_vouchers ORDER BY id DESC`);
    const allJournalEntries = await db.all(`SELECT * FROM journal_voucher_entries ORDER BY voucher_id DESC, id ASC`);
    
    // Attach entries to journal vouchers
    const journalVouchersWithEntries = allJournalVouchers.map((jv: any) => ({
      ...jv,
      entries: allJournalEntries.filter((je: any) => je.voucher_id === jv.id)
    }));

    // Attach items and expenses to their respective invoices
    const salesWithItems = allSales.map((inv: any) => ({
      ...inv,
      items: allInvoiceItems.filter((item: any) => item.invoice_id === inv.id),
      additional_expenses: allInvoiceExpenses.filter((exp: any) => exp.invoice_id === inv.id)
    }));
    const purchasesWithItems = allPurchases.map((inv: any) => ({
      ...inv,
      items: allInvoiceItems.filter((item: any) => item.invoice_id === inv.id),
      additional_expenses: allInvoiceExpenses.filter((exp: any) => exp.invoice_id === inv.id)
    }));

    // Helper function to convert array to object keyed by id
    const arrayToObject = (arr: any[]) => {
      const obj: any = {};
      arr.forEach(item => {
        if (item.id !== undefined) {
          obj[item.id] = item;
        }
      });
      return obj;
    };

    const syncData = {
      dashboard: {
        stats: {
          totalSalesIQD,
          totalSalesUSD,
          totalPurchasesIQD,
          totalPurchasesUSD,
          profitsIQD,
          profitsUSD,
          treasuryBalanceIQD,
          treasuryBalanceUSD,
          totalInvoicesCount: totalInvoices?.count || 0,
        },
        latestInvoices: latestInvoices.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          total: inv.total,
          currency: inv.currency,
          type: inv.type, // 'sale' or 'purchase'
          date: inv.date,
          party_name: inv.party_name
        })),
        alerts: lowStock.map((ls: any) => ({
          name: ls.name,
          current_stock: ls.current_stock
        })),
        lastSync: Date.now()
      },
      users: arrayToObject(users),
      settings: settings,
      sales: arrayToObject(salesWithItems),
      purchases: arrayToObject(purchasesWithItems),
      inventory: arrayToObject(inventory),
      customers: arrayToObject(customers),
      suppliers: arrayToObject(suppliers),
      treasury: arrayToObject(treasury),
      categories: arrayToObject(categories),
      units: arrayToObject(units),
      warehouses: arrayToObject(warehouses),
      treasuryCategories: arrayToObject(treasuryCategories),
      funds: arrayToObject(funds),
      fundCategories: arrayToObject(fundCategories),
      journalVouchers: arrayToObject(journalVouchersWithEntries)
    };

    const syncRef = ref(realtimeDb, `mobile_sync/${companyId}`);
    await set(syncRef, syncData);
    
    // Update active companies listing just in case
    const activeCompanyRef = ref(realtimeDb, `active_companies/${companyId}`);
    await set(activeCompanyRef, { active: true, name: settings.name || 'Company', updated_at: Date.now() });

  } catch (error) {
    console.error('Error in Firebase Sync:', error);
  }
}
