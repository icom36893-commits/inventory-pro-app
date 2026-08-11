import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastProps {
 id: string;
 message: string;
 type: ToastType;
 onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
 useEffect(() => {
 const timer = setTimeout(() => {
 onClose(id);
 }, 3000);
 return () => clearTimeout(timer);
 }, [id, onClose]);

 const icons = {
 success: <CheckCircle className="text-success" size={20} />,
 error: <AlertCircle className="text-danger" size={20} />,
 warning: <AlertTriangle className="text-warning" size={20} />
 };

 const bgColors = {
 success: 'bg-success/10 border-success/20',
 error: 'bg-danger/10 border-danger/20',
 warning: 'bg-warning/10 border-warning/20'
 };

 return (
 <div className={cn("flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-4", bgColors[type])}>
 {icons[type]}
 <p className="text-sm font-bold text-text-primary">{message}</p>
 <button onClick={() => onClose(id)} className="ml-auto text-text-muted hover:text-text-primary p-1">
 <X size={16} />
 </button>
 </div>
 );
};

export default Toast;
