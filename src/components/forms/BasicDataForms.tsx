import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { useToast } from '../../context/ToastContext';
import { categorySchema, unitSchema } from '../../utils/validations';
import { z } from 'zod';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: any) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      const validated = categorySchema.parse(formData);
      const id = await (window as any).api.basicData.createCategory(validated);
      toast.success('تم إضافة التصنيف بنجاح');
      onSuccess({ id, ...validated });
      setFormData({ name: '', description: '' });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        (error as any).errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة تصنيف جديد" size="sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-text-muted">الاسم *</label>
          <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold text-text-muted">الوصف</label>
          <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light font-bold">حفظ</button>
        </div>
      </div>
    </Modal>
  );
};

interface UnitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (unit: any) => void;
}

export const UnitForm: React.FC<UnitFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '' });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      const validated = unitSchema.parse(formData);
      const id = await (window as any).api.basicData.createUnit(validated);
      toast.success('تم إضافة الوحدة بنجاح');
      onSuccess({ id, ...validated });
      setFormData({ name: '' });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        (error as any).errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة وحدة جديدة" size="sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-text-muted">الاسم *</label>
          <input value={formData.name} onChange={e => setFormData({name: e.target.value})} className="w-full bg-bg-main border-none rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-text-muted hover:bg-bg-main transition-colors">إلغاء</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light font-bold">حفظ</button>
        </div>
      </div>
    </Modal>
  );
};
