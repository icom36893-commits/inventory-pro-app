import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modal';
import { Party, Fund } from '../../types';
import { Printer } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { useSettingsStore } from '../../store';

interface JournalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: number | null;
  parties: Party[];
  funds: Fund[];
}

const JournalDetailsModal: React.FC<JournalDetailsModalProps> = ({ isOpen, onClose, journalId, parties, funds }) => {
  const [journal, setJournal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { settings } = useSettingsStore();
  
  const companyName = settings?.name || 'برنامج الحسابات';
  const companyAddress = settings?.address || '';
  const taxNumber = settings?.tax_number || '';
  const phone = settings?.phone || '';
  const showLogo = settings?.print_show_logo !== 'false' && settings?.print_show_logo !== 0;
  const logoSize = 120;

  useEffect(() => {
    const fetchJournal = async () => {
      if (!journalId) return;
      setIsLoading(true);
      try {
        const data = await (window as any).api.journals.getOne(journalId);
        setJournal(data);
      } catch (error: any) {
        toast.error('حدث خطأ أثناء جلب تفاصيل السند');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && journalId) {
      fetchJournal();
    } else {
      setJournal(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, journalId]);

  const getAccountName = (type: 'party' | 'fund', id: number) => {
    if (type === 'party') {
      const party = parties.find(p => p.id === id);
      return party ? `${party.name} (${party.type === 'customer' ? 'عميل' : 'مورد'})` : 'غير معروف';
    } else {
      const fund = funds.find(f => f.id === id);
      return fund ? fund.name : 'غير معروف';
    }
  };

  if (!isOpen) return null;

  const totalDebitIqd = journal?.entries?.reduce((sum: number, e: any) => sum + (e.debit_iqd || 0), 0) || 0;
  const totalCreditIqd = journal?.entries?.reduce((sum: number, e: any) => sum + (e.credit_iqd || 0), 0) || 0;
  const totalDebitUsd = journal?.entries?.reduce((sum: number, e: any) => sum + (e.debit_usd || 0), 0) || 0;
  const totalCreditUsd = journal?.entries?.reduce((sum: number, e: any) => sum + (e.credit_usd || 0), 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تفاصيل سند قيد (${journal?.voucher_number || ''})`} size="xl">
      {isOpen && (
        <style>
          {`
            @media print {
              @page { size: landscape; }
            }
          `}
        </style>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-text-muted">جاري تحميل البيانات...</div>
      ) : journal ? (
        <div className="space-y-6">
          <div id="journal-print-area" className="print-area-view print:p-8 print:bg-white text-black font-cairo bg-white p-6 rounded-2xl border border-border" dir="rtl">
            
            {/* Header section similar to Invoice PrintTemplate */}
            <div 
              className="flex justify-between items-start pb-4 mb-4 border-b-2"
              style={{ borderColor: '#000000' }}
            >
              <div className="flex items-center gap-4">
                {showLogo && settings?.logo && (
                  <img src={settings.logo as string} alt="Logo" className="object-contain" style={{ height: `${logoSize}px` }} />
                )}
                <div>
                  <h1 className="text-xl font-bold mb-1" style={{ color: '#000' }}>{companyName}</h1>
                  <p className="text-sm" style={{ color: '#000' }}>{companyAddress}</p>
                  <p className="text-sm" style={{ color: '#000' }}>هاتف: {phone}</p>
                  {taxNumber && <p className="text-sm" style={{ color: '#000' }}>الرقم الضريبي: {taxNumber}</p>}
                </div>
              </div>
              <div 
                className="text-left p-3 min-w-[200px]"
                style={{ border: '2px solid #000', backgroundColor: '#fff' }}
              >
                <h2 
                  className="text-lg font-bold mb-2 border-b pb-2"
                  style={{ color: '#000', borderColor: '#000' }}
                >
                  سند قيد يومية
                </h2>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#000' }}>رقم السند:</span>
                  <span className="font-bold" style={{ color: '#000' }}>{journal.voucher_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#000' }}>التاريخ:</span>
                  <span className="font-bold" style={{ color: '#000' }}>{journal.date}</span>
                </div>
              </div>
            </div>

            {journal.notes && (
              <div 
                className="mb-6 p-3 flex items-start break-words"
                style={{ border: '2px solid #000', backgroundColor: '#fff', color: '#000', fontSize: '14px' }}
              >
                <span className="font-bold whitespace-nowrap">ملاحظات:</span>
                <span className="mx-2 font-bold">|</span>
                <span className="break-all">{journal.notes}</span>
              </div>
            )}

            <div className="mb-8">
              <table className="w-full text-right border-collapse table-fixed">
                <thead>
                  <tr style={{ backgroundColor: '#fff', color: '#000', borderBottom: '2px solid #000' }}>
                    <th className="border border-black p-2 text-sm font-bold text-center w-[5%]">#</th>
                    <th className="border border-black p-2 text-sm font-bold w-[25%]">الحساب</th>
                    <th className="border border-black p-2 text-sm font-bold w-[30%]">البيان</th>
                    <th className="border border-black p-2 text-sm font-bold text-center w-[10%]">مدين (د.ع)</th>
                    <th className="border border-black p-2 text-sm font-bold text-center w-[10%]">دائن (د.ع)</th>
                    <th className="border border-black p-2 text-sm font-bold text-center w-[10%]">مدين ($)</th>
                    <th className="border border-black p-2 text-sm font-bold text-center w-[10%]">دائن ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.entries.map((entry: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-black p-2 text-sm text-center font-bold break-all">{index + 1}</td>
                      <td className="border border-black p-2 text-sm font-bold break-words">{getAccountName(entry.account_type, entry.account_id)}</td>
                      <td className="border border-black p-2 text-sm break-all whitespace-normal">{entry.description || '-'}</td>
                      <td className="border border-black p-2 text-sm font-bold text-center break-words" dir="ltr">{entry.debit_iqd > 0 ? formatCurrency(entry.debit_iqd, 'IQD') : '-'}</td>
                      <td className="border border-black p-2 text-sm font-bold text-center break-words" dir="ltr">{entry.credit_iqd > 0 ? formatCurrency(entry.credit_iqd, 'IQD') : '-'}</td>
                      <td className="border border-black p-2 text-sm font-bold text-center break-words" dir="ltr">{entry.debit_usd > 0 ? formatCurrency(entry.debit_usd, 'USD') : '-'}</td>
                      <td className="border border-black p-2 text-sm font-bold text-center break-words" dir="ltr">{entry.credit_usd > 0 ? formatCurrency(entry.credit_usd, 'USD') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#fff', color: '#000', borderTop: '2px solid #000' }}>
                    <td colSpan={3} className="border border-black p-2 text-sm font-bold text-left">الإجماليات:</td>
                    <td className="border border-black p-2 text-sm font-bold text-center" dir="ltr">{formatCurrency(totalDebitIqd, 'IQD')}</td>
                    <td className="border border-black p-2 text-sm font-bold text-center" dir="ltr">{formatCurrency(totalCreditIqd, 'IQD')}</td>
                    <td className="border border-black p-2 text-sm font-bold text-center" dir="ltr">{formatCurrency(totalDebitUsd, 'USD')}</td>
                    <td className="border border-black p-2 text-sm font-bold text-center" dir="ltr">{formatCurrency(totalCreditUsd, 'USD')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center mt-12 px-12 text-sm font-bold" style={{ color: '#000' }}>
              <div className="text-center">
                <div className="w-48 border-b-2 mb-2" style={{ borderColor: '#000' }}></div>
                <span>توقيع المحاسب</span>
              </div>
              <div className="text-center">
                <div className="w-48 border-b-2 mb-2" style={{ borderColor: '#000' }}></div>
                <span>توقيع المستلم / المدير</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4 print:hidden">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors font-bold"
            >
              إغلاق
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-md"
            >
              <Printer size={18} />
              <span>طباعة السند</span>
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default JournalDetailsModal;

