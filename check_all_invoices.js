const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database/inventory.db');

db.all("SELECT * FROM invoices", (err, invoices) => {
  if (err) console.error(err);
  console.log('Invoices:', invoices);
  db.close();
});
