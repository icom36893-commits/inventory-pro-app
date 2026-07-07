import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className }) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 300);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  return (
    <div className={cn("relative group", className)}>
      <Search 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" 
        size={18} 
      />
      <input 
        type="text" 
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || "بحث..."} 
        className="bg-white border border-border rounded-xl py-2.5 pr-10 pl-4 w-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
      />
    </div>
  );
};

export default SearchInput;
