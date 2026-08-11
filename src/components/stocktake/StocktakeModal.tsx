import React, { useState, useEffect } from 'react';
import { X, Search, Save, CheckCircle, Plus, FileText, Trash2 } from 'lucide-react';
import Modal from '../shared/Modal';
import { useToast } from '../../context/ToastContext';

interface StocktakeItem {
  product_id: number;
  product_name: string;
  product_code: string;
  system_qty: number;
  actual_qty: number;
  difference: number;
  notes: string;
}

interface StocktakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StocktakeModal: React.FC<StocktakeModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [stocktakes, setStocktakes] = useState<any[]>([]);
  const [currentStocktake, setCurrentStocktake] = useState<any>(null);
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadStocktakes();
      setView('list');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadStocktakes = async () => {
    try {
      const data = await (window as any).api.stocktake.getAll();
      setStocktakes(data);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحميل عمليات الجرد');
    }
  };

  const startNewStocktake = async () => {
    try {
      setIsLoading(true);
      const products = await (window as any).api.products.getAll();
      const newItems = products.filter((p: any) => p.is_active).map((p: any) => ({
        product_id: p.id,
        product_name: p.name,
        product_code: p.code,
        system_qty: p.current_stock,
        actual_qty: p.current_stock,
        difference: 0,
        notes: ''
      }));
      setItems(newItems);
      setCurrentStocktake(null);
      setNotes('');
      setView('edit');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء بدء الجرد');
    } finally {
      setIsLoading(false);
    }
  };

  const openStocktake = async (id: number) => {
    try {
      setIsLoading(true);
      const data = await (window as any).api.stocktake.getById(id);
      setCurrentStocktake(data);
      setItems(data.items);
      setNotes(data.notes || '');
      setView('edit');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحميل الجرد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQtyChange = (productId: number, actualQty: number) => {
    setItems(items.map(item => {
      if (item.product_id === productId) {
        return {
          ...item,
          actual_qty: actualQty,
          difference: actualQty - item.system_qty
        };
      }
      return item;
    }));
  };

  const handleNoteChange = (productId: number, note: string) => {
    setItems(items.map(item => {
      if (item.product_id === productId) {
        return { ...item, notes: note };
      }
      return item;
    }));
  };

  const saveDraft = async () => {
    try {
      setIsLoading(true);
      // Fetch currently logged in user from local storage or context if available. For now we pass 1 as default admin
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 };

      const payload = {
        id: currentStocktake?.id,
        notes,
        created_by: user.id,
        items
      };
      
      await (window as any).api.stocktake.saveDraft(payload);
      toast.success('تم حفظ مسودة الجرد بنجاح');
      loadStocktakes();
      setView('list');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ الجرد');
    } finally {
      setIsLoading(false);
    }
  };

  const applyStocktake = async () => {
    if (!window.confirm('هل أنت متأكد من إعتماد هذا الجرد؟ سيتم استبدال جميع أرصدة الأصناف بالكميات الفعلية المدخلة، وهذا الإجراء لا يمكن التراجع عنه.')) return;
    
    try {
      setIsLoading(true);
      // First save it
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 };

      const payload = {
        id: currentStocktake?.id,
        notes,
        created_by: user.id,
        items
      };
      
      const saveRes = await (window as any).api.stocktake.saveDraft(payload);
      
      // Then apply it
      await (window as any).api.stocktake.apply(saveRes.id);
      toast.success('تم إعتماد الجرد وتحديث الأرصدة بنجاح');
      loadStocktakes();
      setView('list');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إعتماد الجرد');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStocktake = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف مسودة الجرد هذه؟')) return;
    try {
      await (window as any).api.stocktake.delete(id);
      toast.success('تم حذف الجرد بنجاح');
      loadStocktakes();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف الجرد');
    }
  };

  const filteredItems = items.filter(item => 
    item.product_name.toLowerCase().includes(search.toLowerCase()) || 
    item.product_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="الجرد المخزني" size="full">
      {view === 'list' ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">عمليات الجرد السابقة</h2>
            <button 
              onClick={startNewStocktake}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light"
            >
              <Plus size={18} />
              بدء جرد جديد
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-bg-main border-b border-border">
                <tr>
                  <th className="p-4 font-bold text-text-muted">رقم الجرد</th>
                  <th className="p-4 font-bold text-text-muted">التاريخ</th>
                  <th className="p-4 font-bold text-text-muted">الحالة</th>
                  <th className="p-4 font-bold text-text-muted">الملاحظات</th>
                  <th className="p-4 font-bold text-text-muted">المستخدم</th>
                  <th className="p-4 font-bold text-text-muted text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {stocktakes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted">لا توجد عمليات جرد سابقة</td>
                  </tr>
                ) : (
                  stocktakes.map(st => (
                    <tr key={st.id} className="border-b border-border last:border-0 hover:bg-bg-main/50 transition-colors">
                      <td className="p-4 font-bold">{st.stocktake_number}</td>
                      <td className="p-4">{new Date(st.date).toLocaleDateString('ar-IQ')}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.status === 'applied' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {st.status === 'applied' ? 'معتمد' : 'مسودة'}
                        </span>
                      </td>
                      <td className="p-4">{st.notes}</td>
                      <td className="p-4">{st.created_by_name}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openStocktake(st.id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="عرض / تعديل"
                          >
                            <FileText size={18} />
                          </button>
                          {st.status === 'draft' && (
                            <button 
                              onClick={() => deleteStocktake(st.id)}
                              className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-bg-main">
          {/* Header */}
          <div className="bg-white p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('list')}
                className="p-2 hover:bg-bg-main rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
              <div>
                <h2 className="text-lg font-bold">{currentStocktake ? currentStocktake.stocktake_number : 'جرد مخزني جديد'}</h2>
                <p className="text-sm text-text-muted">
                  {currentStocktake?.status === 'applied' ? 'هذا الجرد معتمد ولا يمكن التعديل عليه' : 'قم بتعديل الكمية الفعلية لكل صنف لمطابقة الرصيد'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentStocktake?.status !== 'applied' && (
                <>
                  <button 
                    onClick={saveDraft}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-white border border-border text-text-primary px-4 py-2 rounded-lg hover:bg-bg-main"
                  >
                    <Save size={18} />
                    حفظ مسودة
                  </button>
                  <button 
                    onClick={applyStocktake}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light"
                  >
                    <CheckCircle size={18} />
                    إعتماد وتحديث الأرصدة
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white p-4 rounded-xl border border-border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">ملاحظات الجرد</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={currentStocktake?.status === 'applied'}
                    className="w-full bg-bg-main border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    placeholder="ملاحظات عامة حول هذا الجرد..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">بحث عن صنف</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-bg-main border border-border rounded-lg pr-10 pl-4 py-2 focus:outline-none focus:border-primary"
                      placeholder="ابحث بالاسم أو الكود..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-bg-main border-b border-border">
                  <tr>
                    <th className="p-4 font-bold text-text-muted">الكود</th>
                    <th className="p-4 font-bold text-text-muted">الصنف</th>
                    <th className="p-4 font-bold text-text-muted">الكمية بالنظام</th>
                    <th className="p-4 font-bold text-text-muted w-40">الكمية الفعلية</th>
                    <th className="p-4 font-bold text-text-muted">الفارق</th>
                    <th className="p-4 font-bold text-text-muted">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.product_id} className="border-b border-border last:border-0 hover:bg-bg-main/50 transition-colors">
                      <td className="p-4 text-sm">{item.product_code}</td>
                      <td className="p-4 font-bold">{item.product_name}</td>
                      <td className="p-4">{item.system_qty}</td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={item.actual_qty}
                          onChange={(e) => handleQtyChange(item.product_id, parseFloat(e.target.value) || 0)}
                          disabled={currentStocktake?.status === 'applied'}
                          className="w-full bg-white border border-border rounded-lg px-3 py-2 text-center focus:outline-none focus:border-primary font-bold"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${item.difference > 0 ? 'text-success' : item.difference < 0 ? 'text-danger' : 'text-text-muted'}`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={item.notes}
                          onChange={(e) => handleNoteChange(item.product_id, e.target.value)}
                          disabled={currentStocktake?.status === 'applied'}
                          className="w-full bg-transparent border-0 focus:ring-0 px-2"
                          placeholder="ملاحظات..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StocktakeModal;

