import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../shared/Modal';
import { useToast } from '../../context/ToastContext';
import { productSchema } from '../../utils/validations';
import { z } from 'zod';
import { CategoryForm, UnitForm } from './BasicDataForms';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
  initialData?: any;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    purchase_price: 0,
    sale_price: 0,
    currency: '',
    opening_stock: 0,
    category_id: '',
    unit_id: '',
    warehouse_id: '',
    allow_negative_stock: false
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const toast = useToast();

  const fetchBasicData = async () => {
    try {
      const cats = await (window as any).api.basicData.getCategories();
      const unts = await (window as any).api.basicData.getUnits();
      const wrhs = await (window as any).api.basicData.getWarehouses();
      setCategories(cats);
      setUnits(unts);
      setWarehouses(wrhs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBasicData();
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          code: initialData.code || '',
          purchase_price: initialData.purchase_price || 0,
          sale_price: initialData.sale_price || 0,
          currency: initialData.currency || '',
          opening_stock: initialData.opening_stock || 0,
          category_id: initialData.category_id || '',
          unit_id: initialData.unit_id || '',
          warehouse_id: initialData.warehouse_id || '',
          allow_negative_stock: !!initialData.allow_negative_stock
        });
      } else {
        setFormData({
          name: '',
          code: `PRD-${Date.now().toString().slice(-6)}`,
          purchase_price: 0,
          sale_price: 0,
          currency: '',
          opening_stock: 0,
          category_id: '',
          unit_id: '',
          warehouse_id: '',
          allow_negative_stock: false
        });
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    try {
      const validatedData = productSchema.parse(formData);
      const dataToSave = {
        ...validatedData,
        code: validatedData.code || `PRD-${Date.now().toString().slice(-6)}`,
        category_id: validatedData.category_id ? parseInt(validatedData.category_id as string) : null,
        unit_id: validatedData.unit_id ? parseInt(validatedData.unit_id as string) : null,
        warehouse_id: validatedData.warehouse_id ? parseInt(validatedData.warehouse_id as string) : null,
      };

      let result;
      if (initialData?.id) {
        await (window as any).api.products.update(initialData.id, dataToSave);
        result = { ...dataToSave, id: initialData.id };
        toast.success('تم تحديث الصنف بنجاح');
      } else {
        const id = await (window as any).api.products.create(dataToSave);
        result = { ...dataToSave, id };
        toast.success('تم إضافة الصنف بنجاح');
      }
      
      onSuccess(result);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach(err => toast.error(err.message));
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
        console.error(error);
      }
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "تعديل صنف" : "إضافة صنف جديد"} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">اسم الصنف *</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">كود الصنف *</label>
            <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="تلقائي..." />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">سعر الشراء</label>
            <input value={formData.purchase_price || ''} onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">سعر البيع *</label>
            <input value={formData.sale_price || ''} onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">العملة</label>
            <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">تحديد لاحقاً</option>
              <option value="IQD">دينار (IQD)</option>
              <option value="USD">دولار (USD)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {!initialData && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">رصيد افتتاحي</label>
              <input value={formData.opening_stock || ''} onChange={e => setFormData({...formData, opening_stock: parseFloat(e.target.value) || 0})} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">المخزن</label>
            <select value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر المخزن...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-text-muted">التصنيف</label>
              <button onClick={() => setIsCategoryModalOpen(true)} className="text-primary text-xs font-bold hover:underline flex items-center"><Plus size={12}/> جديد</button>
            </div>
            <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر التصنيف...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-text-muted">وحدة القياس</label>
              <button onClick={() => setIsUnitModalOpen(true)} className="text-primary text-xs font-bold hover:underline flex items-center"><Plus size={12}/> جديد</button>
            </div>
            <select value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر الوحدة...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={formData.allow_negative_stock}
              onChange={(e) => setFormData({...formData, allow_negative_stock: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ms-3 text-sm font-bold text-text-muted">السماح بالبيع بالسالب (بدون رصيد)</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-text-muted hover:bg-bg-main rounded-xl transition-colors">إلغاء</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md font-bold">حفظ الصنف</button>
        </div>
      </div>
    </Modal>
    <CategoryForm 
      isOpen={isCategoryModalOpen} 
      onClose={() => setIsCategoryModalOpen(false)} 
      onSuccess={(cat) => {
        setCategories([...categories, cat]);
        setFormData({ ...formData, category_id: cat.id.toString() });
      }} 
    />
    <UnitForm 
      isOpen={isUnitModalOpen} 
      onClose={() => setIsUnitModalOpen(false)} 
      onSuccess={(unit) => {
        setUnits([...units, unit]);
        setFormData({ ...formData, unit_id: unit.id.toString() });
      }} 
    />
    </>
  );
};

export default ProductForm;
