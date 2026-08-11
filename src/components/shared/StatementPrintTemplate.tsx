import React from 'react';
import { useSettingsStore } from '../../store';
import { defaultStatementTemplate } from '../../templates/defaultStatement';

interface StatementPrintTemplateProps {
  party: any;
  transactions: any[];
  activeType: 'customer' | 'supplier';
  currency?: 'IQD' | 'USD';
  fromDate?: string;
  toDate?: string;
}

const StatementPrintTemplate: React.FC<StatementPrintTemplateProps> = ({ party, transactions, activeType, currency = 'IQD', fromDate, toDate }) => {
  const { settings } = useSettingsStore();
  
  if (!party) return null;

  const companyName = settings?.name || 'برنامج الحسابات';
  const companyAddress = settings?.address || '';
  const phone = settings?.phone || '';
  
  const showLogo = settings?.print_show_logo !== 'false' && settings?.print_show_logo !== 0;
  
  const templateType = settings?.statement_template_type || 'internal';
  const primaryColor = settings?.statement_print_color || settings?.print_primary_color || '#1e293b';
  const footerText = settings?.statement_footer_text || settings?.print_footer_text || '';
  const headerImage = settings?.statement_header_image;
  const footerImage = settings?.statement_footer_image;
  const customHtml = settings?.statement_custom_html || '';
  const logoSize = settings?.statement_logo_size || 120;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'IQD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalDebit = transactions.reduce((sum, tx) => sum + (tx.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + (tx.credit || 0), 0);
  const finalBalanceIqd = party.current_balance_iqd || 0;
  const finalBalanceUsd = party.current_balance_usd || 0;

  if (templateType === 'custom' || templateType === 'internal' || !templateType) {
    const htmlTemplate = (templateType === 'custom' && customHtml) ? customHtml : defaultStatementTemplate;
    
    let itemsRows = '';
    if (transactions.length === 0) {
      itemsRows = `<tr><td colspan="6" style="padding: 15px; text-align: center; color: #64748b;">لا توجد حركات مسجلة</td></tr>`;
    } else {
      itemsRows = transactions.map((tx: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${tx.date}</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${({
          opening_balance: 'رصيد افتتاحي',
          invoice: 'فاتورة',
          payment: 'دفعة/سداد',
          journal: 'سند قيد يومية',
          sale: 'فاتورة مبيعات',
          purchase: 'فاتورة مشتريات',
          return: 'فاتورة مرتجع',
          sale_return: 'مرتجع مبيعات',
          purchase_return: 'مرتجع مشتريات'
        } as Record<string, string>)[tx.type] || tx.type}</td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${tx.reference_id || '-'}</td>
          <td style="padding: 12px; text-align: center; color: #dc2626; border: 1px solid #e2e8f0;">${tx.debit > 0 ? formatCurrency(tx.debit, currency) : '-'}</td>
          <td style="padding: 12px; text-align: center; color: #16a34a; border: 1px solid #e2e8f0;">${tx.credit > 0 ? formatCurrency(tx.credit, currency) : '-'}</td>
          <td style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #e2e8f0;">${formatCurrency(currency === 'IQD' ? (tx.balance_iqd || 0) : (tx.balance_usd || 0), currency)}</td>
        </tr>
      `).join('');
    }

    const statementPeriod = (fromDate || toDate) ? `من ${fromDate || '-'} إلى ${toDate || '-'}` : 'كل الفترة';

    const parsedHtml = htmlTemplate
      .replaceAll('{{company_name}}', companyName)
      .replaceAll('{{company_address}}', companyAddress)
      .replaceAll('{{company_phone}}', phone)
      .replaceAll('{{logo_img}}', showLogo && settings?.logo ? `<img src="${settings.logo}" style="height: ${logoSize}px; object-fit: contain;" />` : '')
      .replaceAll('{{statement_date}}', new Date().toLocaleDateString('en-GB'))
      .replaceAll('{{statement_period}}', statementPeriod)
      .replaceAll('{{party_type_label}}', activeType === 'customer' ? 'عميل' : 'مورد')
      .replaceAll('{{party_name}}', party.name || '')
      .replaceAll('{{party_phone}}', party.phone || '')
      .replaceAll('{{party_address}}', party.address || '')
      .replaceAll('{{party_initial_balance}}', formatCurrency(party.initial_balance || 0, currency))
      .replaceAll('{{transactions_table_rows}}', itemsRows)
      .replaceAll('{{total_debit}}', formatCurrency(totalDebit, currency))
      .replaceAll('{{total_credit}}', formatCurrency(totalCredit, currency))
      .replaceAll('{{final_balance}}', formatCurrency(currency === 'IQD' ? finalBalanceIqd : finalBalanceUsd, currency))
      .replaceAll('{{currency}}', currency)
      .replaceAll('{{footer_text_html}}', footerText ? `<div style="margin-top: 30px; text-align: center; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 15px; border-radius: 8px;">${footerText}</div>` : '');

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  if (templateType === 'external') {
    return (
      <div className="w-full text-black bg-white" dir="rtl">
        {headerImage && (
          <div className="mb-4">
            <img src={headerImage} alt="Header" className="w-full object-contain" style={{ height: `${logoSize}px` }} />
          </div>
        )}
        
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">كشف حساب {activeType === 'customer' ? 'عميل' : 'مورد'}</h2>
            <p className="text-gray-600 mt-2">التاريخ: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-gray-600 text-sm">الفترة: {(fromDate || toDate) ? `${fromDate || '-'} إلى ${toDate || '-'}` : 'كل الفترة'}</p>
          </div>

          <div className="mb-6 flex justify-between border-b pb-4">
            <div>
              <p className="font-bold text-lg">{party.name}</p>
              <p className="text-gray-600 text-sm">{party.phone}</p>
            </div>
            <div className="text-left">
              <p className="text-gray-600 text-sm">كود: {party.code}</p>
              <p className="font-bold text-primary mt-2">
                الرصيد النهائي: {formatCurrency(currency === 'IQD' ? finalBalanceIqd : finalBalanceUsd, currency)}
              </p>
            </div>
          </div>

          <table className="w-full text-right border-collapse mb-8">
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: 'white' }}>
                <th className="border p-2">التاريخ</th>
                <th className="border p-2">نوع الحركة</th>
                <th className="border p-2">رقم المرجع</th>
                <th className="border p-2">مدين ({currency})</th>
                <th className="border p-2">دائن ({currency})</th>
                <th className="border p-2">الرصيد ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any, idx: number) => (
                <tr key={idx}>
                  <td className="border p-2">{tx.date}</td>
                  <td className="border p-2">{({
          opening_balance: 'رصيد افتتاحي',
          invoice: 'فاتورة',
          payment: 'دفعة/سداد',
          journal: 'سند قيد يومية',
          sale: 'فاتورة مبيعات',
          purchase: 'فاتورة مشتريات',
          return: 'فاتورة مرتجع',
          sale_return: 'مرتجع مبيعات',
          purchase_return: 'مرتجع مشتريات'
        } as Record<string, string>)[tx.type] || tx.type}</td>
                  <td className="border p-2 text-center">{tx.reference_id || '-'}</td>
                  <td className="border p-2 text-red-600 text-center">{tx.debit > 0 ? formatCurrency(tx.debit, currency) : '-'}</td>
                  <td className="border p-2 text-green-600 text-center">{tx.credit > 0 ? formatCurrency(tx.credit, currency) : '-'}</td>
                  <td className="border p-2 text-center font-bold">{formatCurrency(currency === 'IQD' ? (tx.balance_iqd || 0) : (tx.balance_usd || 0), currency)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">لا توجد حركات مسجلة</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-end gap-8 font-bold">
            <p>إجمالي مدين: {formatCurrency(totalDebit, currency)}</p>
            <p>إجمالي دائن: {formatCurrency(totalCredit, currency)}</p>
          </div>
        </div>

        {footerImage && (
          <div className="mt-8 pt-4">
            <img src={footerImage} alt="Footer" className="w-full object-contain" />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default StatementPrintTemplate;
