import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (item: any) => void;
  isLoading?: boolean;
  itemsPerPage?: number;
  // Pagination Props
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ 
  columns, 
  data, 
  onRowClick, 
  isLoading, 
  itemsPerPage = 10,
  totalItems,
  currentPage: externalPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState(itemsPerPage);

  const currentLimit = onItemsPerPageChange ? itemsPerPage : internalLimit;
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const isServerSide = totalItems !== undefined && onPageChange !== undefined;

  const totalPages = isServerSide 
    ? Math.ceil((totalItems || 0) / currentLimit) 
    : Math.ceil(data.length / currentLimit);

  const currentData = isServerSide 
    ? data 
    : data.slice((currentPage - 1) * currentLimit, currentPage * currentLimit);

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasData = isServerSide ? (totalItems || 0) > 0 : data.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-bg-main">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={cn("p-4 text-xs font-bold text-text-muted", col.className)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr 
                  key={item.id || index} 
                  className={cn(
                    "hover:bg-bg-main transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("p-4 text-sm text-text-primary", col.className)}>
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-text-muted italic">
                  لا توجد بيانات لعرضها
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {hasData && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border bg-bg-main/50 gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              إجمالي السجلات: {isServerSide ? totalItems : data.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">عرض:</span>
              <select 
                value={currentLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (onItemsPerPageChange) {
                    onItemsPerPageChange(val);
                  } else {
                    setInternalLimit(val);
                    setInternalPage(1);
                  }
                }}
                className="bg-white border border-border rounded px-2 py-1 text-sm outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={1000}>1000</option>
                <option value={999999}>الكل</option>
              </select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-white border border-border disabled:opacity-50 hover:bg-bg-main transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-sm font-bold text-text-primary px-4">
                صفحة {currentPage} من {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-white border border-border disabled:opacity-50 hover:bg-bg-main transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
