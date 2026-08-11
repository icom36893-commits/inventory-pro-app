const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function fixBalances() {
  const dbPath = 'd:/os/inventory-pro-app/database/inventory.db';
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Connected to database.');

  const parties = await db.all('SELECT * FROM parties');
  for (const party of parties) {
    let balanceIqd = party.opening_balance_iqd || 0;
    let balanceUsd = party.opening_balance_usd || 0;

    // Fetch all transactions for this party ordered by date and id
    const transactions = await db.all('SELECT * FROM party_transactions WHERE party_id = ? ORDER BY date ASC, id ASC', party.id);
    
    for (const tx of transactions) {
      const currency = tx.currency || 'IQD';
      
      let change = 0;
      if (party.type === 'customer') {
        change = (tx.debit || 0) - (tx.credit || 0);
      } else if (party.type === 'supplier') {
        change = (tx.credit || 0) - (tx.debit || 0);
      }

      if (currency === 'USD') {
        balanceUsd += change;
        await db.run('UPDATE party_transactions SET balance_usd = ?, balance_iqd = ? WHERE id = ?', [balanceUsd, balanceIqd, tx.id]);
      } else {
        balanceIqd += change;
        await db.run('UPDATE party_transactions SET balance_iqd = ?, balance_usd = ? WHERE id = ?', [balanceIqd, balanceUsd, tx.id]);
      }
    }

    // Finally, update the party's current balances
    await db.run('UPDATE parties SET current_balance_iqd = ?, current_balance_usd = ? WHERE id = ?', [balanceIqd, balanceUsd, party.id]);
    console.log(`Party ${party.name} (${party.type}): IQD=${balanceIqd}, USD=${balanceUsd}`);
  }

  console.log('Database balances fixed!');
  await db.close();
}

fixBalances().catch(console.error);
