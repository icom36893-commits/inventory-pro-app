import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { Shield, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { activateSystemWithFirebase } from '../../utils/firebase-activation';
import { useLicenseStore, useAuthStore } from '../../store';

// Helper to get or generate HWID
const getHWID = () => {
  let hwid = localStorage.getItem('system_hwid');
  if (!hwid) {
    hwid = 'HWID-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('system_hwid', hwid);
  }
  return hwid;
};

// Helper to get PC Name
const getPCName = (username?: string) => {
  let pcName = localStorage.getItem('system_pc_name');
  if (!pcName) {
    pcName = username ? `PC-${username.toUpperCase()}` : `PC-USER-${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('system_pc_name', pcName);
  }
  return pcName;
};

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose }) => {
  const [serialKey, setSerialKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const { activateSystem } = useLicenseStore();
  const { user } = useAuthStore();

  const handleActivate = async () => {
    if (!serialKey.trim()) {
      setStatus('error');
      setMessage('يرجى إدخال مفتاح التفعيل أولاً');
      return;
    }

    setStatus('loading');
    setMessage('جاري التحقق من التفعيل عبر السحابة...');

    try {
      const hwid = getHWID();
      const pcName = getPCName(user?.username);
      
      const result = await activateSystemWithFirebase(serialKey, pcName, hwid);
      
      if (result.success && result.activationType && result.expiryDate) {
        setStatus('success');
        setMessage(result.message || 'تم تفعيل النظام بنجاح!');
        
        // حفظ حالة التفعيل في النظام
        activateSystem(result.activationType, result.expiryDate);

        setTimeout(() => {
          onClose();
          setStatus('idle');
          setMessage('');
          setSerialKey('');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.message || 'فشل التفعيل');
      }
    } catch (error) {
      setStatus('error');
      setMessage('حدث خطأ أثناء الاتصال بخادم التراخيص السحابي');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفعيل النظام" size="md">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
          <Shield size={40} className="text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-text-primary mb-2">قم بترقية نظامك الآن</h3>
        <p className="text-text-muted mb-8 text-sm max-w-sm mx-auto">
          أدخل مفتاح التفعيل الخاص بك للوصول إلى كافة الميزات المتقدمة للنظام
          <br/>
          <span className="text-xs opacity-75 mt-1 block">(الصيغة: PRO-2026-XXXXXXX)</span>
        </p>
        
        <div className="w-full max-w-sm mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text-muted">
              <Key size={20} className="text-amber-500/70" />
            </div>
            <input 
              type="text" 
              value={serialKey}
              onChange={(e) => {
                setSerialKey(e.target.value.toUpperCase());
                setStatus('idle');
                setMessage('');
              }}
              placeholder="PRO-2026-XXXXXXX"
              className="w-full pl-4 pr-12 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all font-mono text-center text-lg tracking-wider text-text-primary bg-bg-main placeholder:text-text-muted/50"
              dir="ltr"
            />
          </div>
          
          {status !== 'idle' && (
            <div className={`mt-3 flex items-center justify-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-1 ${
              status === 'success' ? 'text-success' : 
              status === 'error' ? 'text-danger' : 
              'text-primary'
            }`}>
              {status === 'success' ? <CheckCircle size={18} /> : 
               status === 'error' ? <AlertCircle size={18} /> : 
               <Loader2 size={18} className="animate-spin" />}
              <span>{message}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 w-full max-w-sm mt-2">
          <button 
            onClick={onClose}
            disabled={status === 'loading'}
            className="flex-1 py-3 px-4 bg-bg-main text-text-primary font-bold rounded-xl hover:bg-border transition-colors border border-border disabled:opacity-50"
          >
            إلغاء
          </button>
          <button 
            onClick={handleActivate}
            disabled={status === 'loading'}
            className="flex-[2] py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? 'جاري التحقق...' : 'تفعيل الآن'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActivationModal;
