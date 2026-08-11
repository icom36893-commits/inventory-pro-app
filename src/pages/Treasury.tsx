import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Filter, Edit2, Trash2, Eye, Printer, Plus } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import TreasuryPrintTemplate from '../components/shared/TreasuryPrintTemplate';
import { useAuthStore } from '../store';
import { usePermissionsStore } from '../store/permissions';
import ActionDropdown from '../components/shared/ActionDropdown';
import { useToast } from '../context/ToastContext';
import { TreasuryTransaction, Fund, Party } from '../types';
import { cn } from '../utils/cn';
import { CurrencyType, formatCurrency } from '../utils/currency';
import ConfirmModal from '../components/ui/ConfirmModal';
import StatementsTab from '../components/treasury/StatementsTab';
import JournalsTab from '../components/treasury/JournalsTab';

const categoryTranslations: Record<string, string> = {
 customer_payment: 'دفعة من عميل',
 supplier_return: 'مرتجع مورد',
 customer_return: 'مرتجع عميل',
 supplier_payment: 'دفعة لمورد',
};

const translateCategory = (cat: string) => categoryTranslations[cat] || cat;

const Treasury: React.FC = () => {
 const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
 const [funds, setFunds] = useState<Fund[]>([]);
 const [balance, setBalance] = useState({ IQD: 0, USD: 0 });
 const [selectedFundBalance, setSelectedFundBalance] = useState({ IQD: 0, USD: 0 });
 const [isLoading, setIsLoading] = useState(true);
 
 // Transaction Modal State
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
 const [search, setSearch] = useState('');
 const [filterType, setFilterType] = useState('all');
 const [limit, setLimit] = useState(10);
 const [activeMainTab, setActiveMainTab] = useState<'transactions' | 'funds' | 'statements' | 'journals'>('transactions');
 
 // Fund Modal State
 const [isFundModalOpen, setIsFundModalOpen] = useState(false);
 const [editingFundId, setEditingFundId] = useState<number | null>(null);
 const [fundName, setFundName] = useState('');
 const [fundCategory, setFundCategory] = useState('');
 const [fundIqd, setFundIqd] = useState(0);
 const [fundUsd, setFundUsd] = useState(0);

 const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');
 const toast = useToast();
 
 const [parties, setParties] = useState<Party[]>([]);
 const { user } = useAuthStore();
 const { hasPermission, showPermissionAlert } = usePermissionsStore();
 const [treasuryCategories, setTreasuryCategories] = useState<any[]>([]);

 const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
 const [newCategoryName, setNewCategoryName] = useState('');

 const [fundCategories, setFundCategories] = useState<any[]>([]);
 const [isAddFundCategoryModalOpen, setIsAddFundCategoryModalOpen] = useState(false);
 const [newFundCategoryName, setNewFundCategoryName] = useState('');

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
 const [fundId, setFundId] = useState('');
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
 const cats = await (window as any).api.basicData.getTreasuryCategories();
 const fnds = await (window as any).api.funds.getAll();
 const fundCats = await (window as any).api.basicData.getFundCategories();
 setTransactions(txs);
 setBalance(bal);
 setParties(prts);
 setTreasuryCategories(cats || []);
 setFunds(fnds || []);
 setFundCategories(fundCats || []);
 } catch (error) {
 console.error(error);
 } finally {
 setIsLoading(false);
 }
 };

 const handleSaveFund = async () => {
 if (!fundName || !fundCategory) return toast.warning('الرجاء إدخال اسم الصندوق والتصنيف');
 try {
 if (editingFundId) {
 await (window as any).api.funds.update(editingFundId, {
 name: fundName, category: fundCategory, opening_balance_iqd: fundIqd, opening_balance_usd: fundUsd
 });
 toast.success('تم تحديث الصندوق بنجاح');
 } else {
 await (window as any).api.funds.create({
 name: fundName, category: fundCategory, opening_balance_iqd: fundIqd, opening_balance_usd: fundUsd
 });
 toast.success('تم إضافة الصندوق بنجاح');
 }
 setIsFundModalOpen(false);
 setEditingFundId(null);
 setFundName(''); setFundCategory(''); setFundIqd(0); setFundUsd(0);
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء الحفظ');
 }
 };

 const handleEditFund = (fund: Fund) => {
 setEditingFundId(fund.id);
 setFundName(fund.name);
 setFundCategory(fund.category);
 setFundIqd(fund.opening_balance_iqd);
 setFundUsd(fund.opening_balance_usd);
 setIsFundModalOpen(true);
 };

 const handleDeleteFund = (id: number) => {
 setConfirmAction({
 isOpen: true,
 title: 'حذف الصندوق',
 message: 'هل أنت متأكد من حذف هذا الصندوق؟',
 type: 'danger',
 onConfirm: async () => {
 try {
 await (window as any).api.funds.delete(id);
 toast.success('تم الحذف بنجاح');
 fetchData();
 } catch (error) {
 toast.error('حدث خطأ أثناء الحذف');
 }
 }
 });
 };

 useEffect(() => {
 const delay = setTimeout(() => {
 fetchData();
 }, 300);
 return () => clearTimeout(delay);
 }, [search, filterType]);

 useEffect(() => {
 if (isModalOpen) {
 const fetchFundBal = async () => {
 try {
 const bal = await (window as any).api.treasury.getBalance(fundId ? parseInt(fundId) : undefined);
 setSelectedFundBalance(bal);
 } catch(e) {}
 }
 fetchFundBal();
 }
 }, [fundId, isModalOpen]);

 useEffect(() => {
 if (category && treasuryCategories.length > 0) {
 const validForType = treasuryCategories.some(
 (cat: any) => cat.type === transactionType && cat.name === category
 );
 if (!validForType) {
 setCategory('');
 }
 }
 }, [transactionType, treasuryCategories]);

 const handleAddCategory = async () => {
 if (!newCategoryName.trim()) return toast.warning('الرجاء إدخال اسم التصنيف');
 try {
 await (window as any).api.basicData.createTreasuryCategory({
 name: newCategoryName,
 type: transactionType
 });
 toast.success('تمت إضافة التصنيف بنجاح');
 setIsAddCategoryModalOpen(false);
 setNewCategoryName('');
 const cats = await (window as any).api.basicData.getTreasuryCategories();
 setTreasuryCategories(cats || []);
 setCategory(newCategoryName);
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء إضافة التصنيف');
 }
 };

 const handleAddFundCategory = async () => {
 if (!newFundCategoryName.trim()) return toast.warning('الرجاء إدخال اسم التصنيف');
 try {
 await (window as any).api.basicData.createFundCategory({
 name: newFundCategoryName
 });
 toast.success('تمت إضافة التصنيف بنجاح');
 setIsAddFundCategoryModalOpen(false);
 setNewFundCategoryName('');
 const fundCats = await (window as any).api.basicData.getFundCategories();
 setFundCategories(fundCats || []);
 setFundCategory(newFundCategoryName);
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء إضافة التصنيف');
 }
 };

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
 fund_id: fundId || null,
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
 setFundId('');
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
 { 
 key: 'category', 
 label: 'التصنيف',
 render: (val: string) => translateCategory(val)
 },
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
 { label: 'تعديل', icon: <Edit2 size={16} />, onClick: () => {
 if (!hasPermission(user?.role || 'user', 'treasury.edit')) { showPermissionAlert(); return; }
 handleEdit(item);
 }, variant: 'warning' },
 { label: 'حذف', icon: <Trash2 size={16} />, onClick: () => {
 if (!hasPermission(user?.role || 'user', 'treasury.delete')) { showPermissionAlert(); return; }
 handleDelete(item.id);
 }, variant: 'danger' }
 ]} />
 )
 }
 ];

 const fundColumns = [
 { key: 'name', label: 'اسم الصندوق' },
 { key: 'category', label: 'التصنيف' },
 { 
 key: 'opening_balance_iqd', 
 label: 'رصيد افتتاحي (دينار)',
 render: (val: number) => formatCurrency(val, 'IQD')
 },
 { 
 key: 'opening_balance_usd', 
 label: 'رصيد افتتاحي (دولار)',
 render: (val: number) => formatCurrency(val, 'USD')
 },
 {
 key: 'actions',
 label: 'إجراءات',
 className: 'w-16',
 render: (_: any, item: any) => (
 <ActionDropdown actions={[
 { label: 'تعديل', icon: <Edit2 size={16} />, onClick: () => handleEditFund(item), variant: 'warning' },
 ...(item.is_system === 1 ? [] : [
 { label: 'حذف', icon: <Trash2 size={16} />, onClick: () => handleDeleteFund(item.id), variant: 'danger' as any }
 ])
 ]} />
 )
 }
 ];

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">إدارة الخزينة</h1>
 <p className="text-text-muted text-sm mt-1">متابعة التدفقات النقدية، المصروفات، والإيرادات بشكل مباشر.</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => { 
 if (!hasPermission(user?.role || 'user', 'treasury.receipt')) { showPermissionAlert(); return; }
 setEditingTransactionId(null);
 setAmount(0); setCategory(''); setDescription(''); setPartyId(''); setFundId(''); setPartySearch('');
 setTransactionType('income'); setIsModalOpen(true); 
 }}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-success to-emerald-400 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-success/30 font-bold"
 >
 <ArrowUpCircle size={22} className="group-hover:-translate-y-1 transition-transform" />
 <span>إضافة إيراد</span>
 </button>
 <button 
 onClick={() => { 
 if (!hasPermission(user?.role || 'user', 'treasury.payment')) { showPermissionAlert(); return; }
 setEditingTransactionId(null);
 setAmount(0); setCategory(''); setDescription(''); setPartyId(''); setFundId(''); setPartySearch('');
 setTransactionType('expense'); setIsModalOpen(true); 
 }}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-danger to-rose-400 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-danger/30 font-bold"
 >
 <ArrowDownCircle size={22} className="group-hover:translate-y-1 transition-transform" />
 <span>إضافة مصروف</span>
 </button>
 </div>
 </div>

 {/* Premium Balance Card (Credit Card Style) */}
 <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-10 shadow-2xl bg-gradient-to-br from-gray-900 via-primary to-gray-800 text-white border border-white/10 group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
 <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full translate-y-1/3 -translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>
 
 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
 <div className="flex-1 space-y-6">
 <div className="flex items-center gap-3 opacity-80">
 <Landmark size={24} />
 <span className="font-medium tracking-wide">الرصيد الإجمالي المتوفر</span>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-1">
 <p className="text-white/60 text-sm font-medium">بالدينار العراقي (IQD)</p>
 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums">
 {formatCurrency(balance.IQD || 0, 'IQD')}
 </h2>
 </div>
 
 <div className="space-y-1 relative before:content-[''] before:absolute before:-right-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10 hidden md:block"></div>
 
 <div className="space-y-1 md:pr-4">
 <p className="text-white/60 text-sm font-medium">بالدولار الأمريكي (USD)</p>
 <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums text-emerald-400">
 {formatCurrency(balance.USD || 0, 'USD')}
 </h2>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Modern Segmented Control Tabs */}
 <div className="flex justify-center md:justify-start">
 <div className="inline-flex p-1.5 bg-gray-100/80 rounded-2xl gap-1">
  {[
  { id: 'transactions', label: 'حركة الخزينة', perm: 'treasury.view' },
  { id: 'funds', label: 'إدارة الصناديق', perm: 'treasury.funds' },
  { id: 'statements', label: 'كشف الحساب', perm: 'treasury.statement' },
  { id: 'journals', label: 'القيود اليومية', perm: 'treasury.journals' }
  ].filter(tab => hasPermission(user?.role || 'user', tab.perm)).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveMainTab(tab.id as any)}
 className={cn(
 "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
 activeMainTab === tab.id 
 ? "bg-white text-primary shadow-sm scale-100" 
 : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95 hover:scale-100"
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* Content Container (Elevated Card) */}
 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 min-h-[600px]">
 {activeMainTab === 'transactions' ? (
 <div className="space-y-6 animate-fade-in">
 <div className="flex flex-col md:flex-row gap-4">
 <SearchInput 
 value={search} 
 onChange={setSearch} 
 placeholder="بحث في التصنيف، الوصف، أو الطرف الثاني..." 
 className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-primary/20"
 />
 <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-text-muted transition-all focus-within:ring-2 focus-within:ring-primary/20">
 <Filter size={18} className="text-gray-400" />
 <select 
 value={filterType} 
 onChange={e => setFilterType(e.target.value)} 
 className="bg-transparent border-none outline-none text-text-primary font-medium w-full cursor-pointer"
 >
 <option value="all">كل الحركات</option>
 <option value="income">إيرادات فقط</option>
 <option value="expense">مصروفات فقط</option>
 </select>
 </div>
 </div>

 <div className="rounded-2xl overflow-hidden border border-gray-100">
 <DataTable 
 columns={columns} 
 data={transactions} 
 isLoading={isLoading}
 itemsPerPage={limit}
 onItemsPerPageChange={setLimit}
 />
 </div>
 </div>
 ) : activeMainTab === 'funds' ? (
 <div className="space-y-6 animate-fade-in">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-extrabold text-gray-800">قائمة الصناديق</h2>
 <button
 onClick={() => {
 setEditingFundId(null);
 setFundName(''); setFundCategory(''); setFundIqd(0); setFundUsd(0);
 setIsFundModalOpen(true);
 }}
 className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-md font-bold"
 >
 <Plus size={20} />
 <span>إضافة صندوق جديد</span>
 </button>
 </div>
 <div className="rounded-2xl overflow-hidden border border-gray-100">
 <DataTable 
 columns={fundColumns} 
 data={funds} 
 isLoading={isLoading}
 itemsPerPage={limit}
 onItemsPerPageChange={setLimit}
 />
 </div>
 </div>
 ) : activeMainTab === 'journals' ? (
 <div className="h-full animate-fade-in">
 <JournalsTab parties={parties} funds={funds} onSuccess={fetchData} />
 </div>
 ) : (
 <div className="h-full animate-fade-in">
 <StatementsTab parties={parties} funds={funds} />
 </div>
 )}
 </div>

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
 <div className="space-y-6 animate-fade-in p-2">
 {/* Amount and Currency Section */}
 <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
 <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${transactionType === 'income' ? 'from-green-400 to-emerald-600' : 'from-red-400 to-rose-600'} rounded-r-2xl`}></div>
 <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
 بيانات المبلغ
 </h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">المبلغ <span className="text-danger">*</span></label>
 <input value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value))} type="number" placeholder="0.00" className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:border-transparent font-black text-xl transition-all shadow-inner ${transactionType === 'income' ? 'focus:ring-success/30 text-success' : 'focus:ring-danger/30 text-danger'}`} />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">العملة</label>
 <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyType)} className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:border-transparent font-bold text-gray-700 transition-all cursor-pointer ${transactionType === 'income' ? 'focus:ring-success/30' : 'focus:ring-danger/30'}`}>
 <option value="IQD">دينار عراقي (IQD)</option>
 <option value="USD">دولار أمريكي (USD)</option>
 </select>
 </div>
 </div>
 </div>

 {/* Fund Balances Banner */}
 <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-900 rounded-2xl border border-gray-800 text-white shadow-lg relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-800 to-transparent opacity-50"></div>
 <div className="relative z-10 flex-1 border-b sm:border-b-0 sm:border-l border-gray-700 pb-3 sm:pb-0 sm:pl-4">
 <p className="text-xs text-gray-400 font-bold mb-1">الرصيد المتوفر بالدينار العراقي</p>
 <p className="font-black text-xl text-green-400 drop-shadow-sm">{formatCurrency(selectedFundBalance.IQD, 'IQD')}</p>
 </div>
 <div className="relative z-10 flex-1 pt-1 sm:pt-0">
 <p className="text-xs text-gray-400 font-bold mb-1">الرصيد المتوفر بالدولار الأمريكي</p>
 <p className="font-black text-xl text-blue-400 drop-shadow-sm">{formatCurrency(selectedFundBalance.USD, 'USD')}</p>
 </div>
 </div>

 {/* Details Section */}
 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">الصندوق</label>
 <select value={fundId} onChange={e => setFundId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium text-gray-700 transition-all shadow-sm cursor-pointer">
 <option value="">الصندوق الرئيسي (افتراضي)</option>
 {funds.map(f => (
 <option key={f.id} value={f.id}>{f.name}</option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">تاريخ الحركة <span className="text-danger">*</span></label>
 <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium text-gray-700 transition-all shadow-sm cursor-pointer" />
 </div>
 </div>
 
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-gray-700">التصنيف المحاسبي</label>
 <button 
 type="button"
 onClick={() => setIsAddCategoryModalOpen(true)} 
 className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
 >
 <Plus size={12} /> إضافة جديد
 </button>
 </div>
 <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium text-gray-700 transition-all shadow-sm cursor-pointer">
 <option value="">اختر تصنيف...</option>
 {treasuryCategories
 .filter((cat: any) => cat.type === transactionType)
 .map((cat: any) => (
 <option key={cat.id} value={cat.name}>{cat.name}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2 relative z-50">
 <label className="text-sm font-bold text-gray-700">ارتباط بطرف ثاني (عميل أو مورد)</label>
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
 placeholder="ابحث عن اسم العميل أو المورد (اختياري)..." 
 className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium text-gray-700 transition-all shadow-sm"
 />
 {isPartyDropdownOpen && (
 <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[60] py-1">
 {parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).length > 0 ? (
 parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).map(p => (
 <div 
 key={p.id} 
 onClick={() => {
 setPartyId(p.id.toString());
 setPartySearch(p.name);
 setIsPartyDropdownOpen(false);
 }} 
 className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-bold text-gray-800 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
 >
 <div className="flex items-center gap-2">
 <span>{p.name}</span>
 {p.phone && <span className="text-gray-400 text-xs dir-ltr">{p.phone}</span>}
 </div>
 <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.type === 'customer' ? 'bg-primary/10 text-primary' : 'bg-indigo-50 text-indigo-600'}`}>
 {p.type === 'customer' ? 'عميل' : 'مورد'}
 </span>
 </div>
 ))
 ) : (
 <div className="p-4 text-sm text-gray-400 font-medium text-center">لا توجد نتائج تطابق بحثك</div>
 )}
 </div>
 )}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">الوصف التفصيلي (البيان)</label>
 <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="اكتب تفاصيل أو سبب الحركة المالية هنا..." className="w-full bg-white border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium text-gray-700 transition-all shadow-sm h-24 resize-none" />
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
 <button 
 onClick={() => setIsModalOpen(false)}
 className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors font-bold"
 >
 إلغاء الأمر
 </button>
 <button onClick={handleSave} className={cn(
 "px-8 py-3 text-white rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-bold text-lg",
 transactionType === 'income' 
 ? "bg-gradient-to-r from-success to-emerald-500 shadow-success/30" 
 : "bg-gradient-to-r from-danger to-rose-500 shadow-danger/30"
 )}>
 {editingTransactionId ? 'تحديث العملية' : 'تأكيد وحفظ العملية'}
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
 <span className="font-bold">{translateCategory(viewTransaction.category)}</span>
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

 <Modal 
 isOpen={isAddCategoryModalOpen} 
 onClose={() => setIsAddCategoryModalOpen(false)} 
 title="إضافة تصنيف جديد"
 size="sm"
 >
 <div className="space-y-4">
 <div className="space-y-1">
 <label className="text-sm font-bold text-text-muted">اسم التصنيف</label>
 <input 
 value={newCategoryName} 
 onChange={e => setNewCategoryName(e.target.value)} 
 type="text" 
 className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" 
 placeholder="مثال: رواتب، مبيعات..."
 />
 </div>
 <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
 <button 
 onClick={() => setIsAddCategoryModalOpen(false)}
 className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors"
 >
 إلغاء
 </button>
 <button 
 onClick={handleAddCategory} 
 className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold"
 >
 حفظ التصنيف
 </button>
 </div>
 </div>
 </Modal>

 <Modal 
 isOpen={isFundModalOpen} 
 onClose={() => setIsFundModalOpen(false)} 
 title={editingFundId ? "تعديل بيانات الصندوق" : "إضافة صندوق جديد"}
 size="md"
 >
 <div className="space-y-6 animate-fade-in p-2">
 <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
 <h4 className="text-sm font-black text-primary flex items-center gap-2 mb-2">
 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
 معلومات الصندوق
 </h4>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">اسم الصندوق <span className="text-danger">*</span></label>
 <input 
 value={fundName} 
 onChange={e => setFundName(e.target.value)} 
 type="text" 
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-bold" 
 placeholder="مثال: الصندوق الرئيسي، صندوق المبيعات، حساب البنك..."
 />
 </div>
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-gray-700">تصنيف الصندوق الدليلي <span className="text-danger">*</span></label>
 <button 
 type="button"
 onClick={() => setIsAddFundCategoryModalOpen(true)} 
 className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
 >
 <Plus size={12} /> إضافة جديد
 </button>
 </div>
 <select 
 value={fundCategory} 
 onChange={e => setFundCategory(e.target.value)} 
 className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-bold text-gray-700 cursor-pointer"
 >
 <option value="">اختر تصنيف...</option>
 {fundCategories.map((cat: any) => (
 <option key={cat.id} value={cat.name}>{cat.name}</option>
 ))}
 </select>
 </div>
 </div>
 
 <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-primary rounded-r-2xl"></div>
 <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-2">
 الرصيد الافتتاحي
 </h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">رصيد بالدينار (IQD)</label>
 <div className="relative">
 <input 
 value={fundIqd || ''} 
 onChange={e => setFundIqd(parseFloat(e.target.value))} 
 type="number" 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner font-bold text-gray-800" 
 placeholder="0"
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">IQD</span>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">رصيد بالدولار (USD)</label>
 <div className="relative">
 <input 
 value={fundUsd || ''} 
 onChange={e => setFundUsd(parseFloat(e.target.value))} 
 type="number" 
 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner font-bold text-gray-800" 
 placeholder="0.00"
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">USD</span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
 <button 
 onClick={() => setIsFundModalOpen(false)}
 className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors font-bold"
 >
 إلغاء الأمر
 </button>
 <button 
 onClick={handleSaveFund} 
 className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg"
 >
 {editingFundId ? 'حفظ التعديلات' : 'تأكيد إضافة الصندوق'}
 </button>
 </div>
 </div>
 </Modal>

 <Modal 
 isOpen={isAddFundCategoryModalOpen} 
 onClose={() => setIsAddFundCategoryModalOpen(false)} 
 title="إضافة تصنيف جديد"
 size="sm"
 >
 <div className="space-y-4 p-2">
 <div className="space-y-1">
 <label className="text-sm font-bold text-text-muted">اسم التصنيف</label>
 <input 
 value={newFundCategoryName} 
 onChange={e => setNewFundCategoryName(e.target.value)} 
 type="text" 
 className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" 
 placeholder="مثال: ايرادات خارجية، مصاريف..."
 />
 </div>
 <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
 <button 
 onClick={() => setIsAddFundCategoryModalOpen(false)}
 className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors font-bold"
 >
 إلغاء
 </button>
 <button 
 onClick={handleAddFundCategory} 
 className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold"
 >
 حفظ التصنيف
 </button>
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

export default Treasury;
