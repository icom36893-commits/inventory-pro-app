import React from 'react';
import Modal from '../shared/Modal';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger'
}) => {
  
  const Icon = type === 'danger' ? Trash2 : type === 'warning' ? AlertTriangle : Info;
  
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center p-6 space-y-6">
        
        {/* Animated Icon Container */}
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-20",
            type === 'danger' ? 'bg-danger' : 
            type === 'warning' ? 'bg-warning' : 'bg-primary'
          )}></div>
          <div className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center shadow-inner",
            type === 'danger' ? 'bg-danger/10 text-danger border-4 border-danger/20' : 
            type === 'warning' ? 'bg-warning/10 text-warning border-4 border-warning/20' : 
            'bg-primary/10 text-primary border-4 border-primary/20'
          )}>
            <Icon size={36} strokeWidth={2.5} />
          </div>
        </div>
        
        {/* Message */}
        <div className="space-y-2">
          <p className="text-text-primary text-lg font-bold leading-relaxed">
            {message}
          </p>
          {type === 'danger' && (
            <p className="text-danger text-sm font-bold bg-danger/5 py-1 px-3 rounded-lg inline-block">
              تنبيه: هذا الإجراء لا يمكن التراجع عنه!
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 w-full pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={cn(
              "flex-1 py-3 px-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2",
              type === 'danger' ? 'bg-danger hover:bg-danger-hover shadow-danger/30 hover:shadow-danger/50' : 
              type === 'warning' ? 'bg-warning hover:bg-warning-hover shadow-warning/30 hover:shadow-warning/50' : 
              'bg-primary hover:bg-primary-hover shadow-primary/30 hover:shadow-primary/50'
            )}
          >
            <Icon size={18} />
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

