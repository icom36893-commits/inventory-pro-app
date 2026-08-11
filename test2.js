const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function test() {
  const db = await open({
    filename: 'D:/os/inventory-pro-app/database/inventory.db',
    driver: sqlite3.Database
  });

  const query = `
      SELECT 
        p.name as product_name, 
        p.code as product_code,
        s.name as supplier_name,
        i.date,
        i.invoice_number,
        ii.unit_price as purchase_price,
        ii.quantity,
        i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      LEFT JOIN parties s ON i.party_id = s.id
      WHERE i.type = 'purchase' AND i.date >= ? AND i.date <= ?
      ORDER BY i.date DESC
  `;
  
  const params = ['2000-01-01', '2050-01-01'];

  try {
    const res1 = await db.all(query, params);
    console.log("With array:", res1.length);
  } catch(e) { console.error("Array failed", e.message); }

  try {
    const res2 = await db.all(query, ...params);
    console.log("With spread:", res2.length);
  } catch(e) { console.error("Spread failed", e.message); }
}

test();
