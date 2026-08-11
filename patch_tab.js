const fs = require('fs');

let content = fs.readFileSync('src/components/treasury/JournalsTab.tsx', 'utf8');

// Imports
content = content.replace(
  'import JournalVoucherModal from \\'./JournalVoucherModal\\';',
  'import JournalVoucherModal from \\'./JournalVoucherModal\\';\nimport ActionDropdown from \\'../shared/ActionDropdown\\';\nimport ConfirmModal from \\'../ui/ConfirmModal\\';\nimport { Eye, Edit2, Trash2 } from \\'lucide-react\\';\nimport { useToast } from \\'../../context/ToastContext\\';'
);

// State
content = content.replace(
  '  const [isModalOpen, setIsModalOpen] = useState(false);',
  '  const [isModalOpen, setIsModalOpen] = useState(false);\n  const [editingJournalId, setEditingJournalId] = useState<number | null>(null);\n  const [viewMode, setViewMode] = useState(false);\n  const [confirmAction, setConfirmAction] = useState<any>(null);\n  const toast = useToast();'
);

// Add handlers
const handlers = `
  const handleView = (id: number) => {
    setEditingJournalId(id);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingJournalId(id);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'حذف سند قيد',
      message: 'هل أنت متأكد من حذف هذا السند؟ سيتم التراجع عن جميع الأرصدة المرتبطة به.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await (window as any).api.journals.delete(id);
          toast.showSuccess('تم حذف السند بنجاح');
          fetchJournals();
        } catch (error) {
          toast.showError('حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const openNewModal = () => {
    setEditingJournalId(null);
    setViewMode(false);
    setIsModalOpen(true);
  };
`;

content = content.replace(
  '  const columns = [',
  handlers + '\n  const columns = ['
);

// Columns
const newColumns = `
  const columns = [
    { key: 'voucher_number', label: 'رقم السند' },
    { key: 'date', label: 'التاريخ' },
    { key: 'notes', label: 'البيان' },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, row: any) => (
        <ActionDropdown
          actions={[
            {
              label: 'عرض التفاصيل',
              icon: <Eye size={16} />,
              onClick: () => handleView(row.id),
              primary: true
            },
            {
              label: 'تعديل',
              icon: <Edit2 size={16} />,
              onClick: () => handleEdit(row.id)
            },
            {
              label: 'حذف',
              icon: <Trash2 size={16} />,
              onClick: () => handleDelete(row.id),
              danger: true
            }
          ]}
        />
      )
    }
  ];
`;

content = content.replace(
  /const columns = \[[^\]]+\];/s,
  newColumns
);

// Replace onClick for new modal
content = content.replace(
  'onClick={() => setIsModalOpen(true)}',
  'onClick={openNewModal}'
);

// Update Modal Props & add ConfirmModal
content = content.replace(
  '<JournalVoucherModal\n        isOpen={isModalOpen}\n        onClose={() => setIsModalOpen(false)}\n        parties={parties}\n        funds={funds}\n        onSuccess={fetchJournals}\n      />',
  `<JournalVoucherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parties={parties}
        funds={funds}
        onSuccess={fetchJournals}
        journalId={editingJournalId}
        viewMode={viewMode}
      />
      {confirmAction && (
        <ConfirmModal
          isOpen={confirmAction.isOpen}
          title={confirmAction.title}
          message={confirmAction.message}
          type={confirmAction.type}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}`
);


fs.writeFileSync('src/components/treasury/JournalsTab.tsx', content);
console.log('Tab Patched');
