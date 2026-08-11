import React, { useState, useEffect } from 'react';
import { Party, Fund, StatementRow } from '../../types';
import DataTable from '../shared/DataTable';
import { Printer, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../../context/ToastContext';
import SearchableSelect from '../shared/SearchableSelect';

interface StatementsTabProps {
  parties: Party[];
  funds: Fund[];
}

const StatementsTab: React.FC<StatementsTabProps> = ({ parties, funds }) => {
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();

  const fetchStatement = async () => {
    if (!selectedAccount) {
      setStatement([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const [type, idStr] = selectedAccount.split('-');
      const data = await window.api.statements.get(type as 'party' | 'fund', Number(idStr), currency, fromDate || undefined, toDate || undefined);
      setStatement(data);
    } catch (error: any) {
      toast.error('خطأ في جلب كشف الحساب: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, currency, fromDate, toDate]);

  const searchOptions = [
    ...parties.map(p => ({ value: `party-${p.id}`, label: p.name, type: p.type === 'customer' ? 'عميل' : 'مورد' })),
    ...funds.map(f => ({ value: `fund-${f.id}`, label: f.name, type: 'صندوق' }))
  ];

  const statementColumns = [
    { key: 'date', label: 'التاريخ' },
    { 
      key: 'movement_type', 
      label: 'نوع العملية',
      render: (val: string) => {
        const translations: Record<string, string> = {
          sale: 'فاتورة مبيعات',
          purchase: 'فاتورة مشتريات',
          journal: 'سند قيد يومية',
          payment: 'دفعة/سداد',
          return: 'فاتورة مرتجع',
          invoice: 'فاتورة',
          opening_balance: 'رصيد افتتاحي',
          customer_payment: 'دفعة من عميل',
          supplier_payment: 'دفعة لمورد',
          customer_return: 'مرتجع عميل',
          supplier_return: 'مرتجع مورد'
        };
        return translations[val] || val;
      }
    },
    { key: 'reference_number', label: 'رقم المرجع' },
    { key: 'description', label: 'البيان' },
    { 
      key: 'debit', 
      label: 'مدين', 
      render: (val: number) => (
        <span className="text-danger font-bold" dir="ltr">
          {val > 0 ? val.toLocaleString() : '-'}
        </span>
      )
    },
    { 
      key: 'credit', 
      label: 'دائن', 
      render: (val: number) => (
        <span className="text-success font-bold" dir="ltr">
          {val > 0 ? val.toLocaleString() : '-'}
        </span>
      )
    },
    { 
      key: 'balance', 
      label: 'الرصيد', 
      render: (val: number) => (
        <span className="font-bold text-primary" dir="ltr">
          {val.toLocaleString()}
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-border p-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-4">
        
        {/* Account Selection & Date Filters */}
        <div className="flex flex-wrap gap-4 flex-1 items-center">
          <div className="w-80 z-10">
            <SearchableSelect 
              options={searchOptions}
              value={selectedAccount}
              onChange={setSelectedAccount}
              placeholder="اختر الحساب (بحث متقدم)..."
              requireSearch={true}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-bg-main px-3 py-1.5 rounded-xl border border-border">
            <Calendar size={18} className="text-text-muted" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">من</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold"
              />
            </div>
            <div className="w-px h-4 bg-border mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">إلى</span>
              <input 
                type="date" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex bg-bg-main p-1 rounded-xl border border-border">
            <button
              onClick={() => setCurrency('IQD')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                currency === 'IQD' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              د.ع
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                currency === 'USD' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              USD
            </button>
          </div>

          <button
            onClick={() => {}}
            disabled={!selectedAccount || statement.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl hover:bg-secondary-hover transition-all font-bold disabled:opacity-50"
          >
            <Printer size={20} />
            طباعة
          </button>
        </div>
      </div>

      {/* Statement Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedAccount ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60">
            <p className="text-lg">الرجاء اختيار حساب لعرض الكشف</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <DataTable
                data={statement}
                columns={statementColumns}
                searchable={false}
                pagination={false}
                isLoading={isLoading}
              />
            </div>
            {statement.length > 0 && (
              <div className="bg-bg-main p-4 border-t border-border flex justify-between items-center rounded-xl shadow-inner mt-4">
                <div className="flex gap-8">
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-border shadow-sm">
                    <span className="text-sm font-bold text-text-muted">إجمالي مدين</span>
                    <span className="text-danger font-black text-lg" dir="ltr">{statement.reduce((sum, row) => sum + (row.debit || 0), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-border shadow-sm">
                    <span className="text-sm font-bold text-text-muted">إجمالي دائن</span>
                    <span className="text-success font-black text-lg" dir="ltr">{statement.reduce((sum, row) => sum + (row.credit || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 px-6 py-3 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-primary">إجمالي الرصيد الحالي</span>
                  <span className="text-primary text-2xl font-black" dir="ltr">{(statement[statement.length - 1]?.balance || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default StatementsTab;

