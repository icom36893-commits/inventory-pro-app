import React, { useState, useEffect } from 'react';

import { Users, Truck, Plus, Phone, MapPin, Edit2, Eye, Printer, LayoutGrid, LayoutList, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import * as xlsx from 'xlsx';
import SearchInput from '../components/shared/SearchInput';
import DataTable from '../components/shared/DataTable';
import { Party } from '../types';
import { cn } from '../utils/cn';
import PartyForm from '../components/forms/PartyForm';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useSettingsStore } from '../store';
import StatementPrintTemplate from '../components/shared/StatementPrintTemplate';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';

interface CustomersSuppliersProps {
  initialType?: 'customer' | 'supplier';
}

const CustomersSuppliers: React.FC<CustomersSuppliersProps> = ({ initialType = 'customer' }) => {
  const [activeType, setActiveType] = useState<'customer' | 'supplier'>(initialType);

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | undefined>();
  const [statementParty, setStatementParty] = useState<Party | null>(null);
  const [statementTransactions, setStatementTransactions] = useState<any[]>([]);
  const [statementFromDate, setStatementFromDate] = useState('');
  const [statementToDate, setStatementToDate] = useState('');
  const [statementCurrency, setStatementCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
  const toast = useToast();
  const { pendingAction, setPendingAction } = useSettingsStore();

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const data = await (window as any).api.parties.getAll(activeType);
      setParties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeType]);

  useEffect(() => {
    if (pendingAction === 'open_customer_modal' && activeType === 'customer') {
      handleAddNew();
      setPendingAction(null);
    } else if (pendingAction === 'open_supplier_modal' && activeType === 'supplier') {
      handleAddNew();
      setPendingAction(null);
    }
  }, [pendingAction, activeType, setPendingAction]);

  const filteredParties = parties.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingParty(undefined);
    setIsModalOpen(true);
  };

  const handleViewStatement = async (party: Party) => {
    try {
      const txs = await (window as any).api.parties.getTransactions(party.id);
      setStatementTransactions(txs);
      setStatementParty(party);
      setStatementFromDate('');
      setStatementToDate('');
      setStatementCurrency('IQD');
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const filename = `statement_${statementParty?.name}_${new Date().getTime()}.pdf`;
      toast.success('جاري فتح نافذة الحفظ...');
      
      const result = await (window as any).api.settings.printToPDF({
        defaultName: filename
      });
      
      if (result.success) {
        toast.success('تم حفظ كشف الحساب بنجاح');
      } else if (!result.canceled) {
        toast.error(result.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    if (!statementParty) return;

    const dataForExcel = filteredStatementTransactions.map(tx => ({
      'التاريخ': tx.date,
      'نوع الحركة': tx.type === 'opening_balance' ? 'رصيد افتتاحي' :
                    tx.type === 'invoice' ? 'فاتورة' :
                    tx.type === 'payment' ? 'دفعة/سداد' : tx.type,
      'رقم المرجع': tx.reference_id || '-',
      [`مدين (${statementCurrency})`]: tx.debit > 0 ? tx.debit : 0,
      [`دائن (${statementCurrency})`]: tx.credit > 0 ? tx.credit : 0,
      [`الرصيد (${statementCurrency})`]: statementCurrency === 'IQD' ? (tx.balance_iqd || 0) : (tx.balance_usd || 0)
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataForExcel);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'كشف الحساب');
    xlsx.writeFile(workbook, `كشف_حساب_${statementParty.name}_${new Date().getTime()}.xlsx`);
  };

  const handleDelete = (party: Party) => {
    setConfirmAction({
      isOpen: true,
      title: activeType === 'customer' ? 'حذف العميل' : 'حذف المورد',
      message: `هل أنت متأكد من حذف ${activeType === 'customer' ? 'العميل' : 'المورد'} (${party.name})؟`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await (window as any).api.parties.delete(party.id);
          toast.success('تم الحذف بنجاح');
          fetchParties();
        } catch (error: any) {
          toast.error(error.message || 'حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const columns = [
    { key: 'code', label: 'الكود' },
    { key: 'name', label: 'الاسم' },
    { key: 'phone', label: 'رقم الهاتف' },
    { key: 'address', label: 'العنوان', render: (val: string) => <div className="truncate max-w-[150px]">{val || '-'}</div> },
    { 
      key: 'current_balance_iqd', 
      label: 'الرصيد (دينار)', 
      render: (val: number) => <span className={cn("font-bold", (val || 0) > 0 ? "text-danger" : "text-success")}>{formatCurrency(val || 0, 'IQD')}</span>
    },
    { 
      key: 'current_balance_usd', 
      label: 'الرصيد (دولار)', 
      render: (val: number) => <span className={cn("font-bold", (val || 0) > 0 ? "text-danger" : "text-success")}>{formatCurrency(val || 0, 'USD')}</span>
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (_: any, item: Party) => (
        <div className="flex gap-2 space-x-reverse">
          <button onClick={() => handleEdit(item)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
          <button onClick={() => handleViewStatement(item)} title="كشف حساب" className="p-1.5 text-text-muted hover:text-primary hover:bg-bg-main rounded-lg transition-colors"><Eye size={16} /></button>
          <button onClick={() => handleDelete(item)} title="حذف" className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  const filteredStatementTransactions = statementTransactions.filter(tx => {
    if (statementFromDate && tx.date < statementFromDate) return false;
    if (statementToDate && tx.date > statementToDate) return false;
    // For currency, we check the actual currency of the transaction.
    // If it's a dual-currency transaction, we might need to rely on the template to show the right one, 
    // but the user wants to see only the selected currency lines if possible, or at least format it.
    // Actually, in the template, we'll pass the currency so it only shows the relevant columns.
    return true; 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            إدارة {activeType === 'customer' ? 'العملاء' : 'الموردين'}
          </h1>
          <p className="text-text-muted text-sm">
            إدارة بيانات {activeType === 'customer' ? 'العملاء ومتابعة مديونياتهم' : 'الموردين ومتابعة مستحقاتهم'}.
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-light transition-all shadow-md"
        >
          <Plus size={20} />
          <span>إضافة {activeType === 'customer' ? 'عميل' : 'مورد'} جديد</span>
        </button>
      </div>

      <div className="print:hidden">
        <div className="flex bg-white p-1 rounded-2xl border border-border w-fit">
          <button 
            onClick={() => setActiveType('customer')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold",
              activeType === 'customer' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main"
            )}
          >
            <Users size={18} />
            <span>العملاء</span>
          </button>
          <button 
            onClick={() => setActiveType('supplier')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold",
              activeType === 'supplier' ? "bg-primary text-white shadow-md" : "text-text-muted hover:bg-bg-main"
            )}
          >
            <Truck size={18} />
            <span>الموردون</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder={`البحث في ${activeType === 'customer' ? 'العملاء' : 'الموردين'}...`} 
            className="flex-1"
          />
          <div className="flex bg-white p-1 rounded-xl border border-border">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-bg-main text-primary" : "text-text-muted hover:text-text-primary")}
              title="عرض شبكي"
            ><LayoutGrid size={20} /></button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'table' ? "bg-bg-main text-primary" : "text-text-muted hover:text-text-primary")}
              title="عرض قائمة"
            ><LayoutList size={20} /></button>
          </div>
        </div>
      </div>

      <div className="print:hidden">
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParties.map((party) => (
            <div key={party.id} className="bg-white rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-bg-main flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {activeType === 'customer' ? <Users size={24} /> : <Truck size={24} />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(party)} className="p-2 rounded-xl hover:bg-bg-main text-text-muted hover:text-primary transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleViewStatement(party)} title="كشف حساب" className="p-2 rounded-xl hover:bg-bg-main text-text-muted hover:text-primary transition-colors">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDelete(party)} title="حذف" className="p-2 rounded-xl hover:bg-bg-main text-text-muted hover:text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-1">{party.name}</h3>
              <p className="text-xs text-text-muted mb-4 font-mono">{party.code}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Phone size={14} />
                  <span>{party.phone || 'لا يوجد رقم'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <MapPin size={14} />
                  <span className="truncate">{party.address || 'لا يوجد عنوان'}</span>
                </div>
              </div>

              <div className="bg-bg-main p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-muted">الرصيد (دينار)</span>
                  <span className={cn(
                    "font-bold text-md",
                    (party.current_balance_iqd || 0) > 0 ? "text-danger" : "text-success"
                  )}>
                    {formatCurrency(party.current_balance_iqd || 0, 'IQD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-muted">الرصيد (دولار)</span>
                  <span className={cn(
                    "font-bold text-md",
                    (party.current_balance_usd || 0) > 0 ? "text-danger" : "text-success"
                  )}>
                    {formatCurrency(party.current_balance_usd || 0, 'USD')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          <DataTable 
            columns={columns} 
            data={filteredParties} 
            itemsPerPage={limit}
            onItemsPerPageChange={setLimit}
          />
        </div>
      )}

      {filteredParties.length === 0 && !isLoading && (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-border">
          <p className="text-text-muted italic">لا توجد بيانات تطابق بحثك</p>
        </div>
      )}

      <PartyForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={activeType}
        initialData={editingParty}
        onSuccess={() => fetchParties()}
      />
      </div>

      <Modal isOpen={!!statementParty} onClose={() => setStatementParty(null)} title={`كشف حساب: ${statementParty?.name}`} size="xl">
        <div className="space-y-6">
          
          <div className="print:hidden bg-bg-main p-4 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-text-muted mb-1 font-bold">من تاريخ</label>
              <input type="date" value={statementFromDate} onChange={(e) => setStatementFromDate(e.target.value)} className="w-full bg-white border border-border rounded-xl px-4 py-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-text-muted mb-1 font-bold">إلى تاريخ</label>
              <input type="date" value={statementToDate} onChange={(e) => setStatementToDate(e.target.value)} className="w-full bg-white border border-border rounded-xl px-4 py-2" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-text-muted mb-1 font-bold">العملة</label>
              <select value={statementCurrency} onChange={(e) => setStatementCurrency(e.target.value as any)} className="w-full bg-white border border-border rounded-xl px-4 py-2 font-bold text-primary">
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
          </div>

          <div id="statement-print-area" className="print-area-view print:p-8 print:bg-white text-black font-cairo" dir="rtl">
            <div className="hidden print:block mb-8">
              <StatementPrintTemplate 
                party={statementParty} 
                transactions={filteredStatementTransactions} 
                activeType={activeType} 
                currency={statementCurrency}
                fromDate={statementFromDate}
                toDate={statementToDate}
              />
            </div>

            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="font-bold text-lg">سجل الحركات</h3>
              <div className="bg-bg-main p-3 rounded-xl flex gap-4">
                <div>
                  دينار: <span className={cn("font-bold", statementParty?.current_balance_iqd && statementParty.current_balance_iqd > 0 ? "text-danger" : "text-success")}>{formatCurrency(statementParty?.current_balance_iqd || 0, 'IQD')}</span>
                </div>
                <div>
                  دولار: <span className={cn("font-bold", statementParty?.current_balance_usd && statementParty.current_balance_usd > 0 ? "text-danger" : "text-success")}>{formatCurrency(statementParty?.current_balance_usd || 0, 'USD')}</span>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden print:hidden">
              <table className="w-full text-right">
                <thead className="bg-bg-main print:bg-gray-100">
                  <tr>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">التاريخ</th>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">نوع الحركة</th>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">رقم المرجع</th>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">مدين ({statementCurrency})</th>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">دائن ({statementCurrency})</th>
                    <th className="p-3 text-sm font-bold print:border print:border-gray-300">الرصيد ({statementCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border print:divide-gray-300">
                  {filteredStatementTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td className="p-3 print:border print:border-gray-300 text-sm">{tx.date}</td>
                      <td className="p-3 print:border print:border-gray-300 text-sm">{
                        tx.type === 'opening_balance' ? 'رصيد افتتاحي' :
                        tx.type === 'invoice' ? 'فاتورة' :
                        tx.type === 'payment' ? 'دفعة/سداد' : tx.type
                      }</td>
                      <td className="p-3 print:border print:border-gray-300 text-sm">{tx.reference_id || '-'}</td>
                      <td className="p-3 print:border print:border-gray-300 text-sm text-danger">{tx.debit > 0 ? formatCurrency(tx.debit, statementCurrency) : '-'}</td>
                      <td className="p-3 print:border print:border-gray-300 text-sm text-success">{tx.credit > 0 ? formatCurrency(tx.credit, statementCurrency) : '-'}</td>
                      <td className="p-3 print:border print:border-gray-300 text-sm font-bold">{formatCurrency(statementCurrency === 'IQD' ? (tx.balance_iqd || 0) : (tx.balance_usd || 0), statementCurrency)}</td>
                    </tr>
                  ))}
                  {filteredStatementTransactions.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-text-muted italic">لا توجد حركات مسجلة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4 print:hidden">
            <button onClick={() => setStatementParty(null)} className="px-6 py-2 rounded-xl bg-white border border-border hover:bg-bg-main text-text-muted font-bold transition-colors">إغلاق</button>
            <button onClick={handleExportExcel} className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center gap-2"><FileSpreadsheet size={18}/> تصدير Excel</button>
            <button onClick={handleExportPDF} className="px-6 py-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold transition-colors flex items-center gap-2"><Download size={18}/> حفظ PDF</button>
            <button onClick={() => window.print()} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-colors flex items-center gap-2"><Printer size={18}/> طباعة الكشف</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmAction?.isOpen || false}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        type={confirmAction?.type || 'danger'}
        onConfirm={() => {
          if (confirmAction?.onConfirm) confirmAction.onConfirm();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default CustomersSuppliers;
