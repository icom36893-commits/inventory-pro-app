const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function test() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'database', 'inventory.db'),
      driver: sqlite3.Database
    });

    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.map(t => t.name).join(', '));

    const columns = await db.all("PRAGMA table_info(party_transactions)");
    console.log('party_transactions columns:', columns.map(c => c.name).join(', '));

    const rows = await db.all("SELECT * FROM party_transactions");
    console.log('party_transactions rows:', rows.length);

    const invoices = await db.all("SELECT * FROM invoices ORDER BY id DESC LIMIT 2");
    console.log('recent invoices:', invoices.length);
    
    const tr = await db.all("SELECT * FROM treasury_transactions ORDER BY id DESC LIMIT 2");
    console.log('recent treasury:', tr.length);

  } catch (e) {
    console.error(e);
  }
}

test();
