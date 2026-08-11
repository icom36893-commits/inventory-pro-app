import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modal';
import { Party, Fund } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store';
import { useToast } from '../../context/ToastContext';
import SearchableSelect from '../shared/SearchableSelect';

interface JournalVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  parties: Party[];
  funds: Fund[];
  onSuccess: () => void;
  journalId?: number | null;
  viewMode?: boolean;
}

interface Entry {
  id: number;
  account_type: 'party' | 'fund';
  account_id: number | '';
  debit_iqd: number;
  credit_iqd: number;
  debit_usd: number;
  credit_usd: number;
  description: string;
  category?: string;
}

const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({ isOpen, onClose, parties, funds, onSuccess, journalId }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, account_type: 'party', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '', category: '' },
    { id: 2, account_type: 'fund', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '', category: '' }
  ]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('income');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const toast = useToast();

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
          { id: 1, account_type: 'party', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '', category: '' },
          { id: 2, account_type: 'fund', account_id: '', debit_iqd: 0, credit_iqd: 0, debit_usd: 0, credit_usd: 0, description: '', category: '' }
        ]);
      }
      
      // Fetch Categories
      (window as any).api.basicData.getTreasuryCategories().then(setCategories);
    }
  }, [isOpen, journalId]);

  const totalDebitIqd = entries.reduce((sum, e) => sum + (Number(e.debit_iqd) || 0), 0);
  const totalCreditIqd = entries.reduce((sum, e) => sum + (Number(e.credit_iqd) || 0), 0);
  const totalDebitUsd = entries.reduce((sum, e) => sum + (Number(e.debit_usd) || 0), 0);
  const totalCreditUsd = entries.reduce((sum, e) => sum + (Number(e.credit_usd) || 0), 0);

  const diffIqd = Math.abs(totalDebitIqd - totalCreditIqd);
  const diffUsd = Math.abs(totalDebitUsd - totalCreditUsd);
  const isBalanced = diffIqd <= 0.001 && diffUsd <= 0.001;
  const hasAmounts = entries.some(e => Number(e.debit_iqd) > 0 || Number(e.credit_iqd) > 0 || Number(e.debit_usd) > 0 || Number(e.credit_usd) > 0);
  const isValid = isBalanced && hasAmounts && entries.every(e => e.account_id !== '');

  const searchOptions = [
    ...parties.map(p => ({ value: `party-${p.id}`, label: p.name, type: p.type === 'customer' ? 'عميل' : 'مورد' })),
    ...funds.map(f => ({ value: `fund-${f.id}`, label: f.name, type: 'صندوق' }))
  ];

  const categoryOptions = categories.map(c => ({
    value: c.name,
    label: c.name,
    type: c.type === 'income' ? 'إيراد' : 'مصروف'
  }));

  const addEntry = () => {
    setEntries([...entries, { 
      id: Date.now(), 
      account_type: 'party', 
      account_id: '', 
      debit_iqd: 0, 
      credit_iqd: 0, 
      debit_usd: 0, 
      credit_usd: 0, 
      description: '',
      category: ''
    }]);
  };

  const removeEntry = (id: number) => {
    if (entries.length <= 2) {
      toast.error('يجب أن يحتوي القيد على حسابين كحد أدنى');
      return;
    }
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: number, field: keyof Entry, value: any) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const newEntry = { ...e, [field]: value };
        return newEntry;
      }
      return e;
    }));
  };

  const updateAccount = (id: number, val: string) => {
    const [type, accId] = val.split('-');
    setEntries(entries.map(e => e.id === id ? { ...e, account_type: type as 'party' | 'fund', account_id: Number(accId) } : e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (entries.some(e => e.account_id === '')) {
      toast.error('الرجاء اختيار الحساب لجميع الأسطر');
      return;
    }
    
    if (Math.abs(totalDebitIqd - totalCreditIqd) > 0.001) {
      toast.error('القيد غير متوازن (دينار)');
      return;
    }
    
    if (Math.abs(totalDebitUsd - totalCreditUsd) > 0.001) {
      toast.error('القيد غير متوازن (دولار)');
      return;
    }

    const hasAmounts = entries.some(e => e.debit_iqd > 0 || e.credit_iqd > 0 || e.debit_usd > 0 || e.credit_usd > 0);
    if (!hasAmounts) {
      toast.error('الرجاء إدخال مبالغ للقيد');
      return;
    }

    try {
      setIsSubmitting(true);
      const journalData = {
        date,
        notes,
        entries: entries.map(e => ({
          ...e,
          account_id: Number(e.account_id),
          debit_iqd: Number(e.debit_iqd) || 0,
          credit_iqd: Number(e.credit_iqd) || 0,
          debit_usd: Number(e.debit_usd) || 0,
          credit_usd: Number(e.credit_usd) || 0,
        }))
      };

      if (journalId) {
        await (window as any).api.journals.update(journalId, journalData, user?.id || 1);
        toast.success('تم تعديل سند القيد بنجاح');
      } else {
        await (window as any).api.journals.create(journalData, user?.id || 1);
        toast.success('تم حفظ سند القيد بنجاح');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حفظ القيد');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return toast.error('الرجاء إدخال اسم التصنيف');
    try {
      const newCatId = await (window as any).api.basicData.createTreasuryCategory({
        name: newCategoryName,
        type: newCategoryType
      });
      
      // Optimistic update to guarantee immediate UI refresh
      const newCat = { id: newCatId, name: newCategoryName, type: newCategoryType, is_system: 0 };
      setCategories(prev => [newCat, ...prev]);
      
      toast.success('تمت إضافة التصنيف بنجاح');
      setIsAddCategoryModalOpen(false);
      setNewCategoryName('');
      
      // Background sync
      const cats = await (window as any).api.basicData.getTreasuryCategories();
      setCategories(cats || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء الإضافة');
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="سند قيد متعدد" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in p-2">
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">تاريخ القيد <span className="text-danger">*</span></label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium cursor-pointer text-gray-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">البيان العام للقيد</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium text-gray-800"
              placeholder="وصف أو سبب هذا القيد المزدوج..."
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-visible bg-white shadow-sm relative z-40">
          <div className="overflow-visible">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-black w-[220px]">الحساب / الطرف</th>
                  <th className="p-4 font-black w-[160px]">
                    <div className="flex items-center justify-between">
                      <span>تصنيف الحركة</span>
                      <button type="button" onClick={() => setIsAddCategoryModalOpen(true)} className="text-primary hover:text-white hover:bg-primary p-1 bg-primary/10 rounded-lg transition-all" title="إضافة تصنيف">
                        <Plus size={14} />
                      </button>
                    </div>
                  </th>
                  <th className="p-4 font-black">البيان (التفاصيل)</th>
                  <th className="p-4 font-black w-[130px] bg-green-50/50">مدين (IQD)</th>
                  <th className="p-4 font-black w-[130px] bg-red-50/50">دائن (IQD)</th>
                  <th className="p-4 font-black w-[130px] bg-green-50/50">مدين (USD)</th>
                  <th className="p-4 font-black w-[130px] bg-red-50/50">دائن (USD)</th>
                  <th className="p-4 font-black w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 relative">
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors relative" style={{ zIndex: 50 - index }}>
                    <td className="p-2 relative">
                      <div className="w-full relative z-[60]">
                        <SearchableSelect
                          options={searchOptions}
                          value={entry.account_id ? `${entry.account_type}-${entry.account_id}` : ''}
                          onChange={(val) => updateAccount(entry.id, val)}
                          placeholder="ابحث واختر..."
                          requireSearch={true}
                        />
                      </div>
                    </td>
                    <td className="p-2 relative">
                      <div className="w-full relative z-[59]">
                        <SearchableSelect
                          options={categoryOptions}
                          value={entry.category || ''}
                          onChange={(val) => updateEntry(entry.id, 'category', val)}
                          placeholder="اختر..."
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.description}
                        onChange={e => updateEntry(entry.id, 'description', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-gray-700"
                        placeholder="وصف السطر..."
                      />
                    </td>
                    <td className="p-2 bg-green-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={entry.debit_iqd || ''}
                        onChange={e => updateEntry(entry.id, 'debit_iqd', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-success/30 focus:border-success/50 transition-all font-bold text-success text-center"
                        dir="ltr"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 bg-red-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={entry.credit_iqd || ''}
                        onChange={e => updateEntry(entry.id, 'credit_iqd', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger/50 transition-all font-bold text-danger text-center"
                        dir="ltr"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 bg-green-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={entry.debit_usd || ''}
                        onChange={e => updateEntry(entry.id, 'debit_usd', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-success/30 focus:border-success/50 transition-all font-bold text-success text-center"
                        dir="ltr"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-2 bg-red-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={entry.credit_usd || ''}
                        onChange={e => updateEntry(entry.id, 'credit_usd', e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger/50 transition-all font-bold text-danger text-center"
                        dir="ltr"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100/80 font-black text-gray-800 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="p-4 text-left">إجمالي القيد:</td>
                  <td className="p-4 text-center font-bold text-success text-lg bg-green-100/50" dir="ltr">{totalDebitIqd.toLocaleString()}</td>
                  <td className="p-4 text-center font-bold text-danger text-lg bg-red-100/50" dir="ltr">{totalCreditIqd.toLocaleString()}</td>
                  <td className="p-4 text-center font-bold text-success text-lg bg-green-100/50" dir="ltr">{totalDebitUsd.toLocaleString()}</td>
                  <td className="p-4 text-center font-bold text-danger text-lg bg-red-100/50" dir="ltr">{totalCreditUsd.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-2 px-5 py-2.5 text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all font-bold shadow-sm"
            >
              <Plus size={20} />
              إضافة سطر جديد
            </button>
            
            {(!isBalanced && hasAmounts) && (
              <div className="animate-pulse flex items-center gap-2 text-danger font-bold text-sm bg-danger/10 border border-danger/20 px-4 py-2.5 rounded-xl shadow-inner">
                <span className="w-2 h-2 rounded-full bg-danger"></span>
                القيد غير متزن! الفرق: {diffIqd > 0.001 && `(د.ع ${diffIqd.toLocaleString()})`} {diffUsd > 0.001 && `($ ${diffUsd.toLocaleString()})`}
              </div>
            )}
            
            {(isBalanced && hasAmounts) && (
              <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 border border-success/20 px-4 py-2.5 rounded-xl shadow-inner">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                القيد متزن وجاهز للحفظ
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 transition-all font-bold flex-1 md:flex-none"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex-1 md:flex-none"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وحفظ القيد'}
            </button>
          </div>
        </div>
      </form>
    </Modal>

    <Modal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} title="إضافة تصنيف محاسبي جديد" size="sm">
      <div className="space-y-6 animate-fade-in p-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">اسم التصنيف <span className="text-danger">*</span></label>
          <input 
            type="text" 
            value={newCategoryName} 
            onChange={e => setNewCategoryName(e.target.value)} 
            className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm font-bold" 
            placeholder="مثال: إيجارات، مصاريف تسويق، مبيعات جملة..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">النوع / التوجيه <span className="text-danger">*</span></label>
          <select 
            value={newCategoryType} 
            onChange={e => setNewCategoryType(e.target.value as 'income' | 'expense')} 
            className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm font-bold cursor-pointer"
          >
            <option value="income">إيرادات (دائن بطبيعته)</option>
            <option value="expense">مصروفات (مدين بطبيعته)</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button 
            type="button"
            onClick={() => setIsAddCategoryModalOpen(false)}
            className="px-6 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors font-bold"
          >
            إلغاء الأمر
          </button>
          <button 
            type="button"
            onClick={handleAddCategory} 
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md font-bold"
          >
            حفظ التصنيف
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default JournalVoucherModal;
