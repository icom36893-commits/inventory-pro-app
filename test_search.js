const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/inventory.db');

db.all("SELECT * FROM products WHERE name LIKE ?", ['%بوري%'], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Search result:", rows);
  }
});
