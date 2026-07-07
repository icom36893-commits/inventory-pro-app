import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Filter, Edit2, Trash2, Eye, Printer } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import TreasuryPrintTemplate from '../components/shared/TreasuryPrintTemplate';
import ActionDropdown from '../components/shared/ActionDropdown';
import { useToast } from '../context/ToastContext';
import { TreasuryTransaction } from '../types';
import { cn } from '../utils/cn';
import { CurrencyType, formatCurrency } from '../utils/currency';
import ConfirmModal from '../components/ui/ConfirmModal';

const Treasury: React.FC = () => {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [balance, setBalance] = useState({ IQD: 0, USD: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [limit, setLimit] = useState(10);
  const toast = useToast();
  
  const [parties, setParties] = useState<any[]>([]);

  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [viewTransaction, setViewTransaction] = useState<any | null>(null);
  const [transactionToPrint, setTransactionToPrint] = useState<any | null>(null);
  const [previewTransactionToPrint, setPreviewTransactionToPrint] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<CurrencyType>('IQD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const txs = await (window as any).api.treasury.getTransactions({
        search,
        type: filterType === 'all' ? undefined : filterType
      });
      const bal = await (window as any).api.treasury.getBalance();
      const prts = await (window as any).api.parties.getAll('all'); 
      setTransactions(txs);
      setBalance(bal);
      setParties(prts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filterType]);

  const handleSave = async () => {
    if (!amount || !category) return toast.warning('الرجاء إدخال المبلغ والتصنيف');
    
    try {
      if (editingTransactionId) {
        await (window as any).api.treasury.updateTransaction(editingTransactionId, {
          type: transactionType,
          category,
          amount,
          currency,
          party_id: partyId || null,
          date,
          description
        });
        toast.success('تم تحديث الحركة بنجاح');
      } else {
        await (window as any).api.treasury.createTransaction({
          type: transactionType,
          category,
          amount,
          currency,
          party_id: partyId || null,
          date,
          description,
          created_by: 1
        });
        toast.success('تم حفظ الحركة بنجاح');
      }
      setIsModalOpen(false);
      setEditingTransactionId(null);
      setAmount(0);
      setCategory('');
      setDescription('');
      setPartyId('');
      setPartySearch('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTransactionId(tx.id);
    setTransactionType(tx.type as 'income' | 'expense');
    setAmount(tx.amount);
    setCurrency(tx.currency || 'IQD');
    setDate(tx.date);
    setCategory(tx.category);
    setDescription(tx.description || '');
    setPartyId(tx.party_id ? tx.party_id.toString() : '');
    setPartySearch(tx.party_name || '');
    setIsModalOpen(true);
  };

  const handleView = (tx: any) => {
    setViewTransaction(tx);
  };

  const handlePrintPreview = (tx: any) => {
    setPreviewTransactionToPrint(tx);
  };

  const handlePrint = () => {
    setTransactionToPrint(previewTransactionToPrint);
    setTimeout(() => {
      window.print();
      setTimeout(() => setTransactionToPrint(null), 100);
    }, 100);
  };

  const handleDelete = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'حذف الحركة',
      message: 'هل أنت متأكد من حذف هذه الحركة؟ سيتم عكس تأثيرها على الأرصدة.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await (window as any).api.treasury.deleteTransaction(id);
          toast.success('تم حذف الحركة وعكس التأثير بنجاح');
          fetchData();
        } catch (error: any) {
          toast.error(error.message || 'حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const columns = [
    { key: 'date', label: 'التاريخ' },
    { 
      key: 'type', 
      label: 'النوع',
      render: (val: string) => (
        <span className={val === 'income' ? "text-success font-bold" : "text-danger font-bold"}>
          {val === 'income' ? 'إيراد / وارد' : 'مصروف / صادر'}
        </span>
      )
    },
    { key: 'category', label: 'التصنيف' },
    { key: 'description', label: 'الوصف' },
    { 
      key: 'amount', 
      label: 'المبلغ',
      render: (val: number, item: any) => (
        <span className={item.type === 'income' ? "text-success font-bold" : "text-danger font-bold"}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(val, item.currency || 'IQD')}
        </span>
      )
    },
    { key: 'party_name', label: 'الطرف الثاني' },
    {
      key: 'actions',
      label: 'إجراءات',
      className: 'w-16',
      render: (_: any, item: any) => (
        <ActionDropdown actions={[
          { label: 'عرض التفاصيل', icon: <Eye size={16} />, onClick: () => handleView(item), variant: 'primary' },
          { label: 'طباعة الإيصال', icon: <Printer size={16} />, onClick: () => handlePrintPreview(item) },
          { label: 'تعديل', icon: <Edit2 size={16} />, onClick: () => handleEdit(item), variant: 'warning' },
          { label: 'حذف', icon: <Trash2 size={16} />, onClick: () => handleDelete(item.id), variant: 'danger' }
        ]} />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">إدارة الخزينة</h1>
          <p className="text-text-muted text-sm">متابعة التدفقات النقدية، المصروفات، والإيرادات.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { 
              setEditingTransactionId(null);
              setAmount(0); setCategory(''); setDescription(''); setPartyId(''); setPartySearch('');
              setTransactionType('income'); setIsModalOpen(true); 
            }}
            className="flex items-center justify-center gap-2 bg-success text-white px-4 py-2.5 rounded-xl hover:bg-success/90 transition-all shadow-md"
          >
            <ArrowUpCircle size={20} />
            <span>إضافة إيراد</span>
          </button>
          <button 
            onClick={() => { 
              setEditingTransactionId(null);
              setAmount(0); setCategory(''); setDescription(''); setPartyId(''); setPartySearch('');
              setTransactionType('expense'); setIsModalOpen(true); 
            }}
            className="flex items-center justify-center gap-2 bg-danger text-white px-4 py-2.5 rounded-xl hover:bg-danger/90 transition-all shadow-md"
          >
            <ArrowDownCircle size={20} />
            <span>إضافة مصروف</span>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-sidebar-bg to-primary p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex justify-between">
        <div className="relative z-10">
          <p className="text-sidebar-text text-sm mb-2 opacity-80">الرصيد المتوفر (دينار)</p>
          <h2 className="text-4xl font-extrabold tracking-tight">
            {formatCurrency(balance.IQD || 0, 'IQD')}
          </h2>
        </div>
        <div className="relative z-10 text-left">
          <p className="text-sidebar-text text-sm mb-2 opacity-80">الرصيد المتوفر (دولار)</p>
          <h2 className="text-4xl font-extrabold tracking-tight">
            {formatCurrency(balance.USD || 0, 'USD')}
          </h2>
        </div>
        <Landmark size={120} className="absolute -left-4 -bottom-4 text-white opacity-10 rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="بحث في التصنيف، الوصف، أو الطرف الثاني..." 
          className="flex-1"
        />
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-text-muted transition-all">
          <Filter size={18} />
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            className="bg-transparent border-none outline-none text-text-primary"
          >
            <option value="all">كل الحركات</option>
            <option value="income">إيرادات فقط</option>
            <option value="expense">مصروفات فقط</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={transactions} 
        isLoading={isLoading}
        itemsPerPage={limit}
        onItemsPerPageChange={setLimit}
      />

      {transactionToPrint && (
        <div className="hidden print:block print-area-view absolute top-0 left-0 w-full bg-white z-50">
          <TreasuryPrintTemplate transaction={transactionToPrint} />
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={transactionType === 'income' ? "إضافة إيراد جديد" : "إضافة مصروف جديد"}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">المبلغ</label>
              <input value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">العملة</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyType)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">التاريخ</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">التصنيف</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر تصنيف...</option>
              {transactionType === 'income' ? (
                <>
                  <option value="دفعة من عميل">دفعة من عميل</option>
                  <option value="إيرادات أخرى">إيرادات أخرى</option>
                </>
              ) : (
                <>
                  <option value="دفعة لمورد">دفعة لمورد</option>
                  <option value="رواتب">رواتب</option>
                  <option value="إيجار">إيجار</option>
                  <option value="مصاريف كهرباء ومياه">مصاريف كهرباء ومياه</option>
                  <option value="مصاريف أخرى">مصاريف أخرى</option>
                </>
              )}
            </select>
          </div>
          <div className="space-y-1 relative z-50">
            <label className="text-sm font-bold text-text-muted">الطرف الثاني (عميل أو مورد)</label>
            <div className="relative">
              <input 
                type="text" 
                value={partySearch}
                onChange={e => {
                  setPartySearch(e.target.value);
                  setIsPartyDropdownOpen(true);
                  if (partyId && parties.find(p => p.id.toString() === partyId)?.name !== e.target.value) {
                    setPartyId('');
                  }
                }}
                onFocus={() => setIsPartyDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsPartyDropdownOpen(false), 200)}
                placeholder="بحث..." 
                className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
              {isPartyDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-[60]">
                  {parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).length > 0 ? (
                    parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setPartyId(p.id.toString());
                          setPartySearch(p.name);
                          setIsPartyDropdownOpen(false);
                        }} 
                        className="p-2.5 hover:bg-bg-main cursor-pointer text-sm font-medium flex justify-between items-center"
                      >
                        <div>
                          {p.name} {p.phone && <span className="text-text-muted text-xs mx-2">({p.phone})</span>}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-bg-main rounded-lg text-text-muted">
                          {p.type === 'customer' ? 'عميل' : 'مورد'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 text-sm text-text-muted text-center">لا توجد نتائج تطابق بحثك</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">الوصف</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 h-24" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors"
            >
              إلغاء
            </button>
            <button onClick={handleSave} className={cn(
              "px-6 py-2 text-white rounded-xl transition-all shadow-md font-bold",
              transactionType === 'income' ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
            )}>
              {editingTransactionId ? 'تحديث العملية' : 'حفظ العملية'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewTransaction} onClose={() => setViewTransaction(null)} title="تفاصيل الحركة" size="md">
        {viewTransaction && (
          <div className="space-y-4 print:hidden">
            <div className="print-area-view text-black font-cairo space-y-4" dir="rtl">
              <div className="hidden print:block mb-8 border-b-2 border-black pb-6 text-center">
                <h2 className="text-2xl font-bold mb-2">إيصال حركة خزينة</h2>
                <p className="text-gray-600">تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">رقم الحركة:</span>
                <span className="font-bold">#{viewTransaction.id}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">التاريخ:</span>
                <span className="font-bold">{viewTransaction.date}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">النوع:</span>
                <span className={viewTransaction.type === 'income' ? "text-success font-bold print:text-black" : "text-danger font-bold print:text-black"}>
                  {viewTransaction.type === 'income' ? 'إيراد / وارد' : 'مصروف / صادر'}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">التصنيف:</span>
                <span className="font-bold">{viewTransaction.category}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">المبلغ:</span>
                <span className="font-bold text-primary print:text-black">{formatCurrency(viewTransaction.amount, viewTransaction.currency || 'IQD')}</span>
              </div>
              {viewTransaction.party_name && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-muted">الطرف الثاني:</span>
                  <span className="font-bold">{viewTransaction.party_name}</span>
                </div>
              )}
              {viewTransaction.description && (
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-text-muted">الوصف:</span>
                  <p className="bg-bg-main print:bg-transparent print:border print:border-gray-300 p-3 rounded-xl text-sm leading-relaxed">{viewTransaction.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4 print:hidden">
              <button onClick={() => setViewTransaction(null)} className="px-6 py-2 font-bold rounded-xl bg-bg-main hover:bg-border transition-colors">إغلاق</button>
              <button onClick={() => handlePrintPreview(viewTransaction)} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-colors flex items-center gap-2"><Printer size={18}/> طباعة</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!previewTransactionToPrint} onClose={() => setPreviewTransactionToPrint(null)} title="معاينة إيصال الطباعة" size="lg">
        {previewTransactionToPrint && (
          <div className="print:hidden space-y-4">
            <div className="border border-border rounded-xl p-4 bg-gray-50 overflow-auto max-h-[60vh]">
              <TreasuryPrintTemplate transaction={previewTransactionToPrint} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setPreviewTransactionToPrint(null)} className="px-6 py-2 font-bold rounded-xl bg-bg-main hover:bg-border transition-colors">إلغاء</button>
              <button onClick={handlePrint} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-colors flex items-center gap-2">
                <Printer size={18}/> تأكيد الطباعة
              </button>
            </div>
          </div>
        )}
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

export default Treasury;
