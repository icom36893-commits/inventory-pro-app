import React, { useState, useEffect } from 'react';
import { Plus, Filter, Edit2, Trash2, Archive, Eye, Undo2, Printer, Building2, FileText, Package, Hash, Tag, DollarSign, Box, PackageMinus, Activity } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import PrintTemplate from '../components/shared/PrintTemplate';
import SearchInput from '../components/shared/SearchInput';
import { useToast } from '../context/ToastContext';
import { Product } from '../types';
import ProductForm from '../components/forms/ProductForm';
import ConfirmModal from '../components/ui/ConfirmModal';
import Modal from '../components/shared/Modal';
import { formatCurrency } from '../utils/currency';
import QRCode from 'react-qr-code';
import { useAuthStore } from '../store';
import { usePermissionsStore } from '../store/permissions';

const Inventory: React.FC = () => {
 const [products, setProducts] = useState<Product[]>([]);
 const [search, setSearch] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingProduct, setEditingProduct] = useState<Product | undefined>();
 const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
 const [currentPage, setCurrentPage] = useState(1);
 const [limit, setLimit] = useState(10);
 const [totalProducts, setTotalProducts] = useState(0);
 const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
 const [restoreProduct, setRestoreProduct] = useState<Product | null>(null);
 const [convertToInitialProduct, setConvertToInitialProduct] = useState<Product | null>(null);
 const [movementsProduct, setMovementsProduct] = useState<Product | null>(null);
 const [movements, setMovements] = useState<any[]>([]);
 const [isLoadingMovements, setIsLoadingMovements] = useState(false);
 const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
 const toast = useToast();
 const [activeTab, setActiveTab] = useState<'products' | 'initial_items' | 'warehouses'>('products');
 const { user } = useAuthStore();
 const { hasPermission, showPermissionAlert } = usePermissionsStore();

 // Basic Data State (needed for the warehouses tab)
 const [warehouses, setWarehouses] = useState<any[]>([]);
 const [categoryId, setCategoryId] = useState('');
 const [categories, setCategories] = useState<any[]>([]);

 // Warehouse Modal State
 const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
 const [newWarehouseName, setNewWarehouseName] = useState('');
 const [newWarehouseLocation, setNewWarehouseLocation] = useState('');

 const fetchProducts = async (page = 1, currentLimit = limit) => {
 setIsLoading(true);
 try {
 const result = await (window as any).api.products.getAll({ 
 page, 
 limit: currentLimit, 
 search, 
 category_id: categoryId,
 is_initial: activeTab === 'initial_items' ? 1 : 0
 });
 setProducts(result.data);
 setTotalProducts(result.total);
 setCurrentPage(page);
 } catch (error) {
 console.error(error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 const delay = setTimeout(() => {
 fetchProducts(1);
 }, 300);
 return () => clearTimeout(delay);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [search, categoryId, activeTab]);

 const fetchBasicData = async () => {
 try {
 const wrhs = await (window as any).api.basicData.getWarehouses();
 setWarehouses(wrhs);
 const cats = await (window as any).api.basicData.getCategories();
 setCategories(cats || []);
 } catch (error) {
 console.error(error);
 }
 };

 useEffect(() => {
 fetchBasicData();
 }, []);


 const handleEdit = (item: Product) => {
 setEditingProduct(item);
 setIsModalOpen(true);
 };

 const handleViewDetails = (item: Product) => {
 setViewingProduct(item);
 };

 const handleAddNew = () => {
 if (!hasPermission(user?.role || 'user', 'inventory.create')) {
 showPermissionAlert();
 return;
 }
 setEditingProduct(activeTab === 'initial_items' ? { is_initial: 1 } as any : undefined);
 setIsModalOpen(true);
 };

 const handleMoveToInitial = (item: Product) => {
    setConvertToInitialProduct(item);
  };

 const handleDelete = (id: number) => {
 setConfirmAction({
 isOpen: true,
 title: 'حذف الصنف',
 message: 'هل أنت متأكد من حذف هذا الصنف؟',
 type: 'danger',
 onConfirm: async () => {
 try {
 const result = await (window as any).api.products.delete(id);
 if (result.success) {
 toast.success('تم أرشفة الصنف بنجاح');
 fetchProducts();
 }
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء أرشفة الصنف');
 }
 }
 });
 };

 const handleCreateWarehouse = async () => {
 if (!newWarehouseName) return toast.warning('يرجى إدخال اسم المخزن');
 try {
 await (window as any).api.basicData.createWarehouse({ name: newWarehouseName, location: newWarehouseLocation });
 toast.success('تم إضافة المخزن بنجاح');
 setNewWarehouseName('');
 setNewWarehouseLocation('');
 setIsWarehouseModalOpen(false);
 fetchBasicData();
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء إضافة المخزن');
 }
 };

 const handleRestoreFromInitial = (item: Product) => {
 setRestoreProduct(item);
 };

 const handleViewMovements = async (item: Product) => {
   setMovementsProduct(item);
   setIsLoadingMovements(true);
   try {
     const data = await (window as any).api.products.getMovements(item.id);
     setMovements(data || []);
   } catch (error) {
     console.error(error);
     toast.error('حدث خطأ أثناء جلب حركات الصنف');
   } finally {
     setIsLoadingMovements(false);
   }
 };

 const handleViewInvoice = async (invoiceId: number) => {
   try {
     const result = await (window as any).api.invoices.getOne(invoiceId);
     if (result) {
       setViewInvoiceData(result);
     }
   } catch (error) {
     console.error(error);
     toast.error('حدث خطأ أثناء جلب الفاتورة');
   }
 };

 const baseColumns = [
 { key: 'code', label: 'كود الصنف' },
 { key: 'name', label: 'اسم الصنف' }
 ];

 const columns = activeTab === 'initial_items' ? [
 ...baseColumns,
 { 
 key: 'current_stock', 
 label: 'الكمية الأولية',
 render: (val: number, _item: any) => (
 <span className={val < 10 ? "text-danger font-bold" : ""}>
 {val.toLocaleString()} قطعة
 </span>
 )
 },
 { 
 key: 'warehouse_name', 
 label: 'المخزن',
 render: (_: any, item: any) => {
 const wh = warehouses.find(w => w.id === item.warehouse_id);
 return wh ? wh.name : '-';
 }
 },
 {
 key: 'actions',
 label: 'إجراءات',
 className: 'w-32',
 render: (_: any, item: any) => (
 <div className="flex space-x-2 space-x-reverse">
 <button onClick={() => handleViewMovements(item)} title="حركة الصنف" className="p-1.5 text-purple-600 hover:bg-purple-500/10 rounded-lg transition-colors">
 <Activity size={16} />
 </button>
 <button onClick={() => handleEdit(item)} title="تعديل" className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
 <Edit2 size={16} />
 </button>
 <button onClick={() => handleViewDetails(item)} title="عرض التفاصيل" className="p-1.5 text-info hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors">
 <Eye size={16} />
 </button>
 <button onClick={() => handleRestoreFromInitial(item)} title="استعادة إلى قائمة الأصناف" className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors">
 <Undo2 size={16} />
 </button>
 <button onClick={() => handleDelete(item.id)} title="حذف" className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors">
 <Trash2 size={16} />
 </button>
 </div>
 )
 }
 ] : [
 ...baseColumns,
 { key: 'category_name', label: 'التصنيف', render: (val: string) => val || '-' },
 { 
 key: 'purchase_price', 
 label: 'سعر الشراء',
 render: (val: number, item: any) => formatCurrency(val, item.currency || 'IQD')
 },
 { 
 key: 'sale_price', 
 label: 'سعر البيع',
 render: (val: number, item: any) => formatCurrency(val, item.currency || 'IQD')
 },
 { 
 key: 'current_stock', 
 label: 'الكمية الحالية',
 render: (val: number) => (
 <span className={val < 10 ? "text-danger font-bold" : ""}>
 {val.toLocaleString()} قطعة
 </span>
 )
 },
 {
 key: 'actions',
 label: 'إجراءات',
 className: 'w-32',
 render: (_: any, item: any) => (
 <div className="flex space-x-2 space-x-reverse">
 <button onClick={() => handleViewMovements(item)} title="حركة الصنف" className="p-1.5 text-purple-600 hover:bg-purple-500/10 rounded-lg transition-colors">
 <Activity size={16} />
 </button>
 <button onClick={() => handleEdit(item)} title="تعديل" className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
 <Edit2 size={16} />
 </button>
 <button onClick={() => handleViewDetails(item)} title="عرض التفاصيل" className="p-1.5 text-info hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors">
 <Eye size={16} />
 </button>
 <button onClick={() => handleMoveToInitial(item)} title="تحويل إلى صنف أولي" className="p-1.5 text-warning hover:bg-warning/10 rounded-lg transition-colors">
 <Archive size={16} />
 </button>
 <button onClick={() => handleDelete(item.id)} title="حذف" className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors">
 <Trash2 size={16} />
 </button>
 </div>
 )
 }
 ];

 const handlePrintBarcode = (item: Product) => {
 const qrContainer = document.getElementById('barcode-print-area');
 const qrSvg = qrContainer ? qrContainer.innerHTML : '';
 
 const printWindow = window.open('', '_blank', 'width=400,height=400');
 if (printWindow) {
 printWindow.document.write(`
 <html dir="rtl">
 <head>
 <title>طباعة باركود</title>
 <style>
 @media print {
 @page { margin: 0; }
 body { margin: 0.5cm; }
 }
 body { 
 font-family: system-ui, -apple-system, sans-serif; 
 display: flex; 
 flex-direction: column; 
 align-items: center; 
 justify-content: center;
 text-align: center;
 }
 .item-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; max-width: 150px; word-wrap: break-word; }
 .item-code { font-size: 12px; font-weight: bold; margin-top: 5px; letter-spacing: 1px; }
 svg { width: 100px !important; height: auto !important; max-width: 100px; }
 </style>
 </head>
 <body>
 <div class="item-name">${item.name}</div>
 ${qrSvg}
 <div class="item-code">${item.code}</div>
 <script>
 window.onload = () => {
 window.print();
 setTimeout(() => window.close(), 500);
 };
 </script>
 </body>
 </html>
 `);
 printWindow.document.close();
 }
 };

 return (
 <div className="space-y-8 animate-fade-in pb-10">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">إدارة المخزون</h1>
 <p className="text-text-muted text-sm mt-1">إدارة الأصناف، الأسعار، ومستويات المخزون بشكل احترافي.</p>
 </div>
 {activeTab !== 'warehouses' ? (
 <button 
 onClick={handleAddNew}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-primary to-indigo-500 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/30 font-bold active:scale-95"
 >
 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
 <span>{activeTab === 'initial_items' ? 'إضافة صنف أولي' : 'إضافة صنف جديد'}</span>
 </button>
 ) : (
 <button 
 onClick={() => setIsWarehouseModalOpen(true)}
 className="group flex items-center justify-center gap-2 bg-gradient-to-l from-primary to-indigo-500 text-white px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/30 font-bold active:scale-95"
 >
 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
 <span>إضافة مخزن</span>
 </button>
 )}
 </div>

 {/* Tabs - Segmented Control Style */}
 <div className="flex justify-center md:justify-start">
 <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto overflow-x-auto">
 <button 
 onClick={() => setActiveTab('products')}
 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
 >
 قائمة الأصناف
 </button>
 {hasPermission(user?.role || 'user', 'inventory.initial_items') && (
 <button 
 onClick={() => setActiveTab('initial_items')}
 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'initial_items' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
 >
 رصيد أولية
 </button>
 )}
 <button 
 onClick={() => setActiveTab('warehouses')}
 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'warehouses' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
 >
 المخازن
 </button>
 </div>
 </div>

 {/* Content Container (Elevated Card) */}
 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
 {activeTab === 'products' || activeTab === 'initial_items' ? (
 <>
 {/* Advanced Filters Control Panel */}
 <div className="flex flex-col md:flex-row gap-4 mb-6">
 <SearchInput 
 value={search} 
 onChange={setSearch} 
 placeholder="بحث بكود أو اسم الصنف..." 
 className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 h-12"
 />
 <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all min-w-[200px]">
 <Filter size={18} className="text-gray-400" />
 <select 
 value={categoryId} 
 onChange={e => setCategoryId(e.target.value)} 
 className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-700 cursor-pointer appearance-none"
 >
 <option value="">كل التصنيفات</option>
 {categories.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Data Table Wrapper */}
 <div className="rounded-2xl overflow-hidden border border-gray-100">
 <DataTable 
 columns={columns} 
 data={products} 
 isLoading={isLoading}
 itemsPerPage={limit}
 totalItems={totalProducts}
 currentPage={currentPage}
 onPageChange={(page) => fetchProducts(page)}
 onItemsPerPageChange={(newLimit) => {
 setLimit(newLimit);
 setCurrentPage(1);
 fetchProducts(1, newLimit);
 }}
 />
 </div>
 </>
 ) : (
 <div className="rounded-2xl border border-gray-100 overflow-hidden">
 <div className="bg-gray-50 p-4 border-b border-gray-100">
 <h3 className="font-bold text-gray-800">قائمة المخازن</h3>
 </div>
 {warehouses.length === 0 ? (
 <div className="p-8 text-center text-gray-400 italic">لا توجد مخازن مضافة.</div>
 ) : (
 <table className="w-full text-right">
 <thead className="bg-gray-50/50">
 <tr>
 <th className="p-4 text-xs font-bold text-gray-500">اسم المخزن</th>
 <th className="p-4 text-xs font-bold text-gray-500">الموقع</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {warehouses.map(w => (
 <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
 <td className="p-4 text-sm font-bold text-gray-800">{w.name}</td>
 <td className="p-4 text-sm text-gray-500">{w.location || '-'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}
 </div>

 <ProductForm 
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 onSuccess={() => {
 fetchProducts();
 fetchBasicData();
 }}
 initialData={editingProduct}
 />

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

 <Modal
 isOpen={!!viewingProduct}
 onClose={() => setViewingProduct(null)}
 title="تفاصيل الصنف"
 size="md"
 >
 {viewingProduct && (
 <div className="space-y-6 animate-fade-in">
 {/* Header / Hero Section */}
 <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 p-6 rounded-2xl border border-primary/20 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-10 -mt-10"></div>
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-10 -mb-10"></div>
 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 border border-primary/20 z-10">
 <Package className="text-primary" size={32} />
 </div>
 <h3 className="text-2xl font-black text-gray-800 mb-1 z-10">{viewingProduct.name}</h3>
 <div className="flex items-center gap-2 text-primary font-bold bg-white/60 px-4 py-1.5 rounded-full border border-primary/20 z-10">
 <Hash size={16} />
 <span>{viewingProduct.code}</span>
 </div>
 </div>

 {/* Details Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
 <Box size={24} />
 </div>
 <div>
 <p className="text-xs text-gray-500 font-bold mb-1">الكمية المتوفرة</p>
 <p className="font-black text-lg text-gray-800">{viewingProduct.current_stock?.toLocaleString()} <span className="text-sm text-gray-500 font-medium">وحدة</span></p>
 </div>
 </div>

 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
 <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
 <Building2 size={24} />
 </div>
 <div>
 <p className="text-xs text-gray-500 font-bold mb-1">المخزن</p>
 <p className="font-bold text-gray-800">{warehouses.find(w => w.id === viewingProduct.warehouse_id)?.name || '-'}</p>
 </div>
 </div>

 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
 <Tag size={24} />
 </div>
 <div>
 <p className="text-xs text-gray-500 font-bold mb-1">التصنيف</p>
 <p className="font-bold text-gray-800">{(viewingProduct as any).category_name || '-'}</p>
 </div>
 </div>

 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
 <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all">
 <DollarSign size={24} />
 </div>
 <div>
 <p className="text-xs text-gray-500 font-bold mb-1">سعر البيع</p>
 <p className="font-bold text-gray-800">{formatCurrency(viewingProduct.sale_price || 0, viewingProduct.currency)}</p>
 </div>
 </div>
 </div>
 
 {/* QR Code Section */}
 <div className="flex flex-col items-center justify-center p-6 bg-gray-50/50 border border-gray-100 rounded-2xl mx-2 shadow-inner mt-2">
 <p className="text-sm text-gray-500 mb-4 font-bold flex items-center gap-2">
 <Printer size={16} />
 باركود الصنف (QR)
 </p>
 <div id="barcode-print-area" className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200 transform hover:scale-105 transition-transform duration-300">
 <QRCode value={viewingProduct.code || 'UNKNOWN'} size={150} level="H" />
 </div>
 <p className="mt-4 text-sm font-black tracking-[0.2em] text-gray-600 bg-white px-4 py-1.5 rounded-lg border border-gray-200">{viewingProduct.code}</p>
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
 <button 
 onClick={() => setViewingProduct(null)}
 className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-bold w-full md:w-auto text-center"
 >
 إغلاق
 </button>
 <button 
 onClick={() => handlePrintBarcode(viewingProduct)}
 className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold flex items-center justify-center gap-2 w-full md:w-auto"
 >
 <Printer size={18} />
 طباعة الباركود
 </button>
 </div>
 </div>
 )}
 </Modal>

 <Modal
 isOpen={!!restoreProduct}
 onClose={() => setRestoreProduct(null)}
 title="تأكيد الاستعادة"
 size="md"
 >
 {restoreProduct && (
 <div className="space-y-4">
 <div className="bg-success/10 text-success p-4 rounded-xl flex items-start gap-3">
 <Undo2 className="mt-1 flex-shrink-0" />
 <div>
 <h4 className="font-bold mb-1">استعادة إلى قائمة الأصناف</h4>
 <p className="text-sm">سيتم إرجاع هذا الصنف إلى قائمة المنتجات الرئيسية. وسيقوم النظام بمحاولة استعادة آخر سعر شراء له من فواتير المشتريات السابقة إذا توفرت.</p>
 </div>
 </div>
 <div className="bg-bg-main p-4 rounded-xl border border-border">
 <div className="flex justify-between items-center mb-2">
 <span className="text-sm text-text-muted">اسم الصنف:</span>
 <span className="font-bold">{restoreProduct.name}</span>
 </div>
 <div className="flex justify-between items-center mb-2">
 <span className="text-sm text-text-muted">كود الصنف:</span>
 <span className="font-bold">{restoreProduct.code}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-text-muted">الكمية الحالية:</span>
 <span className="font-bold text-primary">{restoreProduct.current_stock?.toLocaleString()}</span>
 </div>
 </div>
 
 <div className="flex justify-end gap-2 pt-4">
 <button 
 onClick={() => setRestoreProduct(null)}
 className="px-4 py-2 text-text-muted hover:bg-bg-main rounded-xl transition-colors"
 >
 إلغاء
 </button>
 <button 
 onClick={async () => {
 try {
 const result = await (window as any).api.products.restoreFromInitial(restoreProduct.id);
 if (result.success) {
 if (result.restoredPrice > 0) {
 toast.success(`تم استعادة الصنف بنجاح بسعر شراء: ${result.restoredPrice}`);
 } else {
 toast.success('تم الاستعادة بنجاح (لم يعثر على فواتير سابقة للسعر)');
 }
 fetchProducts();
 setRestoreProduct(null);
 }
 } catch (error) {
 console.error(error);
 toast.error('حدث خطأ أثناء الاستعادة');
 }
 }}
 className="px-6 py-2 bg-success text-white rounded-xl hover:bg-success/90 transition-all shadow-md font-bold flex items-center gap-2"
 >
 <Undo2 size={18} />
 تأكيد الاستعادة
 </button>
 </div>
 </div>
 )}
 </Modal>

      {/* Convert To Initial Modal */}
      <Modal
        isOpen={!!convertToInitialProduct}
        onClose={() => setConvertToInitialProduct(null)}
        title="تحويل الصنف إلى مادة خام (صنف أولي)"
        size="md"
      >
        {convertToInitialProduct && (
          <div className="space-y-4">
            <div className="bg-warning/10 text-warning-dark p-4 rounded-xl flex items-start gap-3 border border-warning/20">
              <PackageMinus className="mt-1 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold mb-1 text-lg">تأكيد عملية التحويل</h4>
                <p className="text-sm">هل أنت متأكد من تحويل هذا الصنف إلى <strong>(صنف أولي / مادة خام)</strong>؟ سيتم تصفير أسعار الشراء والبيع الخاصة بالصنف. <strong>(لن تتأثر فواتيرك السابقة)</strong>.</p>
              </div>
            </div>
            
            <div className="bg-bg-main p-4 rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-muted">اسم الصنف:</span>
                <span className="font-bold">{convertToInitialProduct.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-muted">كود الصنف:</span>
                <span className="font-bold">{convertToInitialProduct.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">الكمية المتوفرة:</span>
                <span className="font-bold text-primary">{convertToInitialProduct.current_stock?.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setConvertToInitialProduct(null)}
                className="flex-1 py-3 px-4 bg-bg-main text-text-primary font-bold rounded-xl hover:bg-border transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  try {
                    await (window as any).api.products.update(convertToInitialProduct.id, { 
                      is_initial: 1,
                      purchase_price: 0,
                      sale_price: 0
                    });
                    toast.success('تم تحويل الصنف وتصفير الأسعار بنجاح');
                    fetchProducts();
                    setConvertToInitialProduct(null);
                  } catch (error) {
                    console.error(error);
                    toast.error('حدث خطأ أثناء التحويل');
                  }
                }}
                className="flex-1 py-3 px-4 bg-warning hover:bg-warning-hover text-white font-bold rounded-xl transition-all shadow-md shadow-warning/20 flex items-center justify-center gap-2"
              >
                <PackageMinus size={18} />
                تأكيد التحويل
              </button>
            </div>
          </div>
        )}
      </Modal>

 <Modal isOpen={isWarehouseModalOpen} onClose={() => setIsWarehouseModalOpen(false)} title="إضافة مخزن جديد">
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 <Building2 size={16} className="text-primary"/>
 اسم المخزن <span className="text-danger">*</span>
 </label>
 <input value={newWarehouseName} onChange={e => setNewWarehouseName(e.target.value)} type="text" placeholder="مثال: المخزن الرئيسي، فرع بغداد..." className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm text-lg font-bold" />
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
 <FileText size={16} className="text-primary"/>
 الموقع (اختياري)
 </label>
 <input value={newWarehouseLocation} onChange={e => setNewWarehouseLocation(e.target.value)} type="text" placeholder="اكتب العنوان أو موقع المخزن لتسهيل الوصول إليه..." className="w-full bg-gray-50/50 border border-gray-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 outline-none transition-all shadow-sm" />
 </div>

 <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
 <button onClick={() => setIsWarehouseModalOpen(false)} className="px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 font-bold transition-colors">إلغاء</button>
 <button onClick={handleCreateWarehouse} className="px-8 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl hover:shadow-lg hover:shadow-primary/30 transition-all font-bold flex items-center gap-2">
 <Plus size={20} />
 حفظ المخزن
 </button>
 </div>
 </div>
  </Modal>

  <Modal isOpen={!!movementsProduct} onClose={() => setMovementsProduct(null)} title="حركة الصنف" size="lg">
    {movementsProduct && (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg text-purple-900">{movementsProduct.name}</h4>
            <span className="text-sm text-purple-600 font-bold">{movementsProduct.code}</span>
          </div>
          <div className="text-left">
            <span className="text-xs text-purple-400 block font-bold">الرصيد الحالي</span>
            <span className="text-xl font-black text-purple-700">{movementsProduct.current_stock?.toLocaleString()}</span>
          </div>
        </div>

        {isLoadingMovements ? (
          <div className="py-10 text-center text-gray-500 font-bold">جاري تحميل حركات الصنف...</div>
        ) : movements.length === 0 ? (
          <div className="py-10 text-center text-gray-500 font-bold">لا توجد حركات لهذا الصنف.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-right">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-xs font-bold text-gray-500">نوع الفاتورة</th>
                  <th className="p-3 text-xs font-bold text-gray-500">التاريخ</th>
                  <th className="p-3 text-xs font-bold text-gray-500">الكمية</th>
                  <th className="p-3 text-xs font-bold text-gray-500 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      {mov.type === 'purchase' || mov.type === 'purchase_return' ? (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                          {mov.type === 'purchase' ? 'مشتريات' : 'مرتجع مشتريات'}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                          {mov.type === 'sale' ? 'مبيعات' : 'مرتجع مبيعات'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm font-bold text-gray-700">{new Date(mov.date).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 text-sm font-black text-gray-900">{mov.quantity}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleViewInvoice(mov.invoice_id)} 
                        className="text-primary hover:text-primary-dark font-bold text-sm bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        عرض فاتورة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </Modal>

  <Modal isOpen={!!viewInvoiceData} onClose={() => setViewInvoiceData(null)} title={`عرض الفاتورة #${viewInvoiceData?.invoice_number || ''}`} size="xl">
    {viewInvoiceData && (
      <div className="p-2 print:p-0">
        <PrintTemplate invoice={viewInvoiceData} title={viewInvoiceData.type === 'sale' ? 'فاتورة مبيعات' : viewInvoiceData.type === 'purchase' ? 'فاتورة مشتريات' : 'فاتورة مرتجع'} />
        <div className="mt-6 flex justify-end print:hidden border-t border-gray-100 pt-4">
          <button onClick={() => setViewInvoiceData(null)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
            إغلاق
          </button>
        </div>
      </div>
    )}
  </Modal>
  </div>
  );
};

export default Inventory;
