import React, { useState, useEffect } from 'react';
import { Plus, FileText, Printer, Ban, Search, Trash2, Edit } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import PrintTemplate from '../components/shared/PrintTemplate';
import ActionDropdown from '../components/shared/ActionDropdown';
import { useToast } from '../context/ToastContext';
import { Invoice, Party, Product } from '../types';
import PartyForm from '../components/forms/PartyForm';
import ProductForm from '../components/forms/ProductForm';
import { CurrencyType, formatCurrency } from '../utils/currency';
import { useSettingsStore, useNotificationStore } from '../store';

const Purchases: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [invoiceType, setInvoiceType] = useState<'purchase' | 'purchase_return'>('purchase');
  const [filterType, setFilterType] = useState('all');
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
  const toast = useToast();
  const { pendingAction, setPendingAction, settings } = useSettingsStore();
  const { notifyNewPurchase, addNotification } = useNotificationStore();

  // Form State
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<CurrencyType>('IQD');
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'partial' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [priceWarning, setPriceWarning] = useState<{ isOpen: boolean, itemIndex: number, oldPrice: number, newPrice: number } | null>(null);

  const fetchInvoices = async (page = 1, currentLimit = limit) => {
    setIsLoading(true);
    try {
      const result = await (window as any).api.invoices.getAll({ 
        page, 
        limit: currentLimit,
        type: filterType === 'all' ? ['purchase', 'purchase_return'] : filterType,
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

  const fetchSuppliers = async () => {
    try {
      const data = await (window as any).api.parties.getAll('supplier');
      setSuppliers(data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchInvoices(1);
    }, 300);
    return () => clearTimeout(delay);
  }, [filterType, search]);

  useEffect(() => {
    if (pendingAction === 'open_purchase_modal') {
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
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price } : i));
    } else {
      setItems([...items, { product_id: product.id, name: product.name, quantity: 1, unit_price: product.purchase_price, original_price: product.purchase_price, discount: 0, total: product.purchase_price }]);
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: string, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = (newItems[index].quantity * newItems[index].unit_price) - newItems[index].discount;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const checkPriceChange = (index: number) => {
    const currentItem = items[index];
    if (currentItem && currentItem.unit_price !== currentItem.original_price && currentItem.original_price !== undefined) {
      setPriceWarning({ isOpen: true, itemIndex: index, oldPrice: currentItem.original_price, newPrice: currentItem.unit_price });
    }
  };

  const confirmPriceWarning = (confirm: boolean) => {
    if (!priceWarning) return;
    const newItems = [...items];
    if (confirm) {
      newItems[priceWarning.itemIndex].original_price = priceWarning.newPrice;
    } else {
      const oldPrice = priceWarning.oldPrice;
      newItems[priceWarning.itemIndex].unit_price = oldPrice;
      newItems[priceWarning.itemIndex].total = (newItems[priceWarning.itemIndex].quantity * oldPrice) - newItems[priceWarning.itemIndex].discount;
    }
    setItems(newItems);
    setPriceWarning(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = settings?.enable_tax ? (settings?.tax_rate || 15) : 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  useEffect(() => {
    if (paymentMethod === 'cash') setPaidAmount(total);
    else if (paymentMethod === 'credit') setPaidAmount(0);
  }, [paymentMethod, total]);

  const remainingAmount = total - paidAmount;

  const handleSave = async () => {
    if (!selectedSupplier || items.length === 0) return toast.warning('الرجاء اختيار المورد وإضافة أصناف للفاتورة');

    try {
      const payload = {
        id: editingInvoiceId,
        invoice_number: `PUR-${Date.now().toString().slice(-6)}`,
        type: invoiceType,
        party_id: parseInt(selectedSupplier),
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
        status: 'confirmed',
        buyer_name: buyerName,
        notes,
        items,
        created_by: 1
      };

      if (editingInvoiceId) {
        await (window as any).api.invoices.update(payload);
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        await (window as any).api.invoices.create(payload);
        toast.success('تم إنشاء الفاتورة بنجاح');
        if (notifyNewPurchase) {
          addNotification({
            text: `تم إنشاء فاتورة مشتريات جديدة بقيمة ${formatCurrency(total, currency as any)}`,
            time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
            type: 'purchase',
            is_read: false
          });
        }
      }

      setIsModalOpen(false);
      setEditingInvoiceId(null);
      setSelectedSupplier('');
      setBuyerName('');
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
        setSelectedSupplier(invoice.party_id?.toString() || '');
        setBuyerName(invoice.buyer_name || '');
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
    { key: 'type', label: 'النوع', render: (val: string) => val === 'purchase' ? <span className="text-success font-bold text-xs bg-success/10 px-2 py-1 rounded">مشتريات</span> : <span className="text-danger font-bold text-xs bg-danger/10 px-2 py-1 rounded">مردودات</span> },
    { key: 'date', label: 'التاريخ' },
    { key: 'party_name', label: 'المورد' },
    { key: 'buyer_name', label: 'اسم المشتري', render: (val: string) => val ? val : <span className="text-gray-400">-</span> },
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
          <h1 className="text-2xl font-bold text-text-primary">فواتير المشتريات</h1>
          <p className="text-text-muted text-sm">إدارة مشتريات الشركة ومردودات المشتريات.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingInvoiceId(null);
              setSelectedSupplier('');
              setBuyerName('');
              setItems([]);
              setPaidAmount(0);
              setNotes('');
              setDate(new Date().toISOString().split('T')[0]);
              setInvoiceType('purchase'); 
              setIsModalOpen(true);
            }} 
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-light transition-all shadow-md font-bold"
          >
            <Plus size={20} />
            <span>فاتورة مشتريات</span>
          </button>
          <button 
            onClick={() => { 
              setEditingInvoiceId(null);
              setSelectedSupplier('');
              setBuyerName('');
              setItems([]);
              setPaidAmount(0);
              setNotes('');
              setDate(new Date().toISOString().split('T')[0]);
              setInvoiceType('purchase_return'); 
              setIsModalOpen(true); 
            }} 
            className="flex items-center justify-center gap-2 bg-danger text-white px-4 py-2.5 rounded-xl hover:bg-danger/90 transition-all shadow-md"
          >
            <Ban size={20} />
            <span>مردودات مشتريات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو اسم المورد..." className="md:col-span-2" />
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 bg-white border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">كل الفواتير</option>
            <option value="purchase">مشتريات فقط</option>
            <option value="purchase_return">مردودات فقط</option>
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
      }} title={editingInvoiceId ? "تعديل الفاتورة" : (invoiceType === 'purchase' ? "إنشاء فاتورة مشتريات" : "إنشاء فاتورة مردودات")} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-text-muted">المورد</label>
                <button onClick={() => setIsPartyModalOpen(true)} className="text-primary text-xs font-bold hover:underline flex items-center"><Plus size={12}/> جديد</button>
              </div>
              <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">اختر مورد...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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
              <label className="text-sm font-bold text-text-muted">اسم المشتري (اختياري)</label>
              <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="اسم المندوب أو المشتري..." className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-text-muted">البحث عن صنف</label>
              <button onClick={() => setIsProductModalOpen(true)} className="text-primary text-xs font-bold hover:underline flex items-center"><Plus size={12}/> صنف جديد للمخزون</button>
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
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => addProductToInvoice(p)} className="p-3 hover:bg-bg-main cursor-pointer border-b border-border last:border-0 flex justify-between">
                    <div><span className="font-bold">{p.name}</span> <span className="text-xs text-text-muted">({p.code})</span></div>
                    <div className="text-primary font-bold">{formatCurrency(p.purchase_price || 0, (p.currency || 'IQD') as any)}</div>
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
                      <td className="p-3"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} onBlur={() => checkPriceChange(idx)} className="w-full bg-bg-main p-1 rounded text-center outline-none focus:ring-1 focus:ring-primary" /></td>
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

      {priceWarning && priceWarning.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => confirmPriceWarning(false)}
          title="تنبيه: اختلاف سعر الشراء"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-text-primary text-lg">لقد قمت بإدخال سعر شراء جديد يختلف عن السعر السابق المسجل لهذا الصنف في النظام.</p>
            <div className="bg-bg-main p-4 rounded-xl flex justify-between">
              <div>
                <p className="text-sm text-text-muted">السعر السابق</p>
                <p className="font-bold text-danger">{priceWarning.oldPrice}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">السعر الجديد المكتوب</p>
                <p className="font-bold text-success">{priceWarning.newPrice}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-text-primary pt-2">هل تود المتابعة واعتماد السعر الجديد لهذه الفاتورة؟</p>
            <div className="flex gap-3 justify-end pt-4 border-t border-border mt-4">
              <button onClick={() => confirmPriceWarning(false)} className="px-6 py-2.5 bg-bg-main text-text-primary hover:bg-gray-200 rounded-xl transition-colors font-bold">لا، تراجع للسعر السابق</button>
              <button onClick={() => confirmPriceWarning(true)} className="px-6 py-2.5 bg-warning text-white hover:bg-warning/90 rounded-xl transition-colors font-bold">نعم، المتابعة بالسعر الجديد</button>
            </div>
          </div>
        </Modal>
      )}

      <PartyForm 
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        type="supplier"
        onSuccess={(party) => {
          fetchSuppliers();
          setSelectedSupplier(party.id.toString());
        }}
      />

      <ProductForm 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={(product) => {
          addProductToInvoice(product);
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

export default Purchases;
