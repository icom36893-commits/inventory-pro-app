const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('Wiping database...');
  db.run("PRAGMA writable_schema = 1;");
  db.run("DELETE FROM sqlite_master WHERE type IN ('table', 'index', 'trigger');");
  db.run("PRAGMA writable_schema = 0;");
  db.run("VACUUM;", (err) => {
    if (err) {
      console.error('Error wiping database:', err);
      process.exit(1);
    } else {
      console.log('Database wiped successfully.');
      process.exit(0);
    }
  });
});
