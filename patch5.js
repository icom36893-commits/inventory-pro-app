const fs = require('fs');
let content = fs.readFileSync('src/pages/Treasury.tsx', 'utf8');

if (!content.includes("activeMainTab === 'journals'")) {
  // Add the tab button
  content = content.replace(
    "<button\n            onClick={() => setActiveMainTab('statements')}",
    "<button\n            onClick={() => setActiveMainTab('journals')}\n            className={cn(\n              'flex-1 py-3 text-sm font-bold rounded-xl transition-all',\n              activeMainTab === 'journals' ? 'bg-primary text-white' : 'bg-bg-main text-text-muted hover:bg-border'\n            )}\n          >\n            القيود\n          </button>\n          <button\n            onClick={() => setActiveMainTab('statements')}"
  );

  // Add rendering for journals tab
  content = content.replace(
    "        ) : (\n          <div className=\"h-[600px]\">\n            <StatementsTab parties={parties} funds={funds} />\n          </div>\n        )}",
    "        ) : activeMainTab === 'journals' ? (\n          <div className=\"h-[600px]\">\n            <JournalsTab parties={parties} funds={funds} />\n          </div>\n        ) : (\n          <div className=\"h-[600px]\">\n            <StatementsTab parties={parties} funds={funds} />\n          </div>\n        )}"
  );

  fs.writeFileSync('src/pages/Treasury.tsx', content);
}
console.log('Done');
