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
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? `تعديل ${type === 'customer' ? 'عميل' : 'مورد'}` : `إضافة ${type === 'customer' ? 'عميل' : 'مورد'} جديد`} size="md">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-text-muted">الاسم *</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">رقم الهاتف</label>
            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-text-muted">البريد الإلكتروني</label>
            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold text-text-muted">العنوان</label>
          <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        {!initialData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">الرصيد الافتتاحي (دينار)</label>
              <input value={formData.opening_balance_iqd || ''} onChange={e => setFormData({...formData, opening_balance_iqd: parseFloat(e.target.value) || 0})} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-text-muted">الرصيد الافتتاحي (دولار)</label>
              <input value={formData.opening_balance_usd || ''} onChange={e => setFormData({...formData, opening_balance_usd: parseFloat(e.target.value) || 0})} type="number" className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <button onClick={onClose} className="px-6 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-all shadow-md font-bold">حفظ</button>
        </div>
      </div>
    </Modal>
  );
};

export default PartyForm;
