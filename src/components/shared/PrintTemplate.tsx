import React from 'react';
import { useSettingsStore } from '../../store';

interface PrintTemplateProps {
  invoice: any;
}

const PrintTemplate: React.FC<PrintTemplateProps> = ({ invoice }) => {
  const { settings } = useSettingsStore();
  const companyName = settings?.name || 'برنامج الحسابات';
  const companyAddress = settings?.address || '';
  const taxNumber = settings?.tax_number || '';
  const phone = settings?.phone || '';
  
  const showLogo = settings?.print_show_logo !== 'false' && settings?.print_show_logo !== 0;

  if (!invoice) return null;

  const isSales = invoice.type?.includes('sale');
  const prefix = isSales ? 'sales' : 'purchase';
  
  const templateType = settings?.[`${prefix}_template_type`] || 'internal';
  const primaryColor = settings?.[`${prefix}_print_color`] || settings?.print_primary_color || '#1e293b';
  const templateStyle = settings?.print_template_style || 'modern';
  const footerText = settings?.[`${prefix}_footer_text`] || settings?.print_footer_text || '';
  const headerImage = settings?.[`${prefix}_header_image`];
  const footerImage = settings?.[`${prefix}_footer_image`];
  const customHtml = settings?.[`${prefix}_custom_html`] || '';
  const logoSize = settings?.[`${prefix}_logo_size`] || 60;

  if (templateType === 'custom' && customHtml) {
    const itemsRows = invoice.items?.map((item: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: bold;">${item.product_name || item.name}</td>
        <td style="padding: 12px; text-align: center;">${Number(item.quantity).toLocaleString()}</td>
        <td style="padding: 12px; text-align: center;">${Number(item.unit_price).toLocaleString()}</td>
        <td style="padding: 12px; text-align: center;">${Number(item.total).toLocaleString()}</td>
      </tr>
    `).join('') || '';

    const parsedHtml = customHtml
      .replaceAll('{{company_name}}', companyName)
      .replaceAll('{{company_address}}', companyAddress)
      .replaceAll('{{company_phone}}', phone)
      .replaceAll('{{tax_number_html}}', taxNumber ? `<p style="margin: 5px 0 0; color: #666; font-size: 14px;">الرقم الضريبي: ${taxNumber}</p>` : '')
      .replaceAll('{{logo_img}}', showLogo && settings?.logo ? `<img src="${settings.logo}" style="height: ${logoSize}px; object-fit: contain;" />` : '')
      .replaceAll('{{invoice_type_label}}', invoice.type === 'sale' ? 'فاتورة مبيعات ضريبية' : invoice.type === 'purchase' ? 'فاتورة مشتريات' : invoice.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات')
      .replaceAll('{{invoice_number}}', invoice.invoice_number)
      .replaceAll('{{date}}', invoice.date)
      .replaceAll('{{party_title}}', isSales ? 'الرقم الضريبي للعميل' : 'الرقم الضريبي')
      .replaceAll('{{party_name}}', invoice.party_name || 'عميل / مورد نقدي')
      .replaceAll('{{buyer_name_html}}', invoice.buyer_name ? `<p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">اسم المشتري: <strong style="color: #334155;">${invoice.buyer_name}</strong></p>` : '')
      .replaceAll('{{party_contact_html}}', (invoice.party_phone || invoice.party_address) ? `<div style="text-align: left; color: #64748b; font-size: 14px;">${invoice.party_phone ? `<p style="margin: 0;" dir="ltr">هاتف: ${invoice.party_phone}</p>` : ''}${invoice.party_address ? `<p style="margin: 0;">العنوان: ${invoice.party_address}</p>` : ''}</div>` : '')
      .replaceAll('{{subtotal}}', Number(invoice.subtotal || 0).toLocaleString())
      .replaceAll('{{tax_amount}}', Number(invoice.tax_amount || 0).toLocaleString())
      .replaceAll('{{total}}', Number(invoice.total || 0).toLocaleString())
      .replaceAll('{{items_table_rows}}', itemsRows)
      .replaceAll('{{footer_text_html}}', footerText ? `<div style="margin-top: 30px; text-align: center; font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 15px; border-radius: 8px;">${footerText}</div>` : '');

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  return (
    <div className={`bg-white text-black font-cairo flex flex-col ${templateType === 'external' ? 'min-h-[1056px]' : 'p-8'}`} dir="rtl">
      {templateType === 'external' && headerImage && (
        <img src={headerImage as string} alt="Header" className="w-full object-contain" style={{ height: `${logoSize}px` }} />
      )}
      
      <div className={templateType === 'external' ? 'p-8 flex-1' : ''}>
        {templateType === 'internal' ? (
          <div 
            className={`flex justify-between items-start pb-6 mb-6 ${templateStyle === 'modern' ? 'border-b-4' : 'border-b-2'}`}
            style={{ borderColor: primaryColor }}
          >
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
            <div 
              className="text-left p-4 rounded-xl min-w-[200px]"
              style={templateStyle === 'modern' ? { backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` } : { border: '2px solid #d1d5db' }}
            >
              <h2 
                className="text-2xl font-bold mb-2 border-b pb-2"
                style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
              >
                {invoice.type === 'sale' ? 'فاتورة ضريبية' : 
                 invoice.type === 'purchase' ? 'فاتورة مشتريات' : 
                 invoice.type === 'sale_return' ? 'مردودات مبيعات' : 'مردودات مشتريات'}
              </h2>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">رقم الفاتورة:</span>
                <span className="font-bold">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">التاريخ:</span>
                <span className="font-bold">{invoice.date}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end mb-8 border-b-2 border-gray-200 pb-6">
             <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  {invoice.type === 'sale' ? 'فاتورة ضريبية' : 
                   invoice.type === 'purchase' ? 'فاتورة مشتريات' : 
                   invoice.type === 'sale_return' ? 'مردودات مبيعات' : 'مردودات مشتريات'}
                </h2>
                <p className="text-sm text-gray-600">رقم الفاتورة: <span className="font-bold text-black">{invoice.invoice_number}</span></p>
                <p className="text-sm text-gray-600">التاريخ: <span className="font-bold text-black">{invoice.date}</span></p>
             </div>
             <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-200 min-w-[250px]">
                <h3 className="font-bold text-sm text-gray-500 mb-2">بيانات {isSales ? 'العميل' : 'المورد'}:</h3>
                <p className="font-bold text-lg">{invoice.party_name || 'نقدي / عام'}</p>
                {invoice.buyer_name && <p className="text-sm text-gray-600 mt-1">المشتري: <span className="font-bold text-black">{invoice.buyer_name}</span></p>}
                {invoice.party_phone && <p dir="ltr" className="text-sm text-gray-600 mt-1">{invoice.party_phone}</p>}
             </div>
          </div>
        )}

        {templateType === 'internal' && (
          <div 
            className="mb-8 p-5 rounded-xl flex justify-between items-center"
            style={templateStyle === 'modern' ? { borderLeft: `4px solid ${primaryColor}`, backgroundColor: '#f9fafb' } : { border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}
          >
            <div>
              <h3 className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">
                {isSales ? 'بيانات العميل المفوتر' : 'بيانات المورد'}
              </h3>
              <p className="font-bold text-xl">{invoice.party_name || 'نقدي / عميل عام'}</p>
              {invoice.buyer_name && <p className="text-sm text-gray-600 mt-1">المشتري: <span className="font-bold text-black">{invoice.buyer_name}</span></p>}
            </div>
            {(invoice.party_phone || invoice.party_address) && (
              <div className="text-left text-sm text-gray-600 border-r border-gray-300 pr-6">
                {invoice.party_phone && <p>هاتف: <span className="font-bold text-black" dir="ltr">{invoice.party_phone}</span></p>}
                {invoice.party_address && <p>العنوان: <span className="font-bold text-black">{invoice.party_address}</span></p>}
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr style={templateStyle === 'modern' && templateType === 'internal' ? { backgroundColor: primaryColor, color: 'white' } : { backgroundColor: '#f3f4f6', color: 'black' }}>
              <th className="border border-gray-300 p-2 text-right">الصنف</th>
              <th className="border border-gray-300 p-2 text-center w-24">الكمية</th>
              <th className="border border-gray-300 p-2 text-center w-32">السعر</th>
              <th className="border border-gray-300 p-2 text-center w-32">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-gray-300 p-2">{item.product_name || item.name}</td>
                <td className="border border-gray-300 p-2 text-center">{Number(item.quantity).toLocaleString()}</td>
                <td className="border border-gray-300 p-2 text-center">{Number(item.unit_price).toLocaleString()}</td>
                <td className="border border-gray-300 p-2 text-center">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 border border-gray-300 rounded-lg overflow-hidden">
            <div className="flex justify-between p-2 border-b border-gray-200">
              <span>المجموع الفرعي:</span>
              <span>{Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-2 border-b border-gray-200">
              <span>الضريبة:</span>
              <span>{Number(invoice.tax_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-100 font-bold text-lg">
              <span>الإجمالي:</span>
              <span>{Number(invoice.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {templateType === 'internal' && footerText && (
          <div className="mt-8 text-center text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {footerText}
          </div>
        )}

        {templateType === 'internal' && (
          <div className="mt-16 pt-8 flex justify-between text-sm text-gray-500" style={{ borderTop: `2px solid ${primaryColor}30` }}>
            <div>توقيع المستلم: ___________________</div>
            <div>الختم:</div>
          </div>
        )}
      </div>

      {templateType === 'external' && footerImage && (
        <img src={footerImage as string} alt="Footer" className="w-full object-contain mt-auto" />
      )}
    </div>
  );
};

export default PrintTemplate;
