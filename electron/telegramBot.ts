import TelegramBot from 'node-telegram-bot-api';
import { getDb } from '../database/db';

let bot: TelegramBot | null = null;
let currentToken: string | null = null;

// State management for bot users
type UserState = {
  step: 'MAIN_MENU' | 'DETAILED_MENU' | 'DATE_SELECTION' | 'CUSTOM_DATE_INPUT' | string;
  reportType?: string;
  itemName?: string;
};
const userStates: Record<number, UserState> = {};

const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().split('T')[0];
};

const getRelativeDateString = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const getMonthStartEnd = (offsetMonths: number = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const tzOffsetStart = start.getTimezoneOffset() * 60000;
  const tzOffsetEnd = end.getTimezoneOffset() * 60000;
  
  return {
    start: new Date(start.getTime() - tzOffsetStart).toISOString().split('T')[0],
    end: new Date(end.getTime() - tzOffsetEnd).toISOString().split('T')[0]
  };
};

const getYearStartEnd = () => {
  const year = new Date().getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
};

export async function initTelegramBot() {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');

    if (!settings) return;

    const {
      telegram_bot_token,
      telegram_bot_enabled,
      telegram_chat_id
    } = settings;

    // If bot is disabled or token is missing, stop existing bot
    if (!telegram_bot_enabled || !telegram_bot_token) {
      if (bot) {
        try {
          await bot.stopPolling();
        } catch (e) {
          console.error('Error stopping telegram bot', e);
        }
        bot = null;
        currentToken = null;
        console.log('Telegram Bot stopped.');
      }
      return;
    }

    // If token changed or bot not started, start it
    if (telegram_bot_token !== currentToken || !bot) {
      if (bot) {
        await bot.stopPolling();
      }
      bot = new TelegramBot(telegram_bot_token, { polling: true });
      
      bot.on('polling_error', (error: any) => {
        if (error.code === 'EFATAL') {
          // Suppress repetitive fetch failed errors when offline or API blocked
        } else {
          console.error('Telegram Bot Polling Error:', error.message || error);
        }
      });
      
      currentToken = telegram_bot_token;
      console.log('Telegram Bot started.');

      setupBotCommands(bot);

      // Notify the configured chat ID that the bot is online
      if (telegram_chat_id) {
        bot.sendMessage(telegram_chat_id, '✅ النظام يعمل الآن، البوت متصل. أرسل /start لعرض القائمة.').catch(e => console.error("Could not send startup message", e));
      }
    }
  } catch (error) {
    console.error('Failed to initialize Telegram Bot:', error);
  }
}

function getMainMenuKeyboard(settings: any) {
  const keyboard = [];
  let row = [];
  
  // Add quick daily reports
  if (settings.telegram_sales_report) row.push({ text: '📊 مبيعات اليوم' });
  if (settings.telegram_income_statement) row.push({ text: '💰 دخل اليوم' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_purchases_report) row.push({ text: '🛒 مشتريات اليوم' });
  if (settings.telegram_inventory_movement) row.push({ text: '🔄 حركة اليوم' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_customer_balances) row.push({ text: '👥 العملاء والموردين' });
  if (settings.telegram_balance_sheet) row.push({ text: '⚖️ الميزانية' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_purchase_prices) row.push({ text: '🏷️ أسعار اليوم' });
  if (row.length > 0) { keyboard.push(row); }

  // Add Detailed Menu Button
  keyboard.push([{ text: '📄 كشف تفصيلي' }]);

  return {
    reply_markup: {
      keyboard: keyboard,
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

function getDetailedMenuKeyboard(settings: any) {
  const keyboard = [];
  let row = [];
  
  if (settings.telegram_sales_report) row.push({ text: '📊 مبيعات تفصيلي' });
  if (settings.telegram_income_statement) row.push({ text: '💰 دخل تفصيلي' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_purchases_report) row.push({ text: '🛒 مشتريات تفصيلي' });
  if (settings.telegram_inventory_movement) row.push({ text: '🔄 حركة المخزون' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_customer_balances) row.push({ text: '👥 أرصدة العملاء' });
  if (settings.telegram_balance_sheet) row.push({ text: '⚖️ الميزانية العمومية' });
  if (row.length === 2) { keyboard.push(row); row = []; }
  
  if (settings.telegram_purchase_prices) row.push({ text: '🏷️ كشف تغيير الأسعار' });
  if (row.length > 0) { keyboard.push(row); }

  keyboard.push([{ text: '🔙 رجوع للقائمة الرئيسية' }]);

  return {
    reply_markup: {
      keyboard: keyboard,
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

function getPriceVariationsKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '🔍 كشف سعر مادة' }, { text: '📋 كشف جميع المواد' }],
        [{ text: '🔙 الرجوع للقائمة التفصيلية' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

function getPartiesMenuKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '👥 العملاء' }, { text: '🏢 الموردين' }],
        [{ text: '🔙 رجوع للقائمة الرئيسية' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

function getDateSelectionKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📅 اليوم' }, { text: '📅 الأمس' }],
        [{ text: '📅 آخر 7 أيام' }, { text: '📅 هذا الشهر' }],
        [{ text: '📅 الشهر الماضي' }, { text: '📅 هذه السنة' }],
        [{ text: '⌨️ إدخال تاريخ مخصص' }],
        [{ text: '🔙 إلغاء والرجوع للقائمة' }]
      ],
      resize_keyboard: true,
      is_persistent: true
    }
  };
}

function setupBotCommands(bot: TelegramBot) {
  const commandsList = [];
  commandsList.push({ command: 'start', description: 'عرض القائمة الرئيسية' });
  bot.setMyCommands(commandsList).catch(e => console.error("Error setting bot commands:", e));

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
    if (!settings) return;

    if (settings.telegram_chat_id && settings.telegram_chat_id !== String(chatId)) {
       return bot.sendMessage(chatId, '⛔ غير مصرح لك باستخدام هذا البوت.');
    }
    
    userStates[chatId] = { step: 'MAIN_MENU' };
    const welcomeMsg = `📦 مرحبآ بك في نظام المخزن برو \n🏢 هذا البوت مخصص الى شركة الاسرة (ادارة المخازن)\n💻 تم التطوير البوت : المطور برو الحلول البرمجية\n🌐 الموقع الاكتروني https://pro.iqa5.site/\n✅ الرجاء اختيار أحد التقارير من القائمة :`;
    bot.sendMessage(chatId, welcomeMsg, getMainMenuKeyboard(settings));
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    
    if (text === '/start') return;
    
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
    if (!settings) return;

    if (settings.telegram_chat_id && settings.telegram_chat_id !== String(chatId)) {
        bot.sendMessage(chatId, '⛔ المعذرة، غير مصرح لك بطلب التقارير.');
        return;
    }

    if (!userStates[chatId]) {
      userStates[chatId] = { step: 'MAIN_MENU' };
    }

    const state = userStates[chatId];
    const today = getTodayDateString();

    // 1. Navigation
    if (text === '🔙 رجوع للقائمة الرئيسية') {
      state.step = 'MAIN_MENU';
      return bot.sendMessage(chatId, 'تم العودة للقائمة الرئيسية.', getMainMenuKeyboard(settings));
    }
    
    if (text === '🔙 إلغاء والرجوع للقائمة') {
      if (state.reportType === '📋 كشف جميع المواد' || state.reportType === '🔍 كشف سعر مادة') {
        state.step = 'PRICE_VARIATIONS_MENU';
        state.reportType = undefined;
        return bot.sendMessage(chatId, 'تم إلغاء تحديد التاريخ.', getPriceVariationsKeyboard());
      } else {
        state.step = 'DETAILED_MENU';
        state.reportType = undefined;
        return bot.sendMessage(chatId, 'تم إلغاء تحديد التاريخ.', getDetailedMenuKeyboard(settings));
      }
    }

    if (text === '🔙 الرجوع للقائمة التفصيلية') {
      state.step = 'DETAILED_MENU';
      return bot.sendMessage(chatId, 'تم العودة للقائمة التفصيلية.', getDetailedMenuKeyboard(settings));
    }

    if (text === '📄 كشف تفصيلي') {
      state.step = 'DETAILED_MENU';
      return bot.sendMessage(chatId, 'اختر التقرير التفصيلي الذي تريده:', getDetailedMenuKeyboard(settings));
    }

    // 2. Main Menu Quick Reports
    if (state.step === 'MAIN_MENU') {
      if (text === '📊 مبيعات اليوم' || text === '/sales') return sendSalesReport(chatId, today, today, db, settings);
      if (text === '💰 دخل اليوم' || text === '/income') return sendIncomeStatement(chatId, today, today, db, settings);
      if (text === '🛒 مشتريات اليوم' || text === '/purchases') return sendPurchasesReport(chatId, today, today, db, settings);
      if (text === '🔄 حركة اليوم' || text === '/inventory') return sendInventoryMovement(chatId, today, today, db, settings);
      if (text === '👥 العملاء والموردين' || text === '/parties') {
        state.step = 'PARTIES_MENU';
        return bot.sendMessage(chatId, 'اختر نوع الحسابات:', getPartiesMenuKeyboard());
      }
      if (text === '⚖️ الميزانية' || text === '/balancesheet') return sendBalanceSheet(chatId, db, settings);
      if (text === '🏷️ أسعار اليوم' || text === '/prices') return sendPriceVariationsReport(chatId, today, today, null, db, settings);
    }

    // 3. Detailed Menu Selection
    if (state.step === 'DETAILED_MENU') {
      if (text === '🏷️ كشف تغيير الأسعار') {
        state.step = 'PRICE_VARIATIONS_MENU';
        return bot.sendMessage(chatId, 'اختر نوع كشف تغير الأسعار:', getPriceVariationsKeyboard());
      }

      // Some reports don't need dates (like Customer Balances and Balance Sheet)
      if (text === '👥 أرصدة العملاء') return sendCustomersReport(chatId, db, settings);
      if (text === '⚖️ الميزانية العمومية') return sendBalanceSheet(chatId, db, settings);

      const requiresDate = ['📊 مبيعات تفصيلي', '💰 دخل تفصيلي', '🛒 مشتريات تفصيلي', '🔄 حركة المخزون'].includes(text);
      if (requiresDate) {
        state.step = 'DATE_SELECTION';
        state.reportType = text;
        return bot.sendMessage(chatId, `اختر الفترة الزمنية لـ (${text}):`, getDateSelectionKeyboard());
      }
    }

    // 3.5 Price Variations Menu
    if (state.step === 'PRICE_VARIATIONS_MENU') {
      if (text === '📋 كشف جميع المواد') {
        state.step = 'DATE_SELECTION';
        state.reportType = text;
        return bot.sendMessage(chatId, `اختر الفترة الزمنية لكشف جميع المواد:`, getDateSelectionKeyboard());
      }
      if (text === '🔍 كشف سعر مادة') {
        state.step = 'PRICE_VAR_ITEM_NAME';
        return bot.sendMessage(chatId, 'يرجى كتابة اسم المادة (الصنف) للبحث عنها:', { reply_markup: { remove_keyboard: true } });
      }
    }

    if (state.step === 'PRICE_VAR_ITEM_NAME') {
      state.itemName = text;
      state.step = 'DATE_SELECTION';
      state.reportType = '🔍 كشف سعر مادة';
      return bot.sendMessage(chatId, `لقد اخترت المادة: ${text}\nالآن اختر الفترة الزمنية:`, getDateSelectionKeyboard());
    }

    if (state.step === 'PARTIES_MENU') {
      if (text === '👥 العملاء') return sendCustomersReport(chatId, db, settings);
      if (text === '🏢 الموردين') return sendSuppliersReport(chatId, db, settings);
    }

    // 4. Date Selection
    if (state.step === 'DATE_SELECTION') {
      if (text === '⌨️ إدخال تاريخ مخصص') {
        state.step = 'CUSTOM_DATE_INPUT';
        return bot.sendMessage(chatId, 'أدخل التاريخ بالصيغة التالية:\n`YYYY-MM-DD الى YYYY-MM-DD`\nأو يوم واحد:\n`YYYY-MM-DD`', {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true } // hide keyboard temporarily
        });
      }

      let start = today, end = today;
      if (text === '📅 اليوم') { start = today; end = today; }
      else if (text === '📅 الأمس') { const yesterday = getRelativeDateString(-1); start = yesterday; end = yesterday; }
      else if (text === '📅 آخر 7 أيام') { start = getRelativeDateString(-6); end = today; }
      else if (text === '📅 هذا الشهر') { const p = getMonthStartEnd(0); start = p.start; end = p.end; }
      else if (text === '📅 الشهر الماضي') { const p = getMonthStartEnd(-1); start = p.start; end = p.end; }
      else if (text === '📅 هذه السنة') { const p = getYearStartEnd(); start = p.start; end = p.end; }
      else return; // Ignore unknown

      return handleDetailedReportTrigger(chatId, start, end, state, db, settings);
    }

    // 5. Custom Date Input
    if (state.step === 'CUSTOM_DATE_INPUT') {
      let start, end;
      if (text.includes('الى')) {
        const parts = text.split('الى').map(s => s.trim());
        start = parts[0];
        end = parts[1];
      } else {
        start = text.trim();
        end = text.trim();
      }

      // Very basic validation
      if (!start.match(/^\d{4}-\d{2}-\d{2}$/) || !end.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return bot.sendMessage(chatId, '❌ صيغة التاريخ غير صحيحة. يرجى الإدخال بصيغة YYYY-MM-DD (مثال: 2026-01-01)');
      }

      return handleDetailedReportTrigger(chatId, start, end, state, db, settings);
    }
  });

  async function handleDetailedReportTrigger(chatId: number, start: string, end: string, state: UserState, db: any, settings: any) {
    const reportType = state.reportType;
    
    // reset state
    state.step = 'DETAILED_MENU';
    state.reportType = undefined;
    
    bot.sendMessage(chatId, `جاري استخراج البيانات من ${start} إلى ${end}...`);

    if (reportType === '📊 مبيعات تفصيلي') await sendSalesReport(chatId, start, end, db, settings);
    else if (reportType === '💰 دخل تفصيلي') await sendIncomeStatement(chatId, start, end, db, settings);
    else if (reportType === '🛒 مشتريات تفصيلي') await sendPurchasesReport(chatId, start, end, db, settings);
    else if (reportType === '🔄 حركة المخزون') await sendInventoryMovement(chatId, start, end, db, settings);
    else if (reportType === '📋 كشف جميع المواد') await sendPriceVariationsReport(chatId, start, end, null, db, settings);
    else if (reportType === '🔍 كشف سعر مادة') await sendPriceVariationsReport(chatId, start, end, state.itemName || null, db, settings);

    // Show menu again
    bot.sendMessage(chatId, 'اختر تقريراً آخر أو ارجع للقائمة:', getDetailedMenuKeyboard(settings));
  }

  const formatNum = (num: any) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US');
  };

  // --- Report Generation Functions ---

  async function sendSalesReport(chatId: number, start: string, end: string, db: any, settings: any) {
    if (!settings.telegram_sales_report) return bot.sendMessage(chatId, '⚠️ تقرير المبيعات غير مفعل.');
    try {
      const sales = await db.all(`
        SELECT i.invoice_number, i.total, i.currency, i.date, p.name as party_name
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'sale' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      
      let reply = `📊 *تقرير المبيعات*\nمن ${start} إلى ${end}\n\n`;
      let totalSales = 0;
      sales.forEach((s: any) => {
        reply += `- [${s.date}] ${s.invoice_number}: ${formatNum(s.total)} ${s.currency} (${s.party_name || 'نقدي'})\n`;
        totalSales += s.total;
      });
      reply += `\n*الإجمالي للفترة: ${formatNum(totalSales)}*`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب تقرير المبيعات.');
    }
  }

  async function sendIncomeStatement(chatId: number, start: string, end: string, db: any, settings: any) {
    if (!settings.telegram_income_statement) return bot.sendMessage(chatId, '⚠️ قائمة الدخل غير مفعلة.');
    try {
      const revenues = await db.all(`SELECT SUM(amount) as value FROM treasury_transactions WHERE type = 'income' AND date BETWEEN ? AND ?`, [start, end]);
      const expenses = await db.all(`SELECT SUM(amount) as value FROM treasury_transactions WHERE type = 'expense' AND date BETWEEN ? AND ?`, [start, end]);
      const rev = revenues[0]?.value || 0;
      const exp = expenses[0]?.value || 0;
      const net = rev - exp;
      
      let reply = `💰 *قائمة الدخل*\nمن ${start} إلى ${end}\n\n`;
      reply += `🟢 الإيرادات: ${formatNum(rev)}\n`;
      reply += `🔴 المصروفات: ${formatNum(exp)}\n`;
      reply += `================\n`;
      reply += `*صافي الدخل: ${formatNum(net)}*`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب قائمة الدخل.');
    }
  }

  async function sendPurchasesReport(chatId: number, start: string, end: string, db: any, settings: any) {
    if (!settings.telegram_purchases_report) return bot.sendMessage(chatId, '⚠️ تقرير المشتريات غير مفعل.');
    try {
      const purchases = await db.all(`
        SELECT i.invoice_number, i.total, i.currency, i.date, p.name as party_name
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      
      let reply = `🛒 *تقرير المشتريات*\nمن ${start} إلى ${end}\n\n`;
      let totalPurchases = 0;
      purchases.forEach((s: any) => {
        reply += `- [${s.date}] ${s.invoice_number}: ${formatNum(s.total)} ${s.currency} (${s.party_name || 'نقدي'})\n`;
        totalPurchases += s.total;
      });
      reply += `\n*الإجمالي للفترة: ${formatNum(totalPurchases)}*`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب المشتريات.');
    }
  }

  async function sendInventoryMovement(chatId: number, start: string, end: string, db: any, settings: any) {
    if (!settings.telegram_inventory_movement) return bot.sendMessage(chatId, '⚠️ تقرير حركة المخزون غير مفعل.');
    try {
      const movement = await db.all(`
        SELECT p.name, 
               SUM(CASE WHEN i.type = 'purchase' OR i.type = 'sale_return' THEN ii.quantity ELSE 0 END) as inward, 
               SUM(CASE WHEN i.type = 'sale' OR i.type = 'purchase_return' THEN ii.quantity ELSE 0 END) as outward
        FROM products p 
        LEFT JOIN invoice_items ii ON p.id = ii.product_id 
        LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.date BETWEEN ? AND ?
        GROUP BY p.id HAVING inward > 0 OR outward > 0
      `, [start, end]);
      
      let reply = `🔄 *حركة المخزون*\nمن ${start} إلى ${end}\n\n`;
      if (movement.length === 0) reply += "لا توجد حركة في هذه الفترة.";
      movement.forEach((m: any) => {
        reply += `📦 ${m.name}: +${formatNum(m.inward)} | -${formatNum(m.outward)}\n`;
      });
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب حركة المخزون.');
    }
  }

  async function sendCustomersReport(chatId: number, db: any, settings: any) {
    if (!settings.telegram_customer_balances) return bot.sendMessage(chatId, '⚠️ أرصدة العملاء غير مفعلة.');
    try {
      const customers = await db.all(`SELECT name, current_balance_iqd, current_balance_usd FROM parties WHERE type = 'customer' ORDER BY current_balance_iqd DESC LIMIT 30`);
      let reply = `👥 *أرصدة العملاء الحالية (أعلى 30)*\n\n`;
      if (customers.length === 0) reply += "لا يوجد عملاء مسجلين.";
      customers.forEach((c: any) => {
        reply += `👤 ${c.name}: ${formatNum(c.current_balance_iqd)} دينار | ${formatNum(c.current_balance_usd)} دولار\n`;
      });
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب أرصدة العملاء.');
    }
  }

  async function sendSuppliersReport(chatId: number, db: any, settings: any) {
    if (!settings.telegram_customer_balances) return bot.sendMessage(chatId, '⚠️ أرصدة الموردين غير مفعلة.');
    try {
      const suppliers = await db.all(`SELECT name, current_balance_iqd, current_balance_usd FROM parties WHERE type = 'supplier' ORDER BY current_balance_iqd DESC LIMIT 30`);
      let reply = `🏢 *أرصدة الموردين الحالية (أعلى 30)*\n\n`;
      if (suppliers.length === 0) reply += "لا يوجد موردين مسجلين.";
      suppliers.forEach((s: any) => {
        reply += `🏢 ${s.name}: ${formatNum(s.current_balance_iqd)} دينار | ${formatNum(s.current_balance_usd)} دولار\n`;
      });
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب أرصدة الموردين.');
    }
  }

  async function sendBalanceSheet(chatId: number, db: any, settings: any) {
    if (!settings.telegram_balance_sheet) return bot.sendMessage(chatId, '⚠️ الميزانية العمومية غير مفعلة.');
    try {
      const treasury = await db.get(`SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance FROM treasury_transactions`);
      const inventory = await db.get(`SELECT SUM(current_stock * purchase_price) as value FROM products`);
      const customers = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'customer'`);
      const suppliers = await db.get(`SELECT SUM(current_balance_iqd) as total FROM parties WHERE type = 'supplier'`);
      
      let reply = `⚖️ *الميزانية العمومية الحالية*\n\n`;
      reply += `*الأصول:*\n`;
      reply += `- نقدية بالخزينة: ${formatNum(treasury?.balance || 0)}\n`;
      reply += `- قيمة المخزون: ${formatNum(inventory?.value || 0)}\n`;
      reply += `- ذمم عملاء: ${formatNum(customers?.total || 0)}\n\n`;
      reply += `*الخصوم:*\n`;
      reply += `- ذمم موردين: ${formatNum(suppliers?.total || 0)}\n`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب الميزانية.');
    }
  }

  async function sendPriceVariationsReport(chatId: number, start: string, end: string, itemName: string | null, db: any, settings: any) {
    if (!settings.telegram_purchase_prices) return bot.sendMessage(chatId, '⚠️ كشف تغيير الأسعار غير مفعل.');
    try {
      let query = `
        SELECT p.name, ii.unit_price, ii.quantity, i.date, i.invoice_number
        FROM invoice_items ii 
        JOIN invoices i ON ii.invoice_id = i.id 
        JOIN products p ON ii.product_id = p.id
        WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
      `;
      const params: any[] = [start, end];

      if (itemName && itemName.trim() !== '') {
        query += ` AND p.name LIKE ?`;
        params.push(`%${itemName}%`);
      }

      query += ` ORDER BY i.date DESC LIMIT 50`;

      const prices = await db.all(query, ...params);
      let reply = itemName ? `🔍 *كشف سعر مادة (${itemName})*\nمن ${start} إلى ${end}\n\n` : `📋 *كشف تغير أسعار جميع المواد*\nمن ${start} إلى ${end}\n\n`;
      if (prices.length === 0) reply += "لا توجد حركات شراء خلال هذه الفترة.";
      prices.forEach((p: any) => {
        reply += `🔹 المادة: ${p.name}\nالسعر: ${formatNum(p.unit_price)} | الكمية: ${p.quantity}\nالتاريخ: ${p.date} | الفاتورة: ${p.invoice_number}\n\n`;
      });
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب كشف تغير الأسعار.');
    }
  }
}
