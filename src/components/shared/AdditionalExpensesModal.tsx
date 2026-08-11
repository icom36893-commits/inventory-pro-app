import React, { useState, useEffect } from 'react';
import { Receipt, User, Calendar, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

interface AdditionalExpensesModalProps {
 isOpen: boolean;
 onClose: () => void;
 additionalExpenses: any[];
 setAdditionalExpenses: (expenses: any[]) => void;
 defaultPartyName: string;
}

export default function AdditionalExpensesModal({
 isOpen,
 onClose,
 additionalExpenses,
 setAdditionalExpenses,
 defaultPartyName
}: AdditionalExpensesModalProps) {
 const [expenseForm, setExpenseForm] = useState({ party_name: defaultPartyName || '', date: new Date().toISOString().split('T')[0], amount: 0, details: '' });
 const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);
 const toast = useToast();

 useEffect(() => {
 if (isOpen && editingExpenseIndex === null) {
 setExpenseForm(prev => ({ ...prev, party_name: defaultPartyName || '' }));
 }
 }, [isOpen, defaultPartyName]);

 return (
 <Modal isOpen={isOpen} onClose={onClose} title="المصاريف الإضافية" size="lg">
 <div className="space-y-6 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white rounded-b-3xl p-2 md:p-6">
 <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/10 rounded-full pointer-events-none"></div>
 
 <div className="bg-white/80 border border-gray-100 rounded-3xl p-6 shadow-sm relative z-10">
 <h4 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
 <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
 <Receipt size={20} />
 </span>
 تفاصيل المصروف
 </h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">اسم العميل/المورد</label>
 <div className="relative">
 <input type="text" value={expenseForm.party_name} onChange={e => setExpenseForm({...expenseForm, party_name: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-3.5 pr-11 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-gray-800" />
 <User size={18} className="absolute right-4 top-3.5 text-gray-400" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">التاريخ</label>
 <div className="relative">
 <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-3.5 pr-11 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-gray-800" />
 <Calendar size={18} className="absolute right-4 top-3.5 text-gray-400" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">المبلغ (دينار عراقي)</label>
 <input type="number" value={expenseForm.amount || ''} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-black text-primary text-center" dir="ltr" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">التفاصيل (اختياري)</label>
 <div className="relative">
 <input type="text" value={expenseForm.details} onChange={e => setExpenseForm({...expenseForm, details: e.target.value})} placeholder="مثال: أجور نقل..." className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-3.5 pr-11 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-gray-800" />
 <FileText size={18} className="absolute right-4 top-3.5 text-gray-400" />
 </div>
 </div>
 </div>
 
 <div className="flex justify-end pt-6 mt-4 border-t border-gray-100">
 <button onClick={() => {
 if (expenseForm.amount <= 0) return toast.warning('الرجاء إدخال المبلغ');
 const newExpenses = [...additionalExpenses];
 if (editingExpenseIndex !== null) {
 newExpenses[editingExpenseIndex] = expenseForm as any;
 } else {
 newExpenses.push(expenseForm as any);
 }
 setAdditionalExpenses(newExpenses);
 setExpenseForm({ date: new Date().toISOString().split('T')[0], amount: 0, details: '', party_name: defaultPartyName || '' });
 setEditingExpenseIndex(null);
 }} className={`px-8 py-3.5 rounded-2xl font-black transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 ${editingExpenseIndex !== null ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-amber-500/20 hover:shadow-amber-500/40' : 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-primary/20 hover:shadow-primary/40'}`}>
 {editingExpenseIndex !== null ? <><Edit size={18} /> حفظ التعديل</> : <><Plus size={18} /> إضافة المصروف</>}
 </button>
 </div>
 </div>

 <div className="relative z-10 pt-2">
 <h4 className="text-lg font-black text-gray-800 mb-4 px-2">قائمة المصاريف المضافة</h4>
 {additionalExpenses.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 border border-gray-200 border-dashed rounded-3xl text-gray-400">
 <Receipt size={48} className="mb-3 opacity-20" />
 <span className="font-bold text-sm">لا توجد مصاريف إضافية حتى الآن</span>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
 {additionalExpenses.map((exp, idx) => (
 <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative group flex flex-col justify-between">
 <div className="flex justify-between items-start mb-4">
 <div className="font-black text-primary text-xl tracking-tight" dir="ltr">{formatCurrency(exp.amount, 'IQD')}</div>
 <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
 <button onClick={() => { setExpenseForm(exp as any); setEditingExpenseIndex(idx); }} className="text-amber-500 bg-amber-50 hover:bg-amber-100 p-2 rounded-xl transition-colors"><Edit size={16} /></button>
 <button onClick={() => setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== idx))} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-colors"><Trash2 size={16} /></button>
 </div>
 </div>
 <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
 <div className="text-sm font-black text-gray-800 flex items-center gap-2"><User size={14} className="text-gray-400" /> {exp.party_name}</div>
 <div className="text-xs font-bold text-gray-500 flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> {exp.date}</div>
 {exp.details && (
 <div className="text-xs font-medium text-gray-500 flex items-start gap-2 mt-1 pt-2 border-t border-gray-100/50">
 <FileText size={14} className="text-gray-400 shrink-0" />
 <span className="line-clamp-2 leading-relaxed">{exp.details}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </Modal>
 );
}
