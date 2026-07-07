import React, { useState, useEffect } from 'react';
import { Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../components/shared/DataTable';
import SearchInput from '../components/shared/SearchInput';
import { useToast } from '../context/ToastContext';
import { Product } from '../types';
import ProductForm from '../components/forms/ProductForm';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatCurrency } from '../utils/currency';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info' } | null>(null);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'warehouses'>('products');

  // Basic Data State (needed for the warehouses tab)
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const fetchProducts = async (page = 1, currentLimit = limit) => {
    setIsLoading(true);
    try {
      const result = await (window as any).api.products.getAll({ page, limit: currentLimit, search, category_id: categoryId });
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
  }, [search, categoryId]);

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

  const handleAddNew = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmAction({
      isOpen: true,
      title: 'حذف الصنف',
      message: 'هل أنت متأكد من حذف هذا الصنف؟',
      type: 'danger',
      onConfirm: async () => {
        try {
          await (window as any).api.products.delete(id);
          toast.success('تم الحذف بنجاح');
          fetchProducts();
        } catch (error) {
          console.error(error);
          toast.error('حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const columns = [
    { key: 'code', label: 'كود الصنف' },
    { key: 'name', label: 'اسم الصنف' },
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
      className: 'w-24',
      render: (_: any, item: any) => (
        <div className="flex space-x-2 space-x-reverse">
          <button onClick={() => handleEdit(item)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">إدارة المخزون</h1>
          <p className="text-text-muted text-sm">إدارة الأصناف، الأسعار، ومستويات المخزون.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-light transition-all shadow-md active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-2">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-2 px-4 font-bold ${activeTab === 'products' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-primary'}`}
        >
          قائمة الأصناف
        </button>
        <button 
          onClick={() => setActiveTab('warehouses')}
          className={`pb-2 px-4 font-bold ${activeTab === 'warehouses' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-primary'}`}
        >
          المخازن
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput 
              value={search} 
              onChange={setSearch} 
              placeholder="بحث بكود أو اسم الصنف..." 
              className="flex-1"
            />
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-text-muted transition-all">
              <Filter size={18} />
              <select 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)} 
                className="bg-transparent border-none outline-none text-text-primary"
              >
                <option value="">كل التصنيفات</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

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
        </>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-border">
          <h3 className="font-bold mb-4">قائمة المخازن</h3>
          {warehouses.length === 0 ? (
            <p className="text-text-muted">لا توجد مخازن مضافة.</p>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-bg-main">
                <tr><th className="p-4 text-xs font-bold text-text-muted">اسم المخزن</th><th className="p-4 text-xs font-bold text-text-muted">الموقع</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {warehouses.map(w => (
                  <tr key={w.id} className="hover:bg-bg-main/50">
                    <td className="p-4 text-sm font-medium">{w.name}</td>
                    <td className="p-4 text-sm">{w.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
    </div>
  );
};

export default Inventory;
