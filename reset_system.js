const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database', 'inventory.db');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

console.log('🔄 جاري تصفير النظام بالكامل...');

// 1. Delete the existing database file
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ تم حذف قاعدة البيانات القديمة.');
} else {
  console.log('ℹ️ قاعدة البيانات غير موجودة مسبقاً.');
}

// 2. Create a new database and apply schema
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطأ في إنشاء قاعدة البيانات:', err.message);
    process.exit(1);
  }
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
  console.log('🔨 جاري بناء الجداول من جديد...');
  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ خطأ في بناء الجداول:', err);
      process.exit(1);
    }
  });

  // Insert default empty company settings so the app doesn't crash on startup
  db.run(`
    INSERT INTO company_settings (name, tax_number, phone, email, address, currency, tax_rate, tax_enabled, theme)
    VALUES ('', '', '', '', '', 'IQD', 0.0, 0, 'light')
  `, (err) => {
    if (err) {
      console.error('❌ خطأ في إضافة إعدادات الشركة:', err);
      process.exit(1);
    } else {
      console.log('✅ تم إعادة النظام إلى نقطة الصفر (التثبيت).');
      console.log('🚀 يرجى إعادة تشغيل السيرفر (npm run dev) وتحديث الصفحة في المتصفح.');
      process.exit(0);
    }
  });
});
