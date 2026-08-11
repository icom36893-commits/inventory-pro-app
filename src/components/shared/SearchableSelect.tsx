import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Option {
  value: string;
  label: string;
  type?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  requireSearch?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'بحث...', className, requireSearch = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.type && o.type.toLowerCase().includes(search.toLowerCase()))
  );

  const showResults = !requireSearch || search.trim().length > 0;

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div 
        className="flex items-center justify-between px-4 py-2 border border-border rounded-xl bg-bg-main cursor-pointer hover:border-primary/50 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !selectedOption && "text-text-muted")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn("text-text-muted transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[220px] mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="flex items-center px-3 py-2 border-b border-border bg-bg-main">
            <Search size={16} className="text-text-muted mr-2" />
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-sm mr-2"
              placeholder="اكتب للبحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="overflow-y-auto flex-1">
            {!showResults ? (
              <div className="px-4 py-3 text-sm text-text-muted text-center">الرجاء كتابة كلمة للبحث...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted text-center">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((option) => (
                <div 
                  key={option.value}
                  className={cn(
                    "px-4 py-2 text-sm cursor-pointer hover:bg-bg-main flex justify-between items-center transition-colors",
                    value === option.value && "bg-primary/5 text-primary font-bold"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span>{option.label}</span>
                  {option.type && <span className="text-xs text-text-muted bg-border/50 px-2 py-0.5 rounded-full">{option.type}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
