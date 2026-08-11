import TelegramBot from 'node-telegram-bot-api';
import { getDb } from '../database/db';
import { db as realtimeDb } from './firebaseConfig';
import { ref, set, onChildAdded, remove } from 'firebase/database';

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
      // إيقاف الـ Polling لتجنب التعارض
      bot = new TelegramBot(telegram_bot_token, { polling: false });
      
      // التعديل السحري لتجاوز حظر تيليجرام: 
      // توجيه كل رسائل البوت إلى سيرفر Vercel بدلاً من تيليجرام مباشرة
      bot.sendMessage = async (chatId: any, text: string, options?: any) => {
        try {
          const response = await fetch('https://firebase-bot-webhook.vercel.app/sendReply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, text, options })
          });
          if (!response.ok) {
            console.error('Failed to send message via Vercel Proxy:', await response.text());
          }
          return {} as any; // Dummy return
        } catch (error) {
          console.error('Error connecting to Vercel Proxy:', error);
          return {} as any;
        }
      };

      currentToken = telegram_bot_token;
      console.log('Telegram Bot started (Firebase Mode).');

      setupBotCommands(bot);

      // --- Firebase Integration (Realtime DB) ---
      if (settings.company_id) {
        try {
          // تسجيل الشركة في سيرفر Firebase
          const activeCompanyRef = ref(realtimeDb, `active_companies/${settings.company_id}`);
          await set(activeCompanyRef, { active: true, name: settings.name || 'Company', updated_at: Date.now() });

          // التنصت على الطلبات الواردة من Firebase
          const commandsRef = ref(realtimeDb, `company_requests/${settings.company_id}/commands`);
          
          onChildAdded(commandsRef, async (snapshot) => {
            const data = snapshot.val();
            if (!data) return;
            const key = snapshot.key;
            
            // تحويل الطلب إلى رسالة تيليجرام وهمية لتمريرها للكود الحالي
            const mockMsg = {
              message_id: Math.floor(Math.random() * 1000000),
              chat: { id: parseInt(data.chat_id), type: 'private' },
              text: data.text,
              date: Math.floor(Date.now() / 1000)
            };
            
            try {
              bot?.processUpdate({ update_id: Math.floor(Math.random() * 1000000), message: mockMsg as any });
            } catch(e) { console.error(e); }

            // حذف الطلب بعد تنفيذه
            await remove(ref(realtimeDb, `company_requests/${settings.company_id}/commands/${key}`));
          });
        } catch (e) {
          console.error("Firebase connection error: ", e);
        }
      }
      // ----------------------------

      // Notify the configured chat ID that the bot is online
      if (telegram_chat_id) {
        bot.sendMessage(telegram_chat_id, '🟢 تم تشغيل النظام وبوت تليجرام يعمل الآن. اكتب /start لعرض القائمة.').catch(_e => console.log("تنبيه: لم يتمكن البوت من إرسال رسالة البدء (محجوب أو لا يوجد إنترنت)."));
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

  // Add Technical Support Button
  keyboard.push([{ text: '📞 الدعم الفني' }]);

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
  
  if (settings.telegram_purchase_prices) row.push({ text: '📑 تقرير تغير أسعار الموردين' });
  row.push({ text: '📦 تقرير الكميات المتبقية في المخزن' });
  if (row.length > 0) { keyboard.push(row); row = []; }

  keyboard.push([{ text: '💰 تقرير الخزينة والصناديق' }, { text: '🛠️ تقرير المعدات والأصول' }]);
  
  keyboard.push([{ text: '🔙 العودة للقائمة الرئيسية' }]);

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
  // bot.setMyCommands(commandsList).catch(e => console.log("تنبيه: لم يتمكن البوت من الاتصال بتليجرام (قد يكون محجوباً أو لا يوجد إنترنت)."));

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
    if (!settings) return;

    userStates[chatId] = { step: 'MAIN_MENU' };
    const companyName = settings.name || 'شركتك';
    const welcomeMsg = `✨ مرحباً بك في نظام إدارة المخازن ✨\n🏢 الخاص بـ: ${companyName}\n\n👨‍💻 تطوير: المطور برو الحلول البرمجية\n🌐 الموقع: https://pro.iqa5.site/\n\n👇 الرجاء اختيار أحد التقارير من القائمة:`;
    return bot.sendMessage(chatId, welcomeMsg, getMainMenuKeyboard(settings));
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    
    if (text === '/start') return;
    
    const db = await getDb();
    const settings = await db.get('SELECT * FROM company_settings LIMIT 1');
    if (!settings) return;

    if (!userStates[chatId]) {
      userStates[chatId] = { step: 'MAIN_MENU' };
    }

    const state = userStates[chatId];

    const today = getTodayDateString();

    // 1. Navigation
    if (text === '🔙 رجوع للقائمة الرئيسية' || text === '🔙 العودة للقائمة الرئيسية') {
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

    if (text === '📞 الدعم الفني') {
      return bot.sendMessage(chatId, 'تواصل معنا أو انضم لمجتمعنا عبر الروابط التالية:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📢 القناة', url: 'https://t.me/prosastam1' },
              { text: '👥 الكروب', url: 'https://t.me/prosastam2' }
            ]
          ]
        }
      });
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
      if (text === '📑 تقرير تغير أسعار الموردين') {
        state.step = 'PRICE_VARIATIONS_MENU';
        return bot.sendMessage(chatId, 'اختر نوع كشف تغير الأسعار:', getPriceVariationsKeyboard());
      }

      // Some reports don't need dates (like Customer Balances and Balance Sheet)
      if (text === '👥 أرصدة العملاء') return sendCustomersReport(chatId, db, settings);
      if (text === '⚖️ الميزانية العمومية') return sendBalanceSheet(chatId, db, settings);
      if (text === '💰 تقرير الخزينة والصناديق') return sendTreasuryReport(chatId, db, settings);
      if (text === '🛠️ تقرير المعدات والأصول') return sendEquipmentReport(chatId, db, settings);

      const requiresDate = ['📊 مبيعات تفصيلي', '💰 دخل تفصيلي', '🛒 مشتريات تفصيلي', '🔄 حركة المخزون', '📦 تقرير الكميات المتبقية في المخزن'].includes(text);
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
    else if (reportType === '📦 تقرير الكميات المتبقية في المخزن') await sendRemainingQuantitiesReport(chatId, start, end, db, settings);
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
        SELECT i.id, i.invoice_number, i.total, i.currency, i.date, p.name as party_name
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'sale' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      
      let reply = `📊 *تقرير المبيعات*\nمن ${start} إلى ${end}\n\n`;
      let totalSales = 0;
      
      for (const s of sales) {
        const items = await db.all(`
          SELECT ii.quantity, pr.name as product_name
          FROM invoice_items ii
          LEFT JOIN products pr ON ii.product_id = pr.id
          WHERE ii.invoice_id = ?
        `, [s.id]);

        reply += `📅 التاريخ: ${s.date}\n`;
        reply += `👤 اسم العميل: ${s.party_name || 'نقدي'}\n`;
        reply += `🧾 رقم الفاتورة: ${s.invoice_number}\n`;
        
        if (items && items.length > 0) {
          reply += `📦 الأصناف والكميات:\n`;
          items.forEach((it: any) => {
            reply += `   - ${it.product_name || 'غير معروف'} (الكمية: ${it.quantity})\n`;
          });
        }
        
        reply += `💰 الاجمالي: ${formatNum(s.total)} ${s.currency}\n`;
        reply += `-------------------------\n`;
        totalSales += s.total;
      }

      if (sales.length === 0) {
        reply += `لا توجد مبيعات في هذه الفترة.\n`;
      } else {
        reply += `\n*الإجمالي الكلي للفترة: ${formatNum(totalSales)}*`;
      }

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
        SELECT i.id, i.invoice_number, i.total, i.currency, i.date, i.buyer_name, p.name as party_name, p.phone as party_phone
        FROM invoices i LEFT JOIN parties p ON i.party_id = p.id
        WHERE i.type = 'purchase' AND i.date BETWEEN ? AND ?
        ORDER BY i.date ASC
      `, [start, end]);
      
      let reply = `🛒 *تقرير المشتريات*\nمن ${start} إلى ${end}\n\n`;
      let totalPurchases = 0;
      
      for (const s of purchases) {
        const items = await db.all(`
          SELECT ii.quantity, ii.unit_price, pr.name as product_name
          FROM invoice_items ii
          LEFT JOIN products pr ON ii.product_id = pr.id
          WHERE ii.invoice_id = ?
        `, [s.id]);

        reply += `📅 التاريخ: ${s.date}\n`;
        reply += `🏢 اسم المورد: ${s.party_name || 'نقدي'}\n`;
        reply += `📞 رقم الهاتف: ${s.party_phone || 'غير متوفر'}\n`;
        reply += `👤 اسم المشتري: ${s.buyer_name || 'غير متوفر'}\n`;
        reply += `🧾 رقم الفاتورة: ${s.invoice_number}\n`;
        
        if (items && items.length > 0) {
          reply += `📦 الأصناف والكميات:\n`;
          items.forEach((it: any) => {
            reply += `   - ${it.product_name || 'غير معروف'} (الكمية: ${it.quantity} | السعر: ${formatNum(it.unit_price)})\n`;
          });
        }
        
        reply += `💰 الاجمالي: ${formatNum(s.total)} ${s.currency}\n`;
        reply += `-------------------------\n`;
        totalPurchases += s.total;
      }

      if (purchases.length === 0) {
        reply += `لا توجد مشتريات في هذه الفترة.\n`;
      } else {
        reply += `\n*الإجمالي الكلي للفترة: ${formatNum(totalPurchases)}*`;
      }

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

  async function sendRemainingQuantitiesReport(chatId: number, start: string, end: string, db: any, _settings: any) {
    try {
      const remaining = await db.all(`
        SELECT p.name, 
               p.current_stock,
               p.is_initial,
               COALESCE(SUM(CASE WHEN i.type = 'purchase' OR i.type = 'sale_return' THEN ii.quantity ELSE 0 END), 0) as inward_after,
               COALESCE(SUM(CASE WHEN i.type = 'sale' OR i.type = 'purchase_return' THEN ii.quantity ELSE 0 END), 0) as outward_after
        FROM products p
        LEFT JOIN invoice_items ii ON p.id = ii.product_id
        LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.date > ?
        GROUP BY p.id
      `, [end]);
      
      let finalProducts = '';
      let initialProducts = '';
      let totalItems = 0;
      
      for (const r of remaining) {
        const stockAtEnd = r.current_stock - r.inward_after + r.outward_after;
        if (stockAtEnd > 0) {
          totalItems++;
          const line = `- ${r.name}: ${formatNum(stockAtEnd)}\n`;
          if (r.is_initial === 1) initialProducts += line;
          else finalProducts += line;
        }
      }
      
      if (totalItems === 0) {
        return await bot.sendMessage(chatId, "لا توجد كميات متبقية في المخزن (الأرصدة صفر).\n");
      }
      
      if (finalProducts) {
        let reply1 = `📦 *المنتجات النهائية الجاهزة للبيع*\nكما في تاريخ ${end}\n\n${finalProducts}`;
        if (reply1.length > 3500) reply1 = reply1.substring(0, 3500) + '... (تم اقتصاص الباقي)';
        await bot.sendMessage(chatId, reply1, { parse_mode: 'Markdown' });
      }
      
      if (initialProducts) {
        let reply2 = `🧱 *المواد الخام والأرصدة الأولية*\nكما في تاريخ ${end}\n\n${initialProducts}`;
        if (reply2.length > 3500) reply2 = reply2.substring(0, 3500) + '... (تم اقتصاص الباقي)';
        await bot.sendMessage(chatId, reply2, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب تقرير الكميات المتبقية.');
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

  async function sendTreasuryReport(chatId: number, db: any, settings: any) {
    try {
      const iqd = await db.get(`SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance FROM treasury_transactions WHERE currency = 'IQD'`);
      const usd = await db.get(`SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance FROM treasury_transactions WHERE currency = 'USD'`);
      
      let reply = `💰 *تقرير الخزينة والصناديق الحالي*\n\n`;
      reply += `🇮🇶 الرصيد بالدينار (IQD): ${formatNum(iqd?.balance || 0)}\n`;
      reply += `💵 الرصيد بالدولار (USD): ${formatNum(usd?.balance || 0)}\n`;
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب تقرير الخزينة.');
    }
  }

  async function sendEquipmentReport(chatId: number, db: any, settings: any) {
    try {
      const count = await db.get(`SELECT COUNT(*) as total_equipments, SUM(total_qty) as total_qty, SUM(available_qty) as available_qty FROM equipments`);
      
      let reply = `🛠️ *ملخص المعدات والأصول*\n\n`;
      if (!count || count.total_equipments === 0) {
        reply += "لا توجد معدات مسجلة حالياً.";
      } else {
        reply += `📌 إجمالي أنواع المعدات المسجلة: ${formatNum(count.total_equipments)}\n`;
        reply += `📦 إجمالي الكميات: ${formatNum(count.total_qty)}\n`;
        reply += `✅ المتاح منها حالياً: ${formatNum(count.available_qty)}\n`;
        reply += `❌ المعار أو قيد الاستخدام: ${formatNum(count.total_qty - count.available_qty)}\n`;
      }
      bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب إحصائيات المعدات.');
    }
  }
}
