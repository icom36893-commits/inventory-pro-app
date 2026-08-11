import React, { useState, useEffect } from 'react';
import { Plus, Wrench, RefreshCw, Trash2, Edit2, Archive, CheckCircle, FileText, Printer } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/cn';

interface Equipment {
 id: number;
 name: string;
 total_qty: number;
 available_qty: number;
 status: string;
 notes: string;
}

interface EquipmentLoan {
 id: number;
 equipment_id: number;
 equipment_name: string;
 borrower_name: string;
 qty_borrowed: number;
 loan_date: string;
 expected_return_date: string;
 return_date: string;
 status: string;
 notes: string;
}

const EquipmentPage: React.FC = () => {
 const [activeTab, setActiveTab] = useState<'equipments' | 'loans'>('equipments');
 const [equipments, setEquipments] = useState<Equipment[]>([]);
 const [loans, setLoans] = useState<EquipmentLoan[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [search, setSearch] = useState('');
 
 const toast = useToast();

 // Modals state
 const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
 const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
 const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
 const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);
 const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
 const [selectedLoan, setSelectedLoan] = useState<EquipmentLoan | null>(null);
 const [viewLoanData, setViewLoanData] = useState<EquipmentLoan | null>(null);
 const [loanToPrint, setLoanToPrint] = useState<EquipmentLoan | null>(null);

 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);

 // Forms state
 const [equipForm, setEquipForm] = useState({ name: '', total_qty: 1, available_qty: 1, status: 'available', notes: '' });
 const [loanForm, setLoanForm] = useState({ borrower_name: '', qty_borrowed: 1, loan_date: new Date().toISOString().split('T')[0], expected_return_date: '', return_date: '', notes: '' });
 const [returnForm, setReturnForm] = useState({ notes: '' });

 const fetchData = async () => {
 setIsLoading(true);
 try {
 if (activeTab === 'equipments') {
 const data = await (window as any).api.equipment.getAll();
 setEquipments(data);
 } else {
 const data = await (window as any).api.equipment.getLoans();
 setLoans(data);
 }
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء جلب البيانات');
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeTab]);

 // Equipment Actions
 const handleSaveEquip = async (e: React.FormEvent) => {
 e.preventDefault();
 try {
 if (editingEquip) {
 await (window as any).api.equipment.update(editingEquip.id, equipForm);
 toast.success('تم تحديث المعدة بنجاح');
 } else {
 await (window as any).api.equipment.create(equipForm);
 toast.success('تم إضافة المعدة بنجاح');
 }
 setIsEquipModalOpen(false);
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء الحفظ');
 }
 };

 const handleDeleteEquip = (id: number) => {
 setConfirmAction({
 isOpen: true,
 title: 'حذف المعدة',
 message: 'هل أنت متأكد من حذف هذه المعدة؟ سيتم حذف جميع سجلات التسليم المرتبطة بها.',
 type: 'danger',
 onConfirm: async () => {
 try {
 await (window as any).api.equipment.delete(id);
 toast.success('تم الحذف بنجاح');
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء الحذف');
 }
 }
 });
 };

 // Loan Actions
 const handleSaveLoan = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedEquip) return;
 if (loanForm.qty_borrowed > selectedEquip.available_qty) {
 toast.error('الكمية المطلوبة أكبر من المتوفر');
 return;
 }
 
 try {
 await (window as any).api.equipment.loan({
 equipment_id: selectedEquip.id,
 ...loanForm,
 created_by: 1 // Default or get from auth
 });
 toast.success('تم تسجيل التسليم بنجاح');
 setIsLoanModalOpen(false);
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء تسجيل التسليم');
 }
 };

 const handleReturn = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedLoan) return;
 try {
 await (window as any).api.equipment.return(selectedLoan.id, returnForm);
 toast.success('تم تسجيل الإرجاع بنجاح');
 setIsReturnModalOpen(false);
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء تسجيل الإرجاع');
 }
 };

 const equipColumns = [
 { key: 'name', label: 'اسم المعدة' },
 { key: 'total_qty', label: 'الكمية الإجمالية' },
 { key: 'available_qty', label: 'الكمية المتوفرة', render: (val: number) => (
 <span className={cn("px-2 py-1 rounded-full text-xs font-bold", val > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
 {val}
 </span>
 ) },
 { key: 'status', label: 'الحالة', render: (val: string) => (
 <span className={cn("px-2 py-1 rounded-full text-xs", val === 'available' ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800")}>
 {val === 'available' ? 'متاح' : 'في الصيانة'}
 </span>
 ) },
 { key: 'notes', label: 'ملاحظات', render: (val: string) => val || '-' },
 {
 key: 'actions',
 label: 'إجراءات',
 render: (_: any, item: Equipment) => (
 <div className="flex gap-2">
 <button
 onClick={() => {
 setSelectedEquip(item);
 setLoanForm({ borrower_name: '', qty_borrowed: 1, loan_date: new Date().toISOString().split('T')[0], expected_return_date: '', return_date: '', notes: '' });
 setIsLoanModalOpen(true);
 }}
 disabled={item.available_qty <= 0}
 className="p-1 text-primary hover:bg-primary/10 rounded disabled:opacity-50"
 title="تسليم"
 >
 <Archive size={18} />
 </button>
 <button
 onClick={() => {
 setEditingEquip(item);
 setEquipForm({ name: item.name, total_qty: item.total_qty, available_qty: item.available_qty, status: item.status, notes: item.notes || '' });
 setIsEquipModalOpen(true);
 }}
 className="p-1 text-blue-600 hover:bg-blue-50 rounded"
 title="تعديل"
 >
 <Edit2 size={18} />
 </button>
 <button
 onClick={() => handleDeleteEquip(item.id)}
 className="p-1 text-red-600 hover:bg-red-50 rounded"
 title="حذف"
 >
 <Trash2 size={18} />
 </button>
 </div>
 )
 }
 ];

 const loanColumns = [
 { key: 'equipment_name', label: 'المعدة' },
 { key: 'borrower_name', label: 'المستلم' },
 { key: 'qty_borrowed', label: 'الكمية' },
 { key: 'loan_date', label: 'تاريخ التسليم' },
 { key: 'expected_return_date', label: 'تاريخ الإرجاع المتوقع', render: (val: string) => val || '-' },
 { key: 'status', label: 'الحالة', render: (val: string) => (
 <span className={cn("px-2 py-1 rounded-full text-xs font-bold", val === 'active' ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800")}>
 {val === 'active' ? 'في عهدة المستلم' : 'مسترجعة'}
 </span>
 ) },
 { key: 'return_date', label: 'تاريخ الإرجاع الفعلي', render: (val: string) => val || '-' },
 {
 key: 'actions',
 label: 'إجراءات',
 render: (_: any, item: EquipmentLoan) => (
 <div className="flex gap-2">
 {item.status === 'active' && (
 <button
 onClick={() => {
 setSelectedLoan(item);
 setReturnForm({ notes: '' });
 setIsReturnModalOpen(true);
 }}
 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1 shadow-sm"
 title="إرجاع"
 >
 <CheckCircle size={14} /> استلام
 </button>
 )}
 <button
 onClick={() => setViewLoanData(item)}
 className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs flex items-center gap-1 shadow-sm"
 title="عرض التفاصيل"
 >
 <FileText size={14} /> التفاصيل
 </button>
 </div>
 )
 }
 ];

 const filteredEquipments = equipments.filter(e => e.name.includes(search) || e.notes?.includes(search));
 const filteredLoans = loans.filter(l => l.equipment_name?.includes(search) || l.borrower_name.includes(search));

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">إدارة المعدات</h1>
 <p className="text-text-muted text-sm mt-1">تتبع وتسجيل إعارة واسترجاع معدات العمل بدون أثر مالي بشكل احترافي.</p>
 </div>
 <div className="flex gap-3 w-full md:w-auto">
 {activeTab === 'equipments' && (
 <button
 onClick={() => {
 setEditingEquip(null);
 setEquipForm({ name: '', total_qty: 1, available_qty: 1, status: 'available', notes: '' });
 setIsEquipModalOpen(true);
 }}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-primary to-indigo-500 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/30 font-bold active:scale-95 w-full md:w-auto"
 >
 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
 <span>إضافة معدة</span>
 </button>
 )}
 <button
 onClick={fetchData}
 className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-all shadow-sm flex items-center justify-center"
 title="تحديث البيانات"
 >
 <RefreshCw size={22} className={isLoading ? "animate-spin text-primary" : ""} />
 </button>
 </div>
 </div>

 {/* Tabs - Segmented Control Style */}
 <div className="flex justify-center md:justify-start">
 <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto overflow-x-auto">
 <button 
 onClick={() => setActiveTab('equipments')}
 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'equipments' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
 >
 سجل المعدات
 </button>
 <button 
 onClick={() => setActiveTab('loans')}
 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'loans' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
 >
 سجل الاستلام والتسليم
 </button>
 </div>
 </div>

 {/* Content Container (Elevated Card) */}
 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
 <div className="mb-6 max-w-md">
 <SearchInput
 value={search}
 onChange={setSearch}
 placeholder={activeTab === 'equipments' ? "ابحث عن معدة..." : "ابحث عن معدة أو مستلم..."}
 className="bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 h-12"
 />
 </div>

 {isLoading ? (
 <div className="flex justify-center p-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 ) : (
 <div className="rounded-2xl overflow-hidden border border-gray-100">
 <DataTable
 columns={activeTab === 'equipments' ? equipColumns : loanColumns}
 data={activeTab === 'equipments' ? filteredEquipments : filteredLoans}
 />
 </div>
 )}
 </div>

 {/* Equipment Form Modal */}
 <Modal
 isOpen={isEquipModalOpen}
 onClose={() => setIsEquipModalOpen(false)}
 title={editingEquip ? "تعديل بيانات المعدة" : "إضافة معدة جديدة"}
 >
 <form onSubmit={handleSaveEquip} className="space-y-6 animate-fade-in p-2">
 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
 <h4 className="text-sm font-black text-primary flex items-center gap-2 mb-2">
 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
 البيانات الأساسية للمعدة
 </h4>
 
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">اسم المعدة <span className="text-danger">*</span></label>
 <input
 type="text"
 required
 value={equipForm.name}
 onChange={(e) => setEquipForm({ ...equipForm, name: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium"
 placeholder="مثال: دريل همر بوش، مولدة كهرباء..."
 />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">الكمية الإجمالية <span className="text-danger">*</span></label>
 <input
 type="number"
 min="1"
 required
 value={equipForm.total_qty}
 onChange={(e) => setEquipForm({ ...equipForm, total_qty: parseInt(e.target.value) || 1, available_qty: editingEquip ? equipForm.available_qty : parseInt(e.target.value) || 1 })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">الكمية المتوفرة للإعارة</label>
 <input
 type="number"
 min="0"
 max={equipForm.total_qty}
 required
 value={equipForm.available_qty}
 onChange={(e) => setEquipForm({ ...equipForm, available_qty: parseInt(e.target.value) || 0 })}
 className="w-full bg-gray-100/50 border border-transparent rounded-xl p-3 outline-none font-bold text-gray-500"
 disabled={!editingEquip}
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">حالة المعدة</label>
 <select
 value={equipForm.status}
 onChange={(e) => setEquipForm({ ...equipForm, status: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm cursor-pointer font-bold"
 >
 <option value="available">متاح / سليم ✅</option>
 <option value="maintenance">في الصيانة 🛠️</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">ملاحظات إضافية (اختياري)</label>
 <textarea
 value={equipForm.notes}
 onChange={(e) => setEquipForm({ ...equipForm, notes: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm h-12 resize-none"
 placeholder="أية تفاصيل إضافية عن المعدة..."
 ></textarea>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
 <button
 type="button"
 onClick={() => setIsEquipModalOpen(false)}
 className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-bold"
 >
 إلغاء الأمر
 </button>
 <button
 type="submit"
 className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg"
 >
 {editingEquip ? "حفظ التعديلات" : "إضافة المعدة"}
 </button>
 </div>
 </form>
 </Modal>

 {/* Loan Form Modal */}
 <Modal
 isOpen={isLoanModalOpen}
 onClose={() => setIsLoanModalOpen(false)}
 title="تسليم معدة لجهة / عامل"
 >
 <form onSubmit={handleSaveLoan} className="space-y-6 animate-fade-in p-2">
 {selectedEquip && (
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 shadow-inner flex items-center justify-between mb-2">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-blue-500 mb-1">المعدة المختارة للتسليم</span>
 <span className="font-black text-xl text-blue-900">{selectedEquip.name}</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-xs font-bold text-blue-500 mb-1">الكمية المتاحة حالياً</span>
 <span className="bg-white text-blue-700 px-4 py-1.5 rounded-xl font-black shadow-sm text-lg border border-blue-100">{selectedEquip.available_qty}</span>
 </div>
 </div>
 )}
 
 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
 <h4 className="text-sm font-black text-primary flex items-center gap-2 mb-2">
 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
 بيانات المستلم
 </h4>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">اسم المستلم (جهة / عامل) <span className="text-danger">*</span></label>
 <input
 type="text"
 required
 value={loanForm.borrower_name}
 onChange={(e) => setLoanForm({ ...loanForm, borrower_name: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium"
 placeholder="اكتب اسم العامل، المقاول، أو المشروع..."
 />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">الكمية المُسلّمة <span className="text-danger">*</span></label>
 <input
 type="number"
 min="1"
 max={selectedEquip?.available_qty || 1}
 required
 value={loanForm.qty_borrowed}
 onChange={(e) => setLoanForm({ ...loanForm, qty_borrowed: parseInt(e.target.value) || 1 })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-bold text-center text-lg text-primary"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">تاريخ التسليم <span className="text-danger">*</span></label>
 <input
 type="date"
 required
 value={loanForm.loan_date}
 onChange={(e) => setLoanForm({ ...loanForm, loan_date: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium cursor-pointer"
 />
 </div>
 </div>
 </div>

 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
 <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-2">
 تفاصيل الإرجاع والملاحظات
 </h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">تاريخ الإرجاع المتوقع</label>
 <input
 type="date"
 value={loanForm.expected_return_date}
 onChange={(e) => setLoanForm({ ...loanForm, expected_return_date: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium cursor-pointer"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">تاريخ الإرجاع الفعلي (للسجلات القديمة)</label>
 <input
 type="date"
 value={loanForm.return_date}
 onChange={(e) => setLoanForm({ ...loanForm, return_date: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium cursor-pointer"
 />
 </div>
 </div>
 
 <div className="space-y-2 pt-2">
 <label className="text-sm font-bold text-gray-700">ملاحظات وحالة المعدة عند التسليم</label>
 <textarea
 value={loanForm.notes}
 onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm h-16 resize-none"
 placeholder="سجل أية خدوش، أعطال بسيطة، أو ملحقات تم تسليمها مع المعدة..."
 ></textarea>
 </div>
 </div>
 
 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
 <button
 type="button"
 onClick={() => setIsLoanModalOpen(false)}
 className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-bold"
 >
 إلغاء الأمر
 </button>
 <button
 type="submit"
 className="px-8 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg flex items-center gap-2"
 >
 <Archive size={20} />
 تأكيد تسليم المعدة
 </button>
 </div>
 </form>
 </Modal>

 {/* Return Form Modal */}
 <Modal
 isOpen={isReturnModalOpen}
 onClose={() => setIsReturnModalOpen(false)}
 title="استلام وإرجاع المعدة"
 >
 <form onSubmit={handleReturn} className="space-y-6 animate-fade-in p-2">
 {selectedLoan && (
 <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-warning to-orange-400 rounded-r-2xl"></div>
 
 <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
 معلومات وصل الاستلام الحالي
 </h4>
 
 <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
 <div className="flex flex-col gap-1 bg-gray-50/50 p-2 rounded-xl">
 <span className="text-gray-500 font-bold">المعدة</span>
 <span className="font-black text-gray-900">{selectedLoan.equipment_name}</span>
 </div>
 <div className="flex flex-col gap-1 bg-gray-50/50 p-2 rounded-xl">
 <span className="text-gray-500 font-bold">المستلم</span>
 <span className="font-black text-gray-900">{selectedLoan.borrower_name}</span>
 </div>
 <div className="flex flex-col gap-1 bg-primary/5 p-2 rounded-xl border border-primary/10">
 <span className="text-primary/70 font-bold">الكمية المسلمة</span>
 <span className="font-black text-primary text-lg">{selectedLoan.qty_borrowed}</span>
 </div>
 <div className="flex flex-col gap-1 bg-gray-50/50 p-2 rounded-xl">
 <span className="text-gray-500 font-bold">تاريخ التسليم</span>
 <span className="font-bold text-gray-800">{selectedLoan.loan_date ? new Date(selectedLoan.loan_date).toLocaleDateString('en-GB') : '-'}</span>
 </div>
 </div>
 </div>
 )}
 
 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 ملاحظات الاسترجاع (اختياري)
 </label>
 <textarea
 value={returnForm.notes}
 onChange={(e) => setReturnForm({ notes: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm h-24 resize-none text-gray-700 font-medium"
 placeholder="مثال: تم استرجاع المعدة بحالة سليمة، أو يوجد كسر بسيط في المقبض..."
 ></textarea>
 </div>
 
 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
 <button
 type="button"
 onClick={() => setIsReturnModalOpen(false)}
 className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-bold"
 >
 إلغاء الأمر
 </button>
 <button
 type="submit"
 className="px-8 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-success/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg flex items-center gap-2"
 >
 <CheckCircle size={20} />
 تأكيد الاسترجاع
 </button>
 </div>
 </form>
 </Modal>

 {/* View Loan Details Modal */}
 <Modal
 isOpen={!!viewLoanData}
 onClose={() => setViewLoanData(null)}
 title="تفاصيل وصل الاستلام/التسليم"
 >
 {viewLoanData && (
 <div className="space-y-4">
 <div id="print-loan-receipt" className="p-6 bg-white border rounded-xl print:border-none">
 <div className="text-center mb-6 border-b pb-4">
 <h2 className="text-2xl font-bold">{viewLoanData.status === 'active' ? 'وصل تسليم' : 'وصل استرجاع'}</h2>
 <p className="text-gray-500 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}</p>
 </div>
 <div className="space-y-4 text-sm">
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">المعدة:</span> <span className="font-bold text-lg">{viewLoanData.equipment_name}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">المستلم/الجهة:</span> <span className="font-bold text-lg">{viewLoanData.borrower_name}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">الكمية:</span> <span className="font-bold text-lg">{viewLoanData.qty_borrowed}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ التسليم:</span> <span className="font-bold text-lg">{viewLoanData.loan_date ? new Date(viewLoanData.loan_date).toLocaleDateString('en-GB') : '-'}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ الإرجاع المتوقع:</span> <span className="font-bold text-lg">{viewLoanData.expected_return_date ? new Date(viewLoanData.expected_return_date).toLocaleDateString('en-GB') : 'غير محدد'}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">الحالة:</span> <span className="font-bold text-lg">{viewLoanData.status === 'active' ? 'في العهدة' : 'مسترجعة'}</span></div>
 {viewLoanData.status === 'returned' && (
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ الإرجاع الفعلي:</span> <span className="font-bold text-lg">{viewLoanData.return_date ? new Date(viewLoanData.return_date).toLocaleDateString('en-GB') : '-'}</span></div>
 )}
 {viewLoanData.notes && (
 <div className="mt-4"><span className="font-bold block mb-2 text-gray-600">ملاحظات:</span> <p className="bg-gray-50 p-4 rounded-lg">{viewLoanData.notes}</p></div>
 )}
 </div>
 
 <div className="mt-16 flex justify-between px-10">
 <div className="text-center"><p className="font-bold text-gray-600">توقيع المستلم</p><p className="mt-8 border-b-2 border-gray-400 w-40 mx-auto"></p></div>
 <div className="text-center"><p className="font-bold text-gray-600">توقيع الإدارة / أمين المخزن</p><p className="mt-8 border-b-2 border-gray-400 w-40 mx-auto"></p></div>
 </div>
 </div>
 
 <div className="flex justify-end gap-3 pt-4 border-t mt-6">
 <button
 type="button"
 onClick={() => setViewLoanData(null)}
 className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
 >
 إغلاق
 </button>
 <button
 type="button"
 onClick={() => {
 setLoanToPrint(viewLoanData);
 setTimeout(() => window.print(), 300);
 }}
 className="px-5 py-2 text-white bg-primary hover:bg-primary-light rounded-lg font-bold transition-all shadow-md flex items-center gap-2"
 >
 <Printer size={18} />
 طباعة الوصل
 </button>
 </div>
 </div>
 )}
 </Modal>

 {/* Hidden print area */}
 {loanToPrint && (
 <div className="hidden print:block print-area-view absolute top-0 left-0 w-full bg-white z-50 p-8" dir="rtl">
 <div className="text-center mb-6 border-b pb-4">
 <h2 className="text-2xl font-bold">{loanToPrint.status === 'active' ? 'وصل تسليم' : 'وصل استرجاع'}</h2>
 <p className="text-gray-500 mt-2">تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}</p>
 </div>
 <div className="space-y-4 text-lg">
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">المعدة:</span> <span className="font-bold">{loanToPrint.equipment_name}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">المستلم/الجهة:</span> <span className="font-bold">{loanToPrint.borrower_name}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">الكمية:</span> <span className="font-bold">{loanToPrint.qty_borrowed}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ التسليم:</span> <span className="font-bold">{loanToPrint.loan_date ? new Date(loanToPrint.loan_date).toLocaleDateString('en-GB') : '-'}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ الإرجاع المتوقع:</span> <span className="font-bold">{loanToPrint.expected_return_date ? new Date(loanToPrint.expected_return_date).toLocaleDateString('en-GB') : 'غير محدد'}</span></div>
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">الحالة:</span> <span className="font-bold">{loanToPrint.status === 'active' ? 'في العهدة' : 'مسترجعة'}</span></div>
 {loanToPrint.status === 'returned' && (
 <div className="flex justify-between border-b pb-2"><span className="font-bold text-gray-600">تاريخ الإرجاع الفعلي:</span> <span className="font-bold">{loanToPrint.return_date ? new Date(loanToPrint.return_date).toLocaleDateString('en-GB') : '-'}</span></div>
 )}
 {loanToPrint.notes && (
 <div className="mt-4"><span className="font-bold block mb-2 text-gray-600">ملاحظات:</span> <p className="bg-gray-50 p-4 rounded-lg">{loanToPrint.notes}</p></div>
 )}
 </div>
 
 <div className="mt-16 flex justify-between px-10">
 <div className="text-center"><p className="font-bold text-gray-600">توقيع المستلم</p><p className="mt-8 border-b-2 border-gray-400 w-40 mx-auto"></p></div>
 <div className="text-center"><p className="font-bold text-gray-600">توقيع الإدارة / أمين المخزن</p><p className="mt-8 border-b-2 border-gray-400 w-40 mx-auto"></p></div>
 </div>
 </div>
 )}

 {/* Confirm Delete Action */}
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

export default EquipmentPage;

