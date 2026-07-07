const fs = require('fs');
const lines = fs.readFileSync('src/pages/Settings.tsx', 'utf-8').split('\n');
lines.forEach((l, i) => {
  if(l.includes('تفعيل') || l.includes('License')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
