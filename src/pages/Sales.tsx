import React, { useState, useEffect } from 'react';
import { Plus, FileText, Printer, Ban, Trash2, Search, Edit } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import PrintTemplate from '../components/shared/PrintTemplate';
import ActionDropdown from '../components/shared/ActionDropdown';
import { useToast } from '../context/ToastContext';
import { Invoice, Party, Product } from '../types';
import PartyForm from '../components/forms/PartyForm';
import { CurrencyType, formatCurrency } from '../utils/currency';
import { useSettingsStore, useNotificationStore } from '../store';

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
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
  const toast = useToast();
  const { pendingAction, setPendingAction, settings } = useSettingsStore();
  const { notifyNewSale, addNotification } = useNotificationStore();

  // Form State
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

  const fetchInvoices = async (page = 1, currentLimit = limit) => {
    setIsLoading(true);
    try {
      const result = await (window as any).api.invoices.getAll({ 
        page, 
        limit: currentLimit,
        type: filterType === 'all' ? ['sale', 'sale_return'] : filterType,
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchInvoices(1);
    }, 300);
    return () => clearTimeout(delay);
  }, [filterType, search]);

  useEffect(() => {
    if (pendingAction === 'open_sales_modal') {
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

  const addProductToInvoice = (product: Product) => {
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
        unit_price: product.sale_price, 
        discount: 0, 
        total: product.sale_price,
        current_stock: product.current_stock,
        allow_negative_stock: product.allow_negative_stock
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = settings?.enable_tax ? (settings?.tax_rate || 15) : 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

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
        discount_amount: 0,
        discount_type: 'amount',
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        currency,
        payment_method: paymentMethod,
        status,
        notes,
        items,
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
      setPaidAmount(0);
      setNotes('');
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
        setPaymentMethod(invoice.payment_method || 'cash');
        setPaidAmount(invoice.paid_amount || 0);
        setNotes(invoice.notes || '');
        setItems(invoice.items || []);
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
          toast.success('تم إلغاء الفاتورة وعكس الحركات بنجاح');
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
          { label: 'تعديل', icon: <Edit size={16} />, onClick: () => handleEdit(item.id), variant: 'warning' },
          { label: 'إلغاء الفاتورة', icon: <Ban size={16} />, onClick: () => handleCancelInvoice(item.id), variant: 'danger' }
        ]} />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Print Area - Only visible when printing */}
      {invoiceToPrint && (
        <div className="hidden print:block print-area-view absolute top-0 left-0 w-full bg-white z-50">
          <PrintTemplate invoice={invoiceToPrint} />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">فواتير المبيعات</h1>
          <p className="text-text-muted text-sm">إدارة مبيعات الشركة ومردودات المبيعات.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { 
              setEditingInvoiceId(null);
              setSelectedCustomer('');
              setItems([]);
              setPaidAmount(0);
              setNotes('');
              setDate(new Date().toISOString().split('T')[0]);
              setInvoiceType('sale'); 
              setIsModalOpen(true); 
            }} 
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-light transition-all shadow-md font-bold"
          >
            <Plus size={20} />
            <span>فاتورة مبيعات جديدة</span>
          </button>
          <button 
            onClick={() => { 
              setEditingInvoiceId(null);
              setSelectedCustomer('');
              setItems([]);
              setPaidAmount(0);
              setNotes('');
              setDate(new Date().toISOString().split('T')[0]);
              setInvoiceType('sale_return'); 
              setIsModalOpen(true); 
            }} 
            className="flex items-center justify-center gap-2 bg-danger text-white px-4 py-2.5 rounded-xl hover:bg-danger/90 transition-all shadow-md"
          >
            <Ban size={20} />
            <span>مردودات مبيعات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو اسم العميل..." className="md:col-span-2" />
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">كل الفواتير</option>
            <option value="sale">مبيعات فقط</option>
            <option value="sale_return">مردودات فقط</option>
          </select>
        </div>
      </div>

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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingInvoiceId(null);
      }} title={editingInvoiceId ? "تعديل الفاتورة" : (invoiceType === 'sale' ? "إنشاء فاتورة مبيعات" : "إنشاء فاتورة مردودات")} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-text-muted">العميل</label>
                <button onClick={() => setIsPartyModalOpen(true)} className="text-primary text-xs font-bold hover:underline flex items-center"><Plus size={12}/> جديد</button>
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
                  className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                />
                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length > 0 ? (
                      customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setSelectedCustomer(c.id.toString());
                            setCustomerSearch(c.name);
                            setIsCustomerDropdownOpen(false);
                          }} 
                          className="p-2.5 hover:bg-bg-main cursor-pointer text-sm font-medium"
                        >
                          {c.name} {c.phone && <span className="text-text-muted text-xs mx-2">({c.phone})</span>}
                        </div>
                      ))
                    ) : (
                      <div className="p-2.5 text-sm text-text-muted text-center">لا يوجد عملاء بهذا الاسم</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">التاريخ</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">رقم الفاتورة</label>
              <input type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none" disabled placeholder="تلقائي عند الحفظ" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">العملة</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyType)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">حالة الفاتورة</label>
              <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'confirmed' | 'cancelled')} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="confirmed">منجزة</option>
                <option value="draft">معلقة</option>
                <option value="cancelled">تم الغاء</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search size={18} className="text-text-muted" />
            </div>
            <input 
              type="text" 
              value={productSearch}
              onChange={handleProductSearch}
              placeholder="البحث عن صنف لإضافته (الاسم أو الكود)..." 
              className="w-full bg-bg-main border border-border rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => addProductToInvoice(p)} className="p-3 hover:bg-bg-main cursor-pointer border-b border-border last:border-0 flex justify-between">
                    <div><span className="font-bold">{p.name}</span> <span className="text-xs text-text-muted">({p.code})</span></div>
                    <div className="text-primary font-bold">{formatCurrency(p.sale_price || 0, (p.currency || 'IQD') as any)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-right">
              <thead className="bg-bg-main sticky top-0">
                <tr>
                  <th className="p-3 text-xs font-bold text-text-muted">الصنف</th>
                  <th className="p-3 text-xs font-bold text-text-muted w-24">الكمية</th>
                  <th className="p-3 text-xs font-bold text-text-muted w-32">السعر</th>
                  <th className="p-3 text-xs font-bold text-text-muted w-32">الإجمالي</th>
                  <th className="p-3 text-xs font-bold text-text-muted w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-text-muted italic">لا توجد أصناف مضافة</td></tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-sm">{item.name}</td>
                      <td className="p-3"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)} className="w-full bg-bg-main p-1 rounded text-center" /></td>
                      <td className="p-3"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full bg-bg-main p-1 rounded text-center" /></td>
                      <td className="p-3 font-bold text-primary">{item.total.toFixed(2)}</td>
                      <td className="p-3"><button onClick={() => removeItem(idx)} className="text-danger hover:bg-danger/10 p-1 rounded"><Trash2 size={16} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start">
            <div className="w-1/2 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">طريقة الدفع</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> نقداً</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="payment" checked={paymentMethod === 'partial'} onChange={() => setPaymentMethod('partial')} /> جزئي</label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="payment" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} /> آجل</label>
                </div>
              </div>
              {paymentMethod === 'partial' && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-text-muted">المبلغ المسدد</label>
                  <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-bold text-text-muted">ملاحظات</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 h-20" />
              </div>
            </div>
            <div className="w-1/3 bg-bg-main p-4 rounded-2xl space-y-3">
              <div className="flex justify-between"><span className="text-text-muted">المجموع الفرعي:</span><span className="font-bold">{formatCurrency(subtotal, currency)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">الضريبة ({taxRate}%):</span><span className="font-bold">{formatCurrency(taxAmount, currency)}</span></div>
              <div className="flex justify-between text-lg pt-2 border-t border-border"><span className="font-bold">الإجمالي:</span><span className="font-bold text-primary">{formatCurrency(total, currency)}</span></div>
              {paymentMethod !== 'cash' && (
                <div className="flex justify-between text-danger pt-2 border-t border-border"><span className="font-bold">المتبقي الآجل:</span><span className="font-bold">{formatCurrency(remainingAmount, currency)}</span></div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
            <button onClick={handleSave} className="px-8 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-lg font-bold">حفظ الفاتورة</button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
};

export default Sales;
