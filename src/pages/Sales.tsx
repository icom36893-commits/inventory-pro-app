import React, { useState, useEffect } from 'react';
import { Plus, FileText, Printer, Ban, Trash2, Search, Edit, Receipt, User, Calendar, AlertTriangle, ArrowLeft, RefreshCcw, X } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import PrintTemplate from '../components/shared/PrintTemplate';
import ActionDropdown from '../components/shared/ActionDropdown';
import AdditionalExpensesModal from '../components/shared/AdditionalExpensesModal';
import { useToast } from '../context/ToastContext';
import { Invoice, Party, Product } from '../types';
import PartyForm from '../components/forms/PartyForm';
import ProductForm from '../components/forms/ProductForm';
import { CurrencyType, formatCurrency } from '../utils/currency';
import { useSettingsStore, useNotificationStore, useAuthStore } from '../store';
import { usePermissionsStore } from '../store/permissions';

const Sales: React.FC = () => {
 const [invoices, setInvoices] = useState<Invoice[]>([]);
 const [search, setSearch] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [limit, setLimit] = useState(10);
 const [totalInvoices, setTotalInvoices] = useState(0);
 const [invoiceType, setInvoiceType] = useState<'sale' | 'sale_return'>('sale');
 const [filterType, setFilterType] = useState('all');
 const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
 const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
 const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
 const toast = useToast();
 const { pendingAction, setPendingAction, settings } = useSettingsStore();
 const { notifyNewSale, addNotification } = useNotificationStore();
 const { user } = useAuthStore();
 const { hasPermission, showPermissionAlert } = usePermissionsStore();

 // Form State
 const [funds, setFunds] = useState<any[]>([]);
 const [fundId, setFundId] = useState("");
 const [customers, setCustomers] = useState<Party[]>([]);
 const [selectedCustomer, setSelectedCustomer] = useState('');
 const [customerSearch, setCustomerSearch] = useState('');
 const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [currency, setCurrency] = useState<CurrencyType>('IQD');
 const [status, setStatus] = useState<'draft' | 'confirmed' | 'cancelled'>('confirmed');
 const [items, setItems] = useState<any[]>([]);
 const [productSearch, setProductSearch] = useState('');
 const [searchResults, setSearchResults] = useState<Product[]>([]);
 const [notes, setNotes] = useState('');
 const [paymentMethod, setPaymentMethod] = useState<'cash' | 'partial' | 'credit'>('cash');
 const [paidAmount, setPaidAmount] = useState(0);
 const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
 const [isProductModalOpen, setIsProductModalOpen] = useState(false);
 const [additionalExpenses, setAdditionalExpenses] = useState<{ id?: number, party_name: string, date: string, amount: number, details: string }[]>([]);
 const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
 const [discountAmount, setDiscountAmount] = useState(0);
  const [priceWarning, setPriceWarning] = useState<{ isOpen: boolean, itemIndex: number, oldPrice: number, newPrice: number } | null>(null);

 const fetchInvoices = async (page = 1, currentLimit = limit) => {
 setIsLoading(true);
 try {
 const result = await (window as any).api.invoices.getAll({ 
 page, 
 limit: currentLimit,
 type: filterType === 'all' ? ['sale', 'sale_return'] : filterType,
 payment_method: paymentMethodFilter === 'all' ? undefined : paymentMethodFilter,
 search
 });
 setInvoices(result.data);
 setTotalInvoices(result.total);
 setCurrentPage(page);
 } catch (error) {
 console.error(error);
 } finally {
 setIsLoading(false);
 }
 };

 const fetchCustomers = async () => {
 const data = await (window as any).api.parties.getAll('customer');
 setCustomers(data);
 };

 const fetchFunds = async () => {
 const data = await (window as any).api.funds.getAll();
 setFunds(data);
 };

 useEffect(() => {
 fetchFunds();
 fetchCustomers();
 }, []);

 useEffect(() => {
 const delay = setTimeout(() => {
 fetchInvoices(1);
 }, 300);
 return () => clearTimeout(delay);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [filterType, paymentMethodFilter, search]);

 useEffect(() => {
 if (pendingAction === 'open_sales_modal') {
 setIsExpensesModalOpen(false);
 setDiscountAmount(0);
 setIsModalOpen(true);
 setPendingAction(null);
 }
 }, [pendingAction, setPendingAction]);

 const handleProductSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const query = e.target.value;
 setProductSearch(query);
 if (query.length > 1) {
 const results = await (window as any).api.products.search(query);
 setSearchResults(results);
 } else {
 setSearchResults([]);
 }
 };

 const addProductToInvoice = async (product: Product) => {
 let initialPrice = product.sale_price;
 if (selectedCustomer && invoiceType === 'sale') {
 try {
 const lastPrice = await (window as any).api.invoices.getLastPrice(product.id, parseInt(selectedCustomer), 'sale');
 if (lastPrice !== null && lastPrice !== undefined) {
 initialPrice = lastPrice;
 }
 } catch (e) { console.error('Failed to fetch last price:', e); }
 }

 const existing = items.find(i => i.product_id === product.id);
 const currentQty = existing ? existing.quantity : 0;
 const newQty = currentQty + 1;

 if (invoiceType === 'sale' && !product.allow_negative_stock && newQty > product.current_stock) {
 toast.warning(`لا يمكن إضافة المزيد! الرصيد المتوفر للصنف "${product.name}" هو ${product.current_stock}`);
 if (!existing) {
 setProductSearch('');
 setSearchResults([]);
 }
 return;
 }

 if (existing) {
 setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: newQty, total: newQty * i.unit_price } : i));
 } else {
 setItems([...items, { 
 product_id: product.id, 
 name: product.name, 
 quantity: 1, 
 unit_price: initialPrice, 
 discount: 0, 
 total: initialPrice,
 current_stock: product.current_stock,
 allow_negative_stock: product.allow_negative_stock,
 warehouse_name: (product as any).warehouse_name,
 is_initial: product.is_initial,
  original_price: product.sale_price,
  update_sale_price: false
 }]);
 }
 setProductSearch('');
 setSearchResults([]);
 };

 const updateItem = (index: number, field: string, value: number) => {
 const newItems = [...items];
 const item = newItems[index];
 
 if (field === 'quantity' && invoiceType === 'sale' && !item.allow_negative_stock && value > (item.current_stock || 0)) {
 toast.warning(`لا يمكن تجاوز الرصيد المتوفر (${item.current_stock}) للصنف "${item.name}"`);
 value = item.current_stock || 0;
 }

 item[field] = value;
 item.total = (item.quantity * item.unit_price) - item.discount;
 setItems(newItems);
 };

 const removeItem = (index: number) => {
 setItems(items.filter((_, i) => i !== index));
 };

 
  const checkPriceChange = (index: number) => {
    if (invoiceType !== 'sale') return;
    
    const currentItem = items[index];
    if (!currentItem || currentItem.original_price === undefined || currentItem.original_price === null) return;
    
    const uPrice = parseFloat(String(currentItem.unit_price)) || 0;
    const oPrice = parseFloat(String(currentItem.original_price)) || 0;
    
    if (uPrice !== oPrice) {
      setPriceWarning({ isOpen: true, itemIndex: index, oldPrice: oPrice, newPrice: uPrice });
    }
  };

  const confirmPriceWarning = (confirm: boolean) => {
    if (!priceWarning) return;
    const newItems = [...items];
    if (confirm) {
      newItems[priceWarning.itemIndex].update_sale_price = true;
      newItems[priceWarning.itemIndex].original_price = priceWarning.newPrice;
    } else {
      newItems[priceWarning.itemIndex].update_sale_price = false;
      newItems[priceWarning.itemIndex].original_price = priceWarning.newPrice;
    }
    setItems(newItems);
    setPriceWarning(null);
  };
const subtotal = items.reduce((sum, item) => sum + item.total, 0);
 const taxRate = settings?.enable_tax ? (settings?.tax_rate || 15) : 0;
 const taxAmount = (subtotal * taxRate) / 100;
 const expensesTotal = additionalExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
 const total = subtotal - discountAmount + taxAmount + expensesTotal;

 useEffect(() => {
 if (!funds.length) return;
 if (paymentMethod === 'cash') {
 const f = funds.find(x => x.is_system === 1 && x.name === 'عميل نقدي');
 if (f) setFundId(f.id.toString());
 } else {
 const f = funds.find(x => x.is_system === 1 && x.name === 'الصندوق الرئيسي');
 if (f) setFundId(f.id.toString());
 }
 }, [paymentMethod, funds]);

 // Sync paid amount based on payment method
 useEffect(() => {
 if (paymentMethod === 'cash') setPaidAmount(total);
 else if (paymentMethod === 'credit') setPaidAmount(0);
 }, [paymentMethod, total]);

 const remainingAmount = total - paidAmount;

 const handleSave = async () => {
 if (!selectedCustomer || items.length === 0) return toast.warning('الرجاء اختيار العميل وإضافة أصناف للفاتورة');

 try {
 const payload = {
 id: editingInvoiceId,
 invoice_number: `INV-${Date.now().toString().slice(-6)}`,
 type: invoiceType,
 party_id: parseInt(selectedCustomer),
 date,
 subtotal,
 discount_amount: discountAmount,
 discount_type: 'amount',
 tax_rate: taxRate,
 tax_amount: taxAmount,
 total,
 paid_amount: paidAmount,
 remaining_amount: remainingAmount,
 currency,
 payment_method: paymentMethod,
 fund_id: fundId ? parseInt(fundId) : undefined,
 status,
 notes,
 items,
 additional_expenses: additionalExpenses,
 created_by: 1
 };

 let result;
 if (editingInvoiceId) {
 result = await (window as any).api.invoices.update(payload);
 toast.success('تم تحديث الفاتورة بنجاح');
 } else {
 result = await (window as any).api.invoices.create(payload);
 toast.success('تم إنشاء الفاتورة بنجاح');
 if (notifyNewSale) {
 addNotification({
 text: `تم إنشاء فاتورة مبيعات جديدة بقيمة ${formatCurrency(total, currency as any)}`,
 time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
 type: 'sale',
 is_read: false
 });
 }
 }

 if (result?.warnings && result.warnings.length > 0) {
 setTimeout(() => {
 result.warnings.forEach((w: string) => toast.warning(w));
 }, 500); // slight delay to allow success toast to appear first
 }

 setIsModalOpen(false);
 setEditingInvoiceId(null);
 setSelectedCustomer('');
 setItems([]);
 setAdditionalExpenses([]);
 setPaidAmount(0);
 setNotes('');
 setDiscountAmount(0);
 setDate(new Date().toISOString().split('T')[0]);
 fetchInvoices(1);
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء حفظ الفاتورة');
 }
 };

 const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

 const handleView = async (id: number) => {
 try {
 const invoiceData = await (window as any).api.invoices.getOne(id);
 setViewInvoiceData(invoiceData);
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء عرض الفاتورة');
 }
 };

 const handlePrint = async (id: number) => {
 try {
 const invoiceData = await (window as any).api.invoices.getOne(id);
 setInvoiceToPrint(invoiceData);
 setTimeout(() => {
 window.print();
 }, 300);
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء استدعاء الفاتورة للطباعة');
 }
 };

 const handleEdit = async (id: number) => {
 try {
 const invoice = await (window as any).api.invoices.getOne(id);
 if (invoice) {
 setEditingInvoiceId(invoice.id);
 setInvoiceType(invoice.type);
 setSelectedCustomer(invoice.party_id?.toString() || '');
 setCustomerSearch(invoice.party_name || '');
 setCurrency(invoice.currency || 'IQD');
 setDate(invoice.date);
 setPaymentMethod(invoice.payment_method as 'cash' | 'partial' | 'credit' || 'cash');
 setPaidAmount(invoice.paid_amount || 0);
 setNotes(invoice.notes || '');
 setDiscountAmount(invoice.discount_amount || 0);
 setItems(invoice.items ? invoice.items.map((item: any) => ({ ...item, name: item.product_name || item.name, original_price: item.sale_price })) : []);
 setAdditionalExpenses(invoice.additional_expenses || []);
 setIsModalOpen(true);
 }
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء جلب تفاصيل الفاتورة');
 }
 };

 const handleCancelInvoice = (id: number) => {
 setConfirmAction({
 isOpen: true,
 title: 'إلغاء الفاتورة',
 message: 'هل أنت متأكد من إلغاء/حذف هذه الفاتورة؟ سيتم عكس جميع الحركات المرتبطة بها.',
 type: 'danger',
 onConfirm: async () => {
 try {
 await (window as any).api.invoices.delete(id);
 toast.success('تم إلغاء الفاتورة بنجاح وتم إرجاع كميات الأصناف إلى المخزون');
 fetchInvoices();
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء إلغاء الفاتورة');
 }
 }
 });
 };

 const columns = [
 { key: 'invoice_number', label: 'رقم الفاتورة' },
 { key: 'type', label: 'النوع', render: (val: string) => val === 'sale' ? <span className="text-success font-bold text-xs bg-success/10 px-2 py-1 rounded">مبيعات</span> : <span className="text-danger font-bold text-xs bg-danger/10 px-2 py-1 rounded">مردودات</span> },
 { key: 'date', label: 'التاريخ' },
 { key: 'party_name', label: 'العميل' },
 { key: 'total', label: 'الإجمالي', render: (val: number, item: any) => formatCurrency(val, item.currency || 'IQD') },
 { key: 'paid_amount', label: 'المسدد', render: (val: number, item: any) => <span className="text-success">{formatCurrency(val, item.currency || 'IQD')}</span> },
 { key: 'remaining_amount', label: 'المتبقي', render: (val: number, item: any) => <span className={val > 0 ? "text-danger font-bold" : "text-text-muted"}>{formatCurrency(val, item.currency || 'IQD')}</span> },
 { key: 'payment_method', label: 'طريقة الدفع', render: (val: string) => { const labels: any = { cash: 'نقداً', partial: 'جزئي', credit: 'آجل' }; return labels[val] || val; } },
 { key: 'actions', label: 'إجراءات', className: 'w-16', render: (_: any, item: any) => (
 <ActionDropdown actions={[
 { label: 'عرض التفاصيل', icon: <FileText size={16} />, onClick: () => handleView(item.id), variant: 'primary' },
 { label: 'طباعة الفاتورة', icon: <Printer size={16} />, onClick: () => handlePrint(item.id) },
 { label: 'تعديل', icon: <Edit size={16} />, onClick: () => {
 if (!hasPermission(user?.role || 'user', 'sales.edit')) { showPermissionAlert(); return; }
 handleEdit(item.id);
 }, variant: 'warning' },
 { label: 'إلغاء الفاتورة', icon: <Ban size={16} />, onClick: () => {
 if (!hasPermission(user?.role || 'user', 'sales.delete')) { showPermissionAlert(); return; }
 handleCancelInvoice(item.id);
 }, variant: 'danger' }
 ]} />
 )
 }
 ];

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Print Area - Only visible when printing */}
 {invoiceToPrint && (
 <div className="hidden print:block print-area-view absolute top-0 left-0 w-full bg-white z-50">
 <PrintTemplate invoice={invoiceToPrint} />
 </div>
 )}
 
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">فواتير المبيعات</h1>
 <p className="text-text-muted text-sm mt-1">إدارة مبيعات الشركة ومردودات المبيعات بشكل احترافي.</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => { 
 if (!hasPermission(user?.role || 'user', 'sales.create')) { showPermissionAlert(); return; }
 setSelectedCustomer('');
 setItems([]);
 setAdditionalExpenses([]);
 setPaidAmount(0);
 setNotes('');
 setDate(new Date().toISOString().split('T')[0]);
 setInvoiceType('sale'); 
 setIsModalOpen(true);
 }} 
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-primary to-indigo-500 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/30 font-bold"
 >
 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
 <span>فاتورة مبيعات جديدة</span>
 </button>
 <button 
 onClick={() => { 
 if (!hasPermission(user?.role || 'user', 'sales.return')) { showPermissionAlert(); return; }
 setEditingInvoiceId(null);
 setSelectedCustomer('');
 setItems([]);
 setAdditionalExpenses([]);
 setPaidAmount(0);
 setNotes('');
 setDate(new Date().toISOString().split('T')[0]);
 setInvoiceType('sale_return'); 
 setIsModalOpen(true);
 }} 
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-danger to-rose-400 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-danger/30 font-bold"
 >
 <Ban size={22} className="group-hover:-translate-y-1 transition-transform" />
 <span>فاتورة مردودات</span>
 </button>
 </div>
 </div>

 {/* Content Container (Elevated Card) */}
 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
 
 {/* Advanced Filters Control Panel */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="md:col-span-2">
 <SearchInput 
 value={search} 
 onChange={setSearch} 
 placeholder="بحث برقم الفاتورة أو اسم العميل..." 
 className="bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 h-12"
 />
 </div>
 <div className="flex gap-3">
 <div className="flex-1 relative">
 <select 
 value={paymentMethodFilter} 
 onChange={e => setPaymentMethodFilter(e.target.value)} 
 className="w-full bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
 >
 <option value="all">كل طرق الدفع</option>
 <option value="cash">نقداً</option>
 <option value="partial">جزئي</option>
 <option value="credit">آجل</option>
 </select>
 </div>
 <div className="flex-1 relative">
 <select 
 value={filterType} 
 onChange={e => setFilterType(e.target.value)} 
 className="w-full bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
 >
 <option value="all">كل الفواتير</option>
 <option value="sale">مبيعات فقط</option>
 <option value="sale_return">مردودات فقط</option>
 </select>
 </div>
 </div>
 </div>

 {/* Data Table Wrapper */}
 <div className="rounded-2xl overflow-hidden border border-gray-100">
 <DataTable 
 columns={columns} 
 data={invoices} 
 isLoading={isLoading}
 itemsPerPage={limit}
 totalItems={totalInvoices}
 currentPage={currentPage}
 onPageChange={(page) => fetchInvoices(page)}
 onItemsPerPageChange={(newLimit) => {
 setLimit(newLimit);
 setCurrentPage(1);
 fetchInvoices(1, newLimit);
 }}
 />
 </div>
 </div>

 <Modal isOpen={isModalOpen} onClose={() => {
 setIsModalOpen(false);
 setEditingInvoiceId(null);
 }} title={editingInvoiceId ? "تعديل الفاتورة" : (invoiceType === 'sale' ? "إنشاء فاتورة مبيعات" : "إنشاء فاتورة مردودات")} size="xl">
 <div className="space-y-8 animate-fade-in">
 {/* Top Information Card */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-sm font-bold text-gray-700">العميل</label>
 <button onClick={() => setIsPartyModalOpen(true)} className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm">
 <Plus size={14}/>
 <span>جديد</span>
 </button>
 </div>
 <div className="relative">
 <input 
 type="text" 
 value={customerSearch}
 onChange={e => {
 setCustomerSearch(e.target.value);
 setIsCustomerDropdownOpen(true);
 if (selectedCustomer && customers.find(c => c.id.toString() === selectedCustomer)?.name !== e.target.value) {
 setSelectedCustomer('');
 }
 }}
 onFocus={() => setIsCustomerDropdownOpen(true)}
 onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
 placeholder="بحث عن عميل..." 
 className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm"
 />
 {isCustomerDropdownOpen && (
 <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
 {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length > 0 ? (
 customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
 <div 
 key={c.id} 
 onClick={() => {
 setSelectedCustomer(c.id.toString());
 setCustomerSearch(c.name);
 setIsCustomerDropdownOpen(false);
 }} 
 className="p-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-0 transition-colors"
 >
 {c.name} {c.phone && <span className="text-gray-400 text-xs mx-2">({c.phone})</span>}
 </div>
 ))
 ) : (
 <div className="p-4 text-sm text-gray-400 text-center">لا يوجد عملاء بهذا الاسم</div>
 )}
 </div>
 )}
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">التاريخ</label>
 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">رقم الفاتورة</label>
 <input type="text" className="w-full bg-gray-100/50 border border-transparent rounded-2xl p-3 outline-none text-gray-500 font-bold" disabled placeholder="تلقائي عند الحفظ" />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">العملة</label>
 <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyType)} className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm cursor-pointer">
 <option value="IQD">دينار عراقي (IQD)</option>
 <option value="USD">دولار أمريكي (USD)</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">حالة الفاتورة</label>
 <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'confirmed' | 'cancelled')} className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm cursor-pointer">
 <option value="confirmed">منجزة</option>
 <option value="draft">معلقة</option>
 <option value="cancelled">تم الغاء</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">مبلغ الخصم الإجمالي</label>
 <input type="number" value={discountAmount} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} placeholder="0" className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm" />
 </div>
 </div>

 {/* Product Search & List */}
 <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
 <div className="flex justify-between items-center mb-4">
 <label className="text-lg font-black text-gray-800">الأصناف المطلوبة</label>
 <button onClick={() => setIsProductModalOpen(true)} className="flex items-center gap-1.5 bg-gradient-to-l from-primary to-indigo-500 text-white hover:scale-105 active:scale-95 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30">
 <Plus size={16}/>
 <span>صنف جديد للمخزون</span>
 </button>
 </div>
 
 <div className="relative mb-6 z-50">
 <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
 <Search size={20} className="text-gray-400" />
 </div>
 <input 
 type="text" 
 value={productSearch}
 onChange={handleProductSearch}
 placeholder="البحث عن صنف لإضافته (الاسم أو الكود)..." 
 className="w-full bg-gray-50 border-none rounded-2xl p-4 pr-12 outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner text-gray-700 font-medium"
 />
 {searchResults.length > 0 && (
 <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
 {searchResults.map(p => (
 <div key={p.id} onClick={() => addProductToInvoice(p)} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center group transition-colors">
 <div>
 <span className="font-bold text-gray-800 group-hover:text-primary transition-colors">{p.name}</span> 
 <span className="text-xs text-gray-400 mx-2">({p.code})</span>
 <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg font-bold shadow-sm">{(p as any).warehouse_name || 'بدون مخزن'}</span>
 {p.is_initial ? <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-lg mr-2 font-bold shadow-sm">رصيد أولي</span> : null}
 </div>
 <div className="text-primary font-black flex flex-col items-end">
 <span className="text-lg">{formatCurrency(p.sale_price || 0, (p.currency || 'IQD') as any)}</span>
 <span className="text-xs text-gray-500 font-normal">المخزون المتوفر: <span className="font-bold">{p.current_stock}</span></span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-52 overflow-y-auto shadow-inner bg-gray-50/30">
 <table className="w-full text-right">
 <thead className="bg-gray-100 sticky top-0 z-10">
 <tr>
 <th className="p-4 text-xs font-bold text-gray-500">الصنف</th>
 <th className="p-4 text-xs font-bold text-gray-500 w-24">المخزن</th>
 <th className="p-4 text-xs font-bold text-gray-500 w-28">الكمية</th>
 <th className="p-4 text-xs font-bold text-gray-500 w-32">السعر</th>
 <th className="p-4 text-xs font-bold text-gray-500 w-32">الإجمالي</th>
 <th className="p-4 text-xs font-bold text-gray-500 w-16 text-center">حذف</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {items.length === 0 ? (
 <tr><td colSpan={6} className="p-12 text-center text-gray-400 font-medium italic">لم يتم إضافة أي أصناف للفاتورة بعد</td></tr>
 ) : (
 items.map((item, idx) => (
 <tr key={idx} className="hover:bg-white transition-colors">
 <td className="p-4">
 <div className="font-bold text-gray-800">{item.name}</div>
 {item.is_initial ? <span className="block text-[10px] text-warning font-bold mt-1">رصيد أولي</span> : null}
 </td>
 <td className="p-4 text-xs text-gray-500 font-medium">{item.warehouse_name || '-'}</td>
 <td className="p-4"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)} className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" /></td>
 <td className="p-4"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} onBlur={() => checkPriceChange(idx)} className="w-full bg-white border border-gray-200 p-2 rounded-xl text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" /></td>
 <td className="p-4 font-black text-primary text-lg">{item.total.toFixed(2)}</td>
 <td className="p-4 text-center">
 <button onClick={() => removeItem(idx)} className="text-danger hover:bg-danger hover:text-white p-2 rounded-xl transition-colors shadow-sm">
 <Trash2 size={18} />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Totals & Payment Section */}
 <div className="flex flex-col lg:flex-row gap-6">
 <div className="w-full lg:w-2/3 space-y-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
 <div className="space-y-3">
 <label className="text-sm font-bold text-gray-700">طريقة الدفع</label>
 <div className="flex gap-4">
 <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors font-bold ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-primary/50'}`}>
 نقداً
 </button>
 <button type="button" onClick={() => setPaymentMethod('partial')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors font-bold ${paymentMethod === 'partial' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-primary/50'}`}>
 جزئي
 </button>
 <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors font-bold ${paymentMethod === 'credit' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-primary/50'}`}>
 آجل
 </button>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {paymentMethod === 'partial' && (
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">المبلغ المسدد</label>
 <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm font-bold text-primary" />
 </div>
 )}
 <div className={paymentMethod === 'partial' ? "space-y-2" : "space-y-2 md:col-span-2"}>
 <label className="text-sm font-bold text-gray-700">اختر الصندوق للايداع/الصرف</label>
 <select value={fundId} onChange={e => setFundId(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm cursor-pointer font-medium">
 <option value="">الرجاء اختيار الصندوق</option>
 {funds.map(f => (
 <option key={f.id} value={f.id}>{f.name} {f.is_system === 1 ? '(أساسي)' : ''}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700">ملاحظات على الفاتورة</label>
 <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أضف أي تفاصيل أخرى هنا..." className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all shadow-sm h-24 resize-none" />
 </div>
 </div>

 <div className="w-full lg:w-1/3 bg-gray-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
 {/* Decorative Background */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-10 -mt-10"></div>
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -ml-10 -mb-10"></div>
 
 <div className="relative z-10 space-y-4 font-medium">
 <div className="flex justify-between items-center text-gray-300">
 <span>المجموع الفرعي:</span>
 <span className="font-bold text-white text-lg">{formatCurrency(subtotal, currency)}</span>
 </div>
 {discountAmount > 0 && (
 <div className="flex justify-between items-center text-green-400">
 <span>مبلغ الخصم:</span>
 <span className="font-bold">-{formatCurrency(discountAmount, currency)}</span>
 </div>
 )}
 <div className="flex justify-between items-center text-rose-400">
 <span>إجمالي المصاريف:</span>
 <span className="font-bold">{formatCurrency(expensesTotal, currency)}</span>
 </div>
 
 <button type="button" onClick={() => {
 setIsExpensesModalOpen(true);
 }} className="w-full flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all font-bold text-sm ">
 <Plus size={16} /> إضافة مصاريف إضافية للفاتورة
 </button>
 </div>

 <div className="relative z-10 pt-6 mt-6 border-t border-gray-700/50 space-y-3">
 <div className="flex justify-between items-end">
 <span className="font-bold text-gray-300">الإجمالي النهائي:</span>
 <span className="font-black text-3xl text-primary-light">{formatCurrency(total, currency)}</span>
 </div>
 {paymentMethod !== 'cash' && (
 <div className="flex justify-between items-center text-rose-400 bg-rose-500/10 p-3 rounded-xl ">
 <span className="font-bold text-sm">المتبقي الآجل (دين):</span>
 <span className="font-bold text-lg">{formatCurrency(remainingAmount, currency)}</span>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
 <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 rounded-2xl text-gray-500 hover:bg-gray-100 font-bold transition-colors">إلغاء الأمر</button>
 <button onClick={handleSave} className="px-10 py-3.5 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-2xl hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-bold text-lg">حفظ الفاتورة وإصدارها</button>
 </div>
 </div>
 </Modal>

   {priceWarning && priceWarning.isOpen && (
  <Modal
  isOpen={true}
  onClose={() => confirmPriceWarning(false)}
  title="تنبيه: تحديث سعر البيع"
  size="md"
  >
  <div className="space-y-6 animate-fade-in p-2">
  
  {/* Header Section */}
  <div className="flex flex-col items-center justify-center text-center space-y-3">
    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-inner border border-blue-100">
      <AlertTriangle className="text-blue-500 w-10 h-10 animate-pulse" />
    </div>
    <h3 className="text-xl font-black text-gray-800">تغيير في سعر البيع</h3>
    <p className="text-sm text-gray-500 font-medium max-w-sm">
      لقد قمت بإدخال سعر بيع جديد يختلف عن السعر المسجل مسبقاً لهذا الصنف في قاعدة البيانات.
    </p>
  </div>

  {/* Comparison Cards */}
  <div className="grid grid-cols-2 gap-4 relative">
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 z-10">
      <ArrowLeft className="text-gray-400 w-4 h-4" />
    </div>
    
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
      <span className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">السعر السابق</span>
      <span className="text-2xl font-black text-gray-700 line-through decoration-danger/50 decoration-2">{formatCurrency(priceWarning.oldPrice, currency)}</span>
    </div>
    
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
      <span className="text-xs font-bold text-emerald-600/70 mb-2 uppercase tracking-wider">السعر الجديد</span>
      <span className="text-2xl font-black text-emerald-600">{formatCurrency(priceWarning.newPrice, currency)}</span>
    </div>
  </div>

  {/* Question & Actions */}
  <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 mt-4">
    <p className="text-sm font-bold text-gray-700 text-center mb-5">
      هل ترغب في اعتماد السعر الجديد وتحديث بطاقة الصنف؟
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <button 
        onClick={() => confirmPriceWarning(false)} 
        className="flex-1 px-4 py-3.5 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow"
      >
        <X size={18} className="text-gray-400" />
        لا، لهذه الفاتورة فقط
      </button>
      <button 
        onClick={() => confirmPriceWarning(true)} 
        className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold flex items-center justify-center gap-2"
      >
        <RefreshCcw size={18} />
        نعم، تحديث السعر
      </button>
    </div>
  </div>
  
  </div>
  </Modal>
  )}

  <PartyForm 
 isOpen={isPartyModalOpen}
 onClose={() => setIsPartyModalOpen(false)}
 type="customer"
 onSuccess={(party) => {
 fetchCustomers();
 setSelectedCustomer(party.id.toString());
 setCustomerSearch(party.name);
 }}
 />

 <Modal isOpen={!!viewInvoiceData} onClose={() => setViewInvoiceData(null)} title="عرض الفاتورة" size="xl">
 {viewInvoiceData && (
 <div className="relative border border-border rounded-xl overflow-hidden p-0 max-h-[70vh] overflow-y-auto">
 <div className="print-area-view scale-90 origin-top">
 <PrintTemplate invoice={viewInvoiceData} />
 </div>
 <div className="flex justify-end p-4 bg-bg-main border-t border-border sticky bottom-0">
 <button onClick={() => setViewInvoiceData(null)} className="px-6 py-2 rounded-xl bg-white border border-border hover:bg-bg-main text-text-muted font-bold transition-colors">إغلاق</button>
 <button onClick={() => { handlePrint(viewInvoiceData.id); setViewInvoiceData(null); }} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-bold mr-2 transition-colors flex items-center gap-2"><Printer size={18}/> طباعة</button>
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

 <ProductForm 
 isOpen={isProductModalOpen}
 onClose={() => setIsProductModalOpen(false)}
 onSuccess={(product) => {
 addProductToInvoice(product);
 setIsProductModalOpen(false);
 setProductSearch('');
 setSearchResults([]);
 }}
 />

 <AdditionalExpensesModal 
 isOpen={isExpensesModalOpen} 
 onClose={() => setIsExpensesModalOpen(false)} 
 additionalExpenses={additionalExpenses} 
 setAdditionalExpenses={setAdditionalExpenses} 
 defaultPartyName={customerSearch} 
 />
 </div>
 );
};

export default Sales;

