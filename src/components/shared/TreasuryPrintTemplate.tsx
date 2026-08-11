import React from 'react';
import { useSettingsStore } from '../../store';
import { formatCurrency } from '../../utils/currency';

interface TreasuryPrintTemplateProps {
  transaction: any;
}

const categoryTranslations: Record<string, string> = {
  customer_payment: 'دفعة من عميل',
  supplier_return: 'مرتجع مورد',
  customer_return: 'مرتجع عميل',
  supplier_payment: 'دفعة لمورد',
};
const translateCategory = (cat: string) => categoryTranslations[cat] || cat;

const TreasuryPrintTemplate: React.FC<TreasuryPrintTemplateProps> = ({ transaction }) => {
  const { settings } = useSettingsStore();
  
  if (!transaction) return null;

  const companyName = settings?.name || 'برنامج الحسابات';
  const companyAddress = settings?.address || '';
  const taxNumber = settings?.tax_number || '';
  const phone = settings?.phone || '';
  
  const showLogo = settings?.print_show_logo !== 'false' && settings?.print_show_logo !== 0;
  const templateType = settings?.treasury_template_type || 'internal';
  const primaryColor = settings?.treasury_print_color || settings?.print_primary_color || '#1e293b';
  const logoSize = settings?.treasury_logo_size || 120;
  const customHtml = settings?.treasury_custom_html || '';

  if (templateType === 'custom' && customHtml) {
    const parsedHtml = customHtml
      .replaceAll('{{company_name}}', companyName)
      .replaceAll('{{company_address}}', companyAddress)
      .replaceAll('{{company_phone}}', phone)
      .replaceAll('{{tax_number_html}}', taxNumber ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">الرقم الضريبي: ${taxNumber}</p>` : '')
      .replaceAll('{{logo_img}}', showLogo && settings?.logo ? `<img src="${settings.logo}" style="height: ${logoSize}px; object-fit: contain;" />` : '')
      .replaceAll('{{receipt_type_label}}', transaction.type === 'income' ? 'سند قبض (إيراد)' : 'سند صرف (مصروف)')
      .replaceAll('{{receipt_number}}', transaction.id?.toString())
      .replaceAll('{{date}}', transaction.date)
      .replaceAll('{{amount}}', formatCurrency(transaction.amount, transaction.currency || 'IQD'))
      .replaceAll('{{party_name}}', transaction.party_name || 'نقدي')
      .replaceAll('{{category}}', translateCategory(transaction.category || ''))
      .replaceAll('{{description}}', transaction.description || '');

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  // Fallback to internal/default design if custom HTML fails or is not selected
  return (
    <>
      <div className="p-8 bg-white text-black font-cairo" dir="rtl">
      <div className="flex justify-between items-start pb-6 mb-6 border-b-4" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-4">
          {showLogo && settings?.logo && (
            <img src={settings.logo as string} alt="Logo" className="object-contain" style={{ height: `${logoSize}px` }} />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{companyName}</h1>
            <p className="text-sm text-gray-600">{companyAddress}</p>
            <p className="text-sm text-gray-600">هاتف: {phone}</p>
            {taxNumber && <p className="text-sm text-gray-600">الرقم الضريبي: {taxNumber}</p>}
          </div>
        </div>
        <div className="text-left p-4 rounded-xl min-w-[200px]" style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}>
          <h2 className="text-2xl font-bold mb-2 border-b pb-2" style={{ color: primaryColor, borderColor: `${primaryColor}30` }}>
            {transaction.type === 'income' ? 'سند قبض (إيراد)' : 'سند صرف (مصروف)'}
          </h2>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">رقم السند:</span>
            <span className="font-bold">{transaction.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">التاريخ:</span>
            <span className="font-bold">{transaction.date}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center mb-8">
        <p className="text-gray-500 font-bold mb-2">مبلغ وقدره</p>
        <h2 className="text-4xl font-bold" style={{ color: primaryColor }}>
          {formatCurrency(transaction.amount, transaction.currency || 'IQD')}
        </h2>
      </div>

      <table className="w-full mb-8 border-collapse">
        <tbody>
          <tr>
            <td className="p-4 border-b border-gray-200 w-1/4 text-gray-500 font-bold">الطرف الثاني:</td>
            <td className="p-4 border-b border-gray-200 font-bold text-lg">{transaction.party_name || 'عام'}</td>
          </tr>
          <tr>
            <td className="p-4 border-b border-gray-200 text-gray-500 font-bold">التصنيف:</td>
            <td className="p-4 border-b border-gray-200 text-lg">{translateCategory(transaction.category || '')}</td>
          </tr>
          <tr>
            <td className="p-4 border-b border-gray-200 text-gray-500 font-bold">الوصف / البيان:</td>
            <td className="p-4 border-b border-gray-200 leading-relaxed">{transaction.description || '-'}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-16 pt-8 flex justify-between text-sm text-gray-500" style={{ borderTop: `2px solid ${primaryColor}30` }}>
        <div className="text-center w-48">
          <p className="mb-8 font-bold">توقيع المستلم</p>
          <div className="border-b border-gray-400 w-full"></div>
        </div>
        <div className="text-center w-48">
          <p className="mb-8 font-bold">توقيع المحاسب / الختم</p>
          <div className="border-b border-gray-400 w-full"></div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TreasuryPrintTemplate;
