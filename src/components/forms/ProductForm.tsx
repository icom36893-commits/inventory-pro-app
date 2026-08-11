import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../shared/Modal';
import { useToast } from '../../context/ToastContext';
import { productSchema } from '../../utils/validations';
import { z } from 'zod';
import { CategoryForm, UnitForm } from './BasicDataForms';
import QRCode from 'react-qr-code';

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
    allow_negative_stock: false,
    is_initial: 0
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
          opening_stock: initialData.is_initial ? initialData.current_stock : (initialData.opening_stock || 0),
          category_id: initialData.category_id || '',
          unit_id: initialData.unit_id || '',
          warehouse_id: initialData.warehouse_id || '',
          allow_negative_stock: !!initialData.allow_negative_stock,
          is_initial: initialData.is_initial || 0
        });
      } else {
        setFormData({
          name: '',
          code: '',
          purchase_price: 0,
          sale_price: 0,
          currency: '',
          opening_stock: 0,
          category_id: '',
          unit_id: '',
          warehouse_id: '',
          allow_negative_stock: false,
          is_initial: 0
        });
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    try {
      const validatedData = productSchema.parse(formData);
      const dataToSave = {
        ...validatedData,
        code: validatedData.code || '',
        category_id: validatedData.category_id ? parseInt(validatedData.category_id as string) : null,
        unit_id: validatedData.unit_id ? parseInt(validatedData.unit_id as string) : null,
        warehouse_id: validatedData.warehouse_id ? parseInt(validatedData.warehouse_id as string) : null,
        is_initial: formData.is_initial,
        allow_negative_stock: formData.allow_negative_stock
      };

      if (formData.is_initial) {
        (dataToSave as any).current_stock = dataToSave.opening_stock;
      }

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
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "تعديل صنف" : (formData.is_initial ? "إضافة صنف أولي" : "إضافة صنف جديد")} size="md">
      <div className="space-y-6 animate-fade-in p-2">
        {/* Basic Info Section */}
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-primary flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            البيانات الأساسية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم الصنف <span className="text-danger">*</span></label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="اكتب اسم الصنف هنا..." className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">كود الصنف (الباركود)</label>
              <div className="flex gap-2 items-center">
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} type="text" className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium" placeholder="يولد تلقائياً إذا تُرك فارغاً..." />
                {formData.code && (
                  <div className="p-1.5 bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center transform hover:scale-110 transition-transform cursor-pointer" title="باركود (QR)">
                    <QRCode value={formData.code} size={36} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        {!formData.is_initial && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary to-indigo-500 rounded-r-2xl"></div>
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-2">
              التسعير
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">سعر الشراء</label>
                <div className="relative">
                  <input value={formData.purchase_price || ''} onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-8 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all font-bold text-gray-700" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary">سعر البيع <span className="text-danger">*</span></label>
                <div className="relative">
                  <input value={formData.sale_price || ''} onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})} type="number" placeholder="0.00" className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 pr-8 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all font-black text-primary shadow-inner" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 font-bold">$</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">العملة الأساسية</label>
                <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-bold text-gray-700 cursor-pointer">
                  <option value="">تحديد لاحقاً</option>
                  <option value="IQD">دينار عراقي (IQD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stock & Categorization Section */}
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-2">
            المخزون والتصنيف
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            {(!initialData?.id || formData.is_initial) && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{formData.is_initial ? "الكمية الأولية المتوفرة" : "رصيد افتتاحي (اختياري)"}</label>
                <input value={formData.opening_stock || ''} onChange={e => setFormData({...formData, opening_stock: parseFloat(e.target.value) || 0})} type="number" placeholder="0" className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all font-bold shadow-sm" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">تخصيص لمخزن</label>
              <select value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm cursor-pointer font-medium text-gray-700">
                <option value="">(بدون تخصيص)</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700">التصنيف</label>
                <button onClick={() => setIsCategoryModalOpen(true)} className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"><Plus size={12}/> إضافة جديد</button>
              </div>
              <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm cursor-pointer font-medium text-gray-700">
                <option value="">اختر التصنيف...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700">وحدة القياس</label>
                <button onClick={() => setIsUnitModalOpen(true)} className="text-primary bg-primary/10 hover:bg-primary hover:text-white px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"><Plus size={12}/> إضافة جديد</button>
              </div>
              <select value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm cursor-pointer font-medium text-gray-700">
                <option value="">اختر الوحدة...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {!formData.is_initial && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.allow_negative_stock}
                onChange={(e) => setFormData({...formData, allow_negative_stock: e.target.checked})}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success shadow-inner"></div>
            </label>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-800">السماح بالبيع بالسالب</span>
              <span className="text-xs text-gray-500 font-medium">يتيح بيع هذا الصنف حتى لو كان رصيده في المخزن صفراً</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
          <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-bold">إلغاء الأمر</button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg">
            {initialData?.id ? "حفظ التعديلات" : (formData.is_initial ? "إضافة الصنف الأولي" : "إضافة الصنف الجديد")}
          </button>
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
