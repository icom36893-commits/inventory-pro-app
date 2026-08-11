const fs = require('fs');
const path = 'd:\\os\\inventory-pro-app\\database\\db.ts';
let content = fs.readFileSync(path, 'utf8');

const search = `await tryAlter("ALTER TABLE company_settings ADD COLUMN financial_year_end TEXT");`;
const replace = `await tryAlter("ALTER TABLE company_settings ADD COLUMN financial_year_end TEXT");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN server_mode TEXT DEFAULT 'offline'");
    await tryAlter("ALTER TABLE company_settings ADD COLUMN server_url TEXT DEFAULT ''");`;

content = content.replace(search, replace);

fs.writeFileSync(path, content, 'utf8');
console.log('db.ts updated successfully.');
