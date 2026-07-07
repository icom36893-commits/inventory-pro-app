const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function test() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'database', 'inventory.db'),
      driver: sqlite3.Database
    });

    const partyId = 1;
    const date = new Date().toISOString().split('T')[0];

    await db.run(`
      INSERT INTO party_transactions (party_id, type, reference_id, debit, credit, balance, balance_iqd, balance_usd, currency, description, date)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
    `, partyId, 'payment', 1, 100, 0, 100, 0, 'IQD', 'Test', date);

    const rows = await db.all("SELECT * FROM party_transactions");
    console.log('party_transactions rows:', rows.length);

  } catch (e) {
    console.error(e);
  }
}

test();
