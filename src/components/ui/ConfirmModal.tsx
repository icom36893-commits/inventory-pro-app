import React from 'react';
import Modal from '../shared/Modal';
import { AlertTriangle } from 'lucide-react';

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
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="flex flex-col items-center text-center p-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
          type === 'danger' ? 'bg-danger/10 text-danger' : 
          type === 'warning' ? 'bg-warning/10 text-warning' : 
          'bg-primary/10 text-primary'
        }`}>
          <AlertTriangle size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-muted mb-8">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-bg-main text-text-primary font-bold rounded-xl hover:bg-border transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors shadow-md ${
              type === 'danger' ? 'bg-danger hover:bg-danger/90 shadow-danger/20' : 
              type === 'warning' ? 'bg-warning hover:bg-warning/90 shadow-warning/20' : 
              'bg-primary hover:bg-primary-light shadow-primary/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
