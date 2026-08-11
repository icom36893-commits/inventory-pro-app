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
import StatementPrintTemplate from '../components/shared/StatementPrintTemplate';
import { useToast } from '../context/ToastContext';
import { useAuthStore, useSettingsStore } from '../store';
import { usePermissionsStore } from '../store/permissions';
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
 const { user } = useAuthStore();
 const { hasPermission, showPermissionAlert } = usePermissionsStore();

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
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeType]);

 useEffect(() => {
 if (pendingAction === 'open_customer_modal' && activeType === 'customer') {
 handleAddNew();
 setPendingAction(null);
 } else if (pendingAction === 'open_supplier_modal' && activeType === 'supplier') {
 handleAddNew();
 setPendingAction(null);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [pendingAction, activeType, setPendingAction]);

 const filteredParties = parties.filter(p => 
 (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
 (p.code || '').toLowerCase().includes(search.toLowerCase())
 );

 const handleEdit = (party: Party) => {
 if (!hasPermission(user?.role || 'user', 'parties.edit')) { showPermissionAlert(); return; }
 setEditingParty(party);
 setIsModalOpen(true);
 };

 const handleAddNew = () => {
 if (!hasPermission(user?.role || 'user', 'parties.create')) { showPermissionAlert(); return; }
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
 'نوع الحركة': ({
 opening_balance: 'رصيد افتتاحي',
 invoice: 'فاتورة',
 payment: 'دفعة/سداد',
 journal: 'سند قيد يومية',
 sale: 'فاتورة مبيعات',
 purchase: 'فاتورة مشتريات',
 return: 'فاتورة مرتجع'
 } as Record<string, string>)[tx.type] || tx.type,
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
 if (!hasPermission(user?.role || 'user', 'parties.delete')) { showPermissionAlert(); return; }
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
 
 // Filter by the selected currency
 if ((tx.currency || 'IQD') !== statementCurrency) return false;
 
 return true; 
 });

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
 إدارة {activeType === 'customer' ? 'العملاء' : 'الموردين'}
 </h1>
 <p className="text-text-muted text-sm mt-1">
 إدارة بيانات {activeType === 'customer' ? 'العملاء ومتابعة مديونياتهم' : 'الموردين ومتابعة مستحقاتهم'} بشكل احترافي.
 </p>
 </div>
 <button 
 onClick={handleAddNew}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-primary to-indigo-500 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/30 font-bold active:scale-95"
 >
 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
 <span>إضافة {activeType === 'customer' ? 'عميل' : 'مورد'} جديد</span>
 </button>
 </div>

 <div className="print:hidden">
 {/* Tabs - Segmented Control Style */}
 <div className="flex justify-center md:justify-start mb-8">
 <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
 <button 
 onClick={() => setActiveType('customer')}
 className={cn(
 "flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300",
 activeType === 'customer' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
 )}
 >
 <Users size={20} />
 <span>العملاء</span>
 </button>
 <button 
 onClick={() => setActiveType('supplier')}
 className={cn(
 "flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300",
 activeType === 'supplier' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
 )}
 >
 <Truck size={20} />
 <span>الموردون</span>
 </button>
 </div>
 </div>

 {/* Content Container (Elevated Card for controls and table) */}
 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
 <div className="flex flex-col md:flex-row gap-4 mb-8">
 <SearchInput 
 value={search} 
 onChange={setSearch} 
 placeholder={`البحث في ${activeType === 'customer' ? 'العملاء' : 'الموردين'}...`} 
 className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 h-12"
 />
 <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 h-12">
 <button 
 onClick={() => setViewMode('grid')}
 className={cn("px-4 rounded-lg transition-all flex items-center justify-center", viewMode === 'grid' ? "bg-white text-primary shadow-sm font-bold" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
 title="عرض شبكي"
 ><LayoutGrid size={20} /></button>
 <button 
 onClick={() => setViewMode('table')}
 className={cn("px-4 rounded-lg transition-all flex items-center justify-center", viewMode === 'table' ? "bg-white text-primary shadow-sm font-bold" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
 title="عرض قائمة"
 ><LayoutList size={20} /></button>
 </div>
 </div>

 {isLoading ? (
 <div className="flex justify-center p-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 ) : viewMode === 'grid' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredParties.map((party) => (
 <div key={party.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group">
 <div className="flex justify-between items-start mb-6">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-indigo-500 group-hover:text-white transition-all duration-300 shadow-sm">
 {activeType === 'customer' ? <Users size={26} /> : <Truck size={26} />}
 </div>
 <div className="flex gap-1.5">
 <button onClick={() => handleEdit(party)} title="تعديل" className="p-2.5 rounded-xl bg-gray-50 hover:bg-primary hover:text-white text-gray-500 transition-colors shadow-sm">
 <Edit2 size={16} />
 </button>
 <button onClick={() => handleViewStatement(party)} title="كشف حساب" className="p-2.5 rounded-xl bg-gray-50 hover:bg-info hover:text-white text-gray-500 transition-colors shadow-sm">
 <Eye size={16} />
 </button>
 <button onClick={() => handleDelete(party)} title="حذف" className="p-2.5 rounded-xl bg-gray-50 hover:bg-danger hover:text-white text-gray-500 transition-colors shadow-sm">
 <Trash2 size={16} />
 </button>
 </div>
 </div>
 
 <h3 className="text-xl font-black text-gray-800 mb-1">{party.name}</h3>
 <p className="text-xs font-bold text-primary/70 mb-5 bg-primary/5 w-fit px-2 py-1 rounded-md tracking-wider">{party.code}</p>
 
 <div className="space-y-3 mb-8">
 <div className="flex items-center gap-3 text-sm text-gray-500">
 <div className="p-1.5 rounded-lg bg-gray-50"><Phone size={14} className="text-gray-400" /></div>
 <span className="font-medium">{party.phone || 'لا يوجد رقم'}</span>
 </div>
 <div className="flex items-center gap-3 text-sm text-gray-500">
 <div className="p-1.5 rounded-lg bg-gray-50"><MapPin size={14} className="text-gray-400" /></div>
 <span className="truncate font-medium">{party.address || 'لا يوجد عنوان'}</span>
 </div>
 </div>

 <div className="bg-gray-50/80 p-5 rounded-2xl flex flex-col gap-3 border border-gray-100">
 <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-gray-500">الرصيد (دينار)</span>
 <span className={cn(
 "font-black text-lg",
 (party.current_balance_iqd || 0) > 0 ? "text-danger" : "text-success"
 )}>
 {formatCurrency(party.current_balance_iqd || 0, 'IQD')}
 </span>
 </div>
 <div className="w-full h-px bg-gray-200/50"></div>
 <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-gray-500">الرصيد (دولار)</span>
 <span className={cn(
 "font-black text-lg",
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
 <div className="rounded-2xl border border-gray-100 overflow-hidden">
 <DataTable 
 columns={columns} 
 data={filteredParties} 
 itemsPerPage={limit}
 onItemsPerPageChange={setLimit}
 />
 </div>
 )}
 </div>
 </div>

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

 <Modal isOpen={!!statementParty} onClose={() => setStatementParty(null)} title={`كشف حساب: ${statementParty?.name}`} size="xl">
 <div className="space-y-6">
 
 <div className="print:hidden flex bg-bg-main p-1 rounded-xl">
 <button 
 onClick={() => setStatementCurrency('IQD')}
 className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${statementCurrency === 'IQD' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:text-text-main'}`}
 >
 حساب الدينار العراقي (IQD)
 </button>
 <button 
 onClick={() => setStatementCurrency('USD')}
 className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${statementCurrency === 'USD' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:text-text-main'}`}
 >
 حساب الدولار الأمريكي (USD)
 </button>
 </div>

 <div className="print:hidden bg-bg-main p-4 rounded-2xl flex flex-wrap gap-4 items-end">
 <div className="flex-1 min-w-[200px]">
 <label className="block text-sm text-text-muted mb-1 font-bold">من تاريخ</label>
 <input type="date" value={statementFromDate} onChange={(e) => setStatementFromDate(e.target.value)} className="w-full bg-white border border-border rounded-xl px-4 py-2" />
 </div>
 <div className="flex-1 min-w-[200px]">
 <label className="block text-sm text-text-muted mb-1 font-bold">إلى تاريخ</label>
 <input type="date" value={statementToDate} onChange={(e) => setStatementToDate(e.target.value)} className="w-full bg-white border border-border rounded-xl px-4 py-2" />
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
 {statementCurrency === 'IQD' ? (
 <div>
 الرصيد الكلي: <span className={cn("font-bold", statementParty?.current_balance_iqd && statementParty.current_balance_iqd > 0 ? "text-danger" : "text-success")}>{formatCurrency(statementParty?.current_balance_iqd || 0, 'IQD')}</span>
 </div>
 ) : (
 <div>
 الرصيد الكلي: <span className={cn("font-bold", statementParty?.current_balance_usd && statementParty.current_balance_usd > 0 ? "text-danger" : "text-success")}>{formatCurrency(statementParty?.current_balance_usd || 0, 'USD')}</span>
 </div>
 )}
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
 ({
 opening_balance: 'رصيد افتتاحي',
 invoice: 'فاتورة',
 payment: 'دفعة/سداد',
 journal: 'سند قيد يومية',
 sale: 'فاتورة مبيعات',
 purchase: 'فاتورة مشتريات',
 return: 'فاتورة مرتجع'
 } as Record<string, string>)[tx.type] || tx.type
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


