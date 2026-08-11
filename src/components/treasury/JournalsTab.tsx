import React, { useState, useEffect } from 'react';
import { Party, Fund } from '../../types';
import DataTable from '../shared/DataTable';
import { FilePlus2 } from 'lucide-react';
import JournalVoucherModal from './JournalVoucherModal';
import JournalDetailsModal from './JournalDetailsModal';
import ActionDropdown from '../shared/ActionDropdown';
import ConfirmModal from '../ui/ConfirmModal';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface JournalsTabProps {
  parties: Party[];
  funds: Fund[];
  onSuccess?: () => void;
}

const JournalsTab: React.FC<JournalsTabProps> = ({ parties, funds, onSuccess }) => {
  const [journals, setJournals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<number | null>(null);
  const [viewingJournalId, setViewingJournalId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const toast = useToast();

  const fetchJournals = async () => {
    setIsLoading(true);
    try {
      const data = await (window as any).api.journals.getAll();
      setJournals(data);
    } catch (error) {
      console.error('Failed to fetch journals', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleView = (id: number) => {
    setViewingJournalId(id);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingJournalId(id);
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
          toast.success('تم حذف السند بنجاح');
          fetchJournals();
        } catch (error) {
          toast.error('حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const openNewModal = () => {
    setEditingJournalId(null);
    setIsModalOpen(true);
  };

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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-border p-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <h2 className="text-xl font-bold text-text-primary">إدارة القيود اليومية</h2>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold"
        >
          <FilePlus2 size={20} />
          سند قيد متعدد
        </button>
      </div>

      {/* Journals Table */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          data={journals}
          columns={columns}
          searchable={true}
          pagination={true}
          isLoading={isLoading}
        />
      </div>

      <JournalVoucherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parties={parties}
        funds={funds}
        onSuccess={() => {
          fetchJournals();
          onSuccess?.();
        }}
        journalId={editingJournalId}
      />

      <JournalDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        journalId={viewingJournalId}
        parties={parties}
        funds={funds}
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
      )}
    </div>
  );
};

export default JournalsTab;
