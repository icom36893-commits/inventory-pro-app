import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
}

interface ActionDropdownProps {
  actions: ActionItem[];
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 144; // w-36 = 144px
      
      // Align to the left edge of the button, adjust if off-screen
      let leftPos = rect.left;
      if (leftPos < 10) {
        leftPos = 10;
      } else if (leftPos + dropdownWidth > window.innerWidth - 10) {
        leftPos = window.innerWidth - dropdownWidth - 10;
      }

      setPosition({
        top: rect.bottom + window.scrollY,
        left: leftPos + window.scrollX
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-right">
      <button 
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="إجراءات"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="absolute w-36 rounded-xl bg-white shadow-xl border border-gray-100 z-[9999] overflow-hidden"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="py-1">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick();
                }}
                className={`group flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  action.variant === 'danger' ? 'text-danger hover:bg-danger/10' : 
                  action.variant === 'warning' ? 'text-warning hover:bg-warning/10' :
                  action.variant === 'primary' ? 'text-primary hover:bg-primary/10' :
                  'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="ml-3 opacity-80 group-hover:opacity-100">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActionDropdown;
