const fs = require('fs');

const path = 'D:/app/src/features/reports/ReportsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Line 220
content = content.replace(/\{(\(\(item\.current_stock \|\| 0\) \* \(item\.purchase_price \|\| 0\)\))\.toLocaleString\(\)\}/g, '{formatVal(getConvertedValue($1, item.currency || "IQD"))}');

// Line 290
content = content.replace(/\{\(item\.purchase_price \|\| 0\)\.toLocaleString\(\)\}/g, '{formatVal(getConvertedValue(item.purchase_price || 0, item.currency || "IQD"))}');

// Line 291
content = content.replace(/\{\(item\.sale_price \|\| item\.sell_price \|\| 0\)\.toLocaleString\(\)\}/g, '{formatVal(getConvertedValue(item.sale_price || item.sell_price || 0, item.currency || "IQD"))}');

// Line 325
content = content.replace(/\{\(s\.total \|\| 0\)\.toLocaleString\(\)\}/g, '{formatVal(getConvertedValue(s.total || 0, s.currency || "IQD"))}');

// Line 351
content = content.replace(/\{\(p\.total \|\| 0\)\.toLocaleString\(\)\}/g, '{formatVal(getConvertedValue(p.total || 0, p.currency || "IQD"))}');

fs.writeFileSync(path, content, 'utf8');
console.log('Done fixing individual toLocaleStrings');
