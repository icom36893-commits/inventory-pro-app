import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { useToast } from '../../context/ToastContext';
import { customerSupplierSchema } from '../../utils/validations';
import { z } from 'zod';

interface PartyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (party: any) => void;
  type: 'customer' | 'supplier';
  initialData?: any;
}

const PartyForm: React.FC<PartyFormProps> = ({ isOpen, onClose, onSuccess, type, initialData }) => {
  const [formData, setFormData] = useState({
    type,
    name: '',
    phone: '',
    email: '',
    address: '',
    opening_balance_iqd: 0,
    opening_balance_usd: 0
  });
  
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        type,
        name: '',
        phone: '',
        email: '',
        address: '',
        opening_balance_iqd: 0,
        opening_balance_usd: 0
      });
    }
  }, [initialData, isOpen, type]);

  const handleSubmit = async () => {
    try {
      const validatedData = customerSupplierSchema.parse(formData);
      
      let result;
      if (initialData?.id) {
        await (window as any).api.parties.update(initialData.id, validatedData);
        result = { ...validatedData, id: initialData.id };
        toast.success(`تم تحديث بيانات ال${type === 'customer' ? 'عميل' : 'مورد'} بنجاح`);
      } else {
        const id = await (window as any).api.parties.create({
          ...validatedData,
          code: `${type === 'customer' ? 'C' : 'S'}-${Date.now().toString().slice(-6)}`
        });
        result = { ...validatedData, id };
        toast.success(`تم إضافة ال${type === 'customer' ? 'عميل' : 'مورد'} بنجاح`);
      }
      
      onSuccess(result);
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        (error as any).errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
        console.error(error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? `تعديل بيانات ${type === 'customer' ? 'العميل' : 'المورد'}` : `إضافة ${type === 'customer' ? 'عميل' : 'مورد'} جديد`} size="md">
      <div className="space-y-6 animate-fade-in p-2">
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-primary flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${type === 'customer' ? 'bg-primary' : 'bg-indigo-500'}`}></span>
            المعلومات الأساسية والتواصل
          </h4>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">الاسم الكامل <span className="text-danger">*</span></label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder={`اكتب اسم ال${type === 'customer' ? 'عميل' : 'مورد'} أو الشركة...`} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="text" placeholder="مثال: 07xxxxxxxxx" className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium text-left" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="example@domain.com" className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium text-left" dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">العنوان أو الموقع</label>
            <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" placeholder="المدينة، المنطقة، أو عنوان المحل..." className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm font-medium" />
          </div>
        </div>
        
        {!initialData && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${type === 'customer' ? 'from-green-400 to-emerald-600' : 'from-indigo-400 to-purple-600'} rounded-r-2xl`}></div>
            <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-2">
              الرصيد الافتتاحي (الديون السابقة)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رصيد بالدينار (IQD)</label>
                <div className="relative">
                  <input value={formData.opening_balance_iqd || ''} onChange={e => setFormData({...formData, opening_balance_iqd: parseFloat(e.target.value) || 0})} type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner font-bold text-gray-800" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">IQD</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رصيد بالدولار (USD)</label>
                <div className="relative">
                  <input value={formData.opening_balance_usd || ''} onChange={e => setFormData({...formData, opening_balance_usd: parseFloat(e.target.value) || 0})} type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-inner font-bold text-gray-800" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">USD</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">ملاحظة: الرصيد الموجب يعني أن له أموال (دائن)، والرصيد السالب يعني عليه ديون (مدين).</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors font-bold">إلغاء الأمر</button>
          <button onClick={handleSubmit} className={`px-8 py-3 bg-gradient-to-r ${type === 'customer' ? 'from-primary to-indigo-500 shadow-primary/30' : 'from-indigo-600 to-purple-600 shadow-indigo-500/30'} text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-lg`}>
            {initialData ? 'حفظ التعديلات' : `إضافة ${type === 'customer' ? 'العميل' : 'المورد'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PartyForm;
