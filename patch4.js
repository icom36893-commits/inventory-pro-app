const fs = require('fs');
let content = fs.readFileSync('src/pages/Treasury.tsx', 'utf8');

if (!content.includes('JournalsTab')) {
  // Add import
  content = content.replace(
    "import StatementsTab from '../components/treasury/StatementsTab';", 
    "import StatementsTab from '../components/treasury/StatementsTab';\nimport JournalsTab from '../components/treasury/JournalsTab';"
  );

  // Change activeTab type
  content = content.replace(
    "useState<'transactions' | 'funds' | 'statements'>('transactions');", 
    "useState<'transactions' | 'funds' | 'statements' | 'journals'>('transactions');"
  );

  // Add the tab button
  content = content.replace(
    "<button\n            onClick={() => setActiveTab('statements')}",
    "<button\n            onClick={() => setActiveTab('journals')}\n            className={cn(\n              'flex-1 py-3 text-sm font-bold border-b-2 transition-all',\n              activeTab === 'journals' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-main'\n            )}\n          >\n            القيود\n          </button>\n          <button\n            onClick={() => setActiveTab('statements')}"
  );

  // Add rendering for journals tab
  content = content.replace(
    "        ) : (\n          <div className=\"h-[600px]\">\n            <StatementsTab parties={parties} funds={funds} />\n          </div>\n        )}",
    "        ) : activeTab === 'journals' ? (\n          <div className=\"h-[600px]\">\n            <JournalsTab parties={parties} funds={funds} />\n          </div>\n        ) : (\n          <div className=\"h-[600px]\">\n            <StatementsTab parties={parties} funds={funds} />\n          </div>\n        )}"
  );

  fs.writeFileSync('src/pages/Treasury.tsx', content);
}
console.log('Done');
