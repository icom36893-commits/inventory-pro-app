const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'inventory.db');
const schemaPath = path.join(__dirname, 'schema.sql');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
  console.log('Re-creating schema...');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Schema error:', err);
      process.exit(1);
    }
  });

  db.run(`
    INSERT INTO company_settings (name, tax_number, phone, email, address, currency, tax_rate, tax_enabled, theme)
    VALUES ('', '', '', '', '', 'IQD', 0.0, 0, 'light')
  `, (err) => {
    if (err) {
      console.error('Seed error:', err);
      process.exit(1);
    } else {
      console.log('Schema and seeds restored!');
      process.exit(0);
    }
  });
});
