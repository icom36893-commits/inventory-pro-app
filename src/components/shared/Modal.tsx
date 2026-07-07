import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95%]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0 print:block">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden"
        onClick={onClose}
      />
      <div 
        className={cn(
          "bg-white w-full rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 print:static print:transform-none print:shadow-none print:rounded-none print:h-auto print:w-full print:max-w-none print:overflow-visible",
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-main print:hidden">
          <h3 className="font-bold text-text-primary text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white transition-colors text-text-muted hover:text-danger"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible print:p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
