const fs = require('fs');

let content = fs.readFileSync('src/components/treasury/JournalVoucherModal.tsx', 'utf8');

// Update Props
content = content.replace(
  'interface JournalVoucherModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  parties: Party[];\n  funds: Fund[];\n  onSuccess: () => void;\n}',
  'interface JournalVoucherModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  parties: Party[];\n  funds: Fund[];\n  onSuccess: () => void;\n  journalId?: number | null;\n  viewMode?: boolean;\n}'
);

content = content.replace(
  'const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({ isOpen, onClose, parties, funds, onSuccess }) => {',
  'const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({ isOpen, onClose, parties, funds, onSuccess, journalId, viewMode }) => {'
);

// Update useEffect to fetch data if journalId is present
const newUseEffect = `
  useEffect(() => {
    if (isOpen) {
      if (journalId) {
        // Fetch existing journal
        (window as any).api.journals.getOne(journalId).then((data: any) => {
          if (data) {
            setDate(data.date);
            setNotes(data.notes || '');
            if (data.entries && data.entries.length > 0) {
              setEntries(data.entries.map((e: any, i: number) => ({ ...e, id: e.id || i })));
            }
          }
        });
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setEntries([
          { id: 1, account_type: 'party', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '' },
          { id: 2, account_type: 'fund', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '' }
        ]);
      }
    }
  }, [isOpen, journalId]);
`;

content = content.replace(
  /useEffect\(\(\) => \{\s*if \(isOpen\) \{\s*setDate\([^)]+\);\s*setNotes\([^)]+\);\s*setEntries\([^\]]+\]\);\s*\}\s*\}, \[isOpen\]\);/s,
  newUseEffect
);

// Update form submittion
const oldSubmit = `const result = await (window as any).api.journals.create(payload, user?.id);
      if (result.success) {
        toast.showSuccess('تم حفظ سند القيد بنجاح');
        onSuccess();
        onClose();
      }`;

const newSubmit = `
      let result;
      if (journalId) {
        payload.id = journalId;
        result = await (window as any).api.journals.update(payload, user?.id);
      } else {
        result = await (window as any).api.journals.create(payload, user?.id);
      }
      
      if (result.success) {
        toast.showSuccess(journalId ? 'تم تحديث سند القيد بنجاح' : 'تم حفظ سند القيد بنجاح');
        onSuccess();
        onClose();
      }
`;

content = content.replace(oldSubmit, newSubmit);

// Disable fields if viewMode
// Just a quick way to disable inputs: replace `<input ` with `<input disabled={viewMode} ` and `<select ` with `<select disabled={viewMode} ` and `<textarea ` with `<textarea disabled={viewMode} `
content = content.replace(/<input /g, '<input disabled={viewMode} ');
content = content.replace(/<select /g, '<select disabled={viewMode} ');
content = content.replace(/<textarea /g, '<textarea disabled={viewMode} ');
// Hide buttons in viewMode
content = content.replace(
  '<button\n          onClick={addEntry}',
  '{!viewMode && <button\n          onClick={addEntry}'
);
content = content.replace(
  'إضافة صف\n        </button>',
  'إضافة صف\n        </button>}'
);

content = content.replace(
  '<button\n                      onClick={() => removeEntry(entry.id)}',
  '{!viewMode && <button\n                      onClick={() => removeEntry(entry.id)}'
);
content = content.replace(
  '<Trash2 size={18} />\n                    </button>',
  '<Trash2 size={18} />\n                    </button>}'
);

content = content.replace(
  '<button\n            onClick={handleSubmit}',
  '{!viewMode && <button\n            onClick={handleSubmit}'
);
content = content.replace(
  '          حفظ السند\n          </button>',
  '          حفظ السند\n          </button>}'
);


fs.writeFileSync('src/components/treasury/JournalVoucherModal.tsx', content);
console.log('Modal Patched');
