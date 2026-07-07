const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'inventory.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  db.run(`UPDATE users SET password_hash = 'admin' WHERE username = 'admin'`, function(err) {
    if (err) {
      return console.error('Error updating password:', err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    
    if (this.changes === 0) {
      console.log('Admin user not found, inserting...');
      db.run(`INSERT INTO users (name, username, password_hash, role) VALUES ('المدير العام', 'admin', 'admin', 'admin')`, (err) => {
        if (err) {
          return console.error('Error inserting admin:', err.message);
        }
        console.log('Admin user created successfully.');
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed the database connection.');
});
