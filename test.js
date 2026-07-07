try {
  const binding = require('./node_modules/sqlite3/build/Release/node_sqlite3.node');
  console.log('Success:', binding);
  process.exit(0);
} catch (e) {
  console.error('Failed to load binding:');
  console.error(e);
  process.exit(1);
}
