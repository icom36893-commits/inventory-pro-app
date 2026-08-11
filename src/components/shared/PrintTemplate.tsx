import React from 'react';
import { useSettingsStore } from '../../store';
import { defaultSalesPosTemplate } from '../../templates/defaultSalesPos';
import { defaultPurchasePosTemplate } from '../../templates/defaultPurchasePos';
import { formatCurrency } from '../../utils/currency';

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
  const posCustomHtml = settings?.[`${prefix}_pos_custom_html`] || '';

  const paymentMethods: Record<string, string> = {
    cash: 'نقدي',
    credit: 'آجل',
    partial: 'جزئي',
    bank: 'تحويل بنكي',
    card: 'بطاقة'
  };
  const translatedPaymentMethod = invoice.payment_method ? paymentMethods[invoice.payment_method] || invoice.payment_method : (Number(invoice.remaining_amount) > 0 ? 'آجل' : 'نقدي');

  const currencyCode = invoice.currency || settings?.currency || 'IQD';
  const currencyName = currencyCode === 'USD' ? 'دولار أمريكي' : 'دينار عراقي';

  const expensesTotal = invoice.additional_expenses?.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0) || 0;

  if (templateType === 'pos') {
    const logoSize = settings?.[`${prefix}_logo_size`] || 100; // Slightly smaller for POS but bigger than 40px
    const itemsRows = invoice.items?.map((item: any) => `
      <tr style="border-bottom: 1px solid #000000;">
        <td style="padding: 2mm 0; text-align: right; font-size: 10px; color: #000000;">${item.product_name || item.name}</td>
        <td style="padding: 2mm 0; text-align: center; font-size: 10px; color: #000000;">${Number(item.quantity).toLocaleString()}</td>
        <td style="padding: 2mm 0; text-align: center; font-size: 10px; color: #000000;">${formatCurrency(Number(item.unit_price), currencyCode as any)}</td>
        <td style="padding: 2mm 0; text-align: center; font-size: 10px; font-weight: 700; color: #000000;">${formatCurrency(Number(item.total), currencyCode as any)}</td>
      </tr>
    `).join('') || '';

    const posLogoImg = showLogo && settings?.logo
      ? `<div style="width: ${logoSize}px; height: ${logoSize}px; border: 2px solid #000; border-radius: 50%; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;"><img src="${settings.logo}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
      : '';

    const currentTimestamp = new Date().toLocaleString('ar-IQ');
    const taxRate = settings?.tax_rate || 15;

    // Get base template
    let parsedHtml = posCustomHtml || (isSales ? defaultSalesPosTemplate : defaultPurchasePosTemplate);
    
    // Process {{#if ...}} ... {{/if}} conditionals
    const processConditional = (variableName: string, hasValue: boolean) => {
      const regex = new RegExp(`\\{\\{#if ${variableName}\\}\\}(.*?)\\{\\{/if\\}\\}`, 'gs');
      parsedHtml = parsedHtml.replace(regex, hasValue ? '$1' : '');
    };
    
    processConditional('company_address', !!companyAddress);
    processConditional('company_phone', !!phone);
    processConditional('tax_amount', Number(invoice.tax_amount || 0) > 0);
    processConditional('expenses_total', expensesTotal > 0);
    processConditional('discount_amount', Number(invoice.discount_amount || 0) > 0);
    processConditional('paid_amount', Number(invoice.paid_amount || 0) > 0);
    processConditional('remaining_amount', Number(invoice.remaining_amount || 0) > 0);
    processConditional('party_phone', !!invoice.party_phone);
    
    // Replace all variables
    parsedHtml = parsedHtml
      .replaceAll('{{company_name}}', companyName)
      .replaceAll('{{company_address}}', companyAddress)
      .replaceAll('{{company_phone}}', phone)
      .replaceAll('{{tax_number_html}}', taxNumber ? `<p style="margin: 1mm 0; font-size: 10px;">الرقم الضريبي: ${taxNumber}</p>` : '')
      .replaceAll('{{pos_logo_img}}', posLogoImg)
      .replaceAll('{{invoice_number}}', invoice.invoice_number)
      .replaceAll('{{date}}', invoice.date)
      .replaceAll('{{party_name}}', invoice.party_name || 'نقدي')
      .replaceAll('{{party_phone}}', invoice.party_phone || '')
      .replaceAll('{{subtotal}}', formatCurrency(Number(invoice.subtotal || 0), currencyCode as any))
      .replaceAll('{{discount_amount}}', formatCurrency(Number(invoice.discount_amount || 0), currencyCode as any))
      .replaceAll('{{expenses_total}}', formatCurrency(expensesTotal, currencyCode as any))
      .replaceAll('{{tax_amount}}', formatCurrency(Number(invoice.tax_amount || 0), currencyCode as any))
      .replaceAll('{{tax_rate}}', String(taxRate))
      .replaceAll('{{total}}', formatCurrency(Number(invoice.total || 0), currencyCode as any))
      .replaceAll('{{paid_amount}}', formatCurrency(Number(invoice.paid_amount || 0), currencyCode as any))
      .replaceAll('{{remaining_amount}}', formatCurrency(Number(invoice.remaining_amount || 0), currencyCode as any))
      .replaceAll('{{payment_method}}', translatedPaymentMethod)
      .replaceAll('{{currency_name}}', currencyName)
      .replaceAll('{{items_table_rows}}', itemsRows)
      .replaceAll('{{current_timestamp}}', currentTimestamp);

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }


  const templateStyle = settings?.print_template_style || 'modern';
  const footerText = settings?.[`${prefix}_footer_text`] || settings?.print_footer_text || '';
  const headerImage = settings?.[`${prefix}_header_image`];
  const footerImage = settings?.[`${prefix}_footer_image`];
  const customHtml = settings?.[`${prefix}_custom_html`] || '';
  const logoSize = settings?.[`${prefix}_logo_size`] || 120;

  if (templateType === 'custom' && customHtml) {
    const itemsRows = invoice.items?.map((item: any) => `
      <tr style="background-color: #fff; color: #000;">
        <td style="border: 1px solid #000; padding: 8px;">${item.product_name || item.name}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${Number(item.quantity).toLocaleString()}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatCurrency(Number(item.unit_price), currencyCode as any)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatCurrency(Number(item.total), currencyCode as any)}</td>
      </tr>
    `).join('') || '';

    const expensesHtml = expensesTotal > 0 
      ? `<div style="display: flex; justify-content: space-between; padding: 8px; font-size: 14px;"><span style="color: #000;">مصاريف اضافية:</span><span style="color: #000;">${formatCurrency(expensesTotal, currencyCode as any)}</span></div>` 
      : '';

    const discountAmount = Number(invoice.discount_amount || 0);
    const discountHtml = discountAmount > 0 
      ? `<div style="display: flex; justify-content: space-between; padding: 8px; font-size: 14px;"><span style="color: #000;">مبلغ الخصم:</span><span style="color: #000;">${formatCurrency(discountAmount, currencyCode as any)}</span></div>` 
      : '';

    const parsedHtml = customHtml
      .replaceAll('{{company_name}}', companyName)
      .replaceAll('{{company_address}}', companyAddress)
      .replaceAll('{{company_phone}}', phone)
      .replaceAll('{{tax_number_html}}', taxNumber ? `<p style="margin: 5px 0 0; color: #000; font-size: 14px;">الرقم الضريبي: ${taxNumber}</p>` : '')
      .replaceAll('{{logo_img}}', showLogo && settings?.logo ? `<img src="${settings.logo}" style="height: ${logoSize}px; object-fit: contain;" />` : '')
      .replaceAll('{{invoice_type_label}}', invoice.type === 'sale' ? 'فاتورة مبيعات' : invoice.type === 'purchase' ? 'فاتورة مشتريات' : invoice.type === 'sale_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات')
      .replaceAll('{{invoice_number}}', invoice.invoice_number)
      .replaceAll('{{date}}', invoice.date)
      .replaceAll('{{party_title}}', isSales ? 'بيانات العميل' : 'بيانات المورد')
      .replaceAll('{{party_name}}', invoice.party_name || 'نقدي / عميل عام')
      .replaceAll('{{buyer_name_html}}', invoice.buyer_name ? `<span style="font-size: 14px; margin-top: 4px;">(المشتري: <span style="font-weight: bold;">${invoice.buyer_name}</span>)</span>` : '')
      .replaceAll('{{party_contact_html}}', (invoice.party_phone || invoice.party_address) ? `<div style="display: flex; align-items: center; gap: 16px; font-size: 14px;"><span style="font-weight: bold; color: #000;">|</span>${invoice.party_phone ? `<span>هاتف: <span style="font-weight: bold;" dir="ltr">${invoice.party_phone}</span></span>` : ''}${invoice.party_phone && invoice.party_address ? `<span style="font-weight: bold; color: #000;">|</span>` : ''}${invoice.party_address ? `<span>العنوان: <span style="font-weight: bold;">${invoice.party_address}</span></span>` : ''}</div>` : '')
      .replaceAll('{{subtotal}}', formatCurrency(Number(invoice.subtotal || 0), currencyCode as any))
      .replaceAll('{{discount_html}}', discountHtml)
      .replaceAll('{{expenses_html}}', expensesHtml)
      .replaceAll('{{tax_amount}}', formatCurrency(Number(invoice.tax_amount || 0), currencyCode as any))
      .replaceAll('{{total}}', formatCurrency(Number(invoice.total || 0), currencyCode as any))
      .replaceAll('{{paid_amount_html}}', `<div style="display: flex; justify-content: space-between; padding: 8px; border-top: 1px solid #000; font-size: 14px;"><span style="color: #000;">المبلغ المدفوع:</span><span style="color: #000;">${formatCurrency(Number(invoice.paid_amount || 0), currencyCode as any)}</span></div>`)
      .replaceAll('{{remaining_amount_html}}', `<div style="display: flex; justify-content: space-between; padding: 8px; border-top: 1px solid #000; font-size: 14px; font-weight: bold;"><span style="color: #000;">المتبقي:</span><span style="color: #000;">${formatCurrency(Number(invoice.remaining_amount || 0), currencyCode as any)}</span></div>`)
      .replaceAll('{{items_table_rows}}', itemsRows)
      .replaceAll('{{payment_method_html}}', `<div style="display: flex; align-items: center; gap: 12px; font-size: 14px;"><span style="font-weight: bold;">طريقة الدفع:</span> <span>${translatedPaymentMethod}</span><span style="font-weight: bold; color: #000;">|</span><span style="font-weight: bold;">العملة:</span> <span>${currencyName}</span></div>`)
      .replaceAll('{{notes_html}}', invoice.notes ? `<div style="margin-top: 24px; padding: 12px; display: flex; align-items: flex-start; border: 2px solid #000; background-color: #fff; color: #000; font-size: 14px;"><span style="font-weight: bold; white-space: nowrap;">ملاحظات:</span><span style="margin: 0 8px; font-weight: bold;">|</span><span>${invoice.notes}</span></div>` : '')
      .replaceAll('{{footer_text_html}}', footerText ? `<div style="margin-top: 16px; text-align: center; font-size: 14px; font-weight: bold; padding: 12px; border: 1px solid #000; color: #000;">${footerText}</div>` : '');

    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
  }

  return (
    <div className={`bg-white text-black font-cairo flex flex-col ${templateType === 'external' ? 'min-h-[1056px]' : 'p-4'}`} dir="rtl">
      {templateType === 'external' && headerImage && (
        <img src={headerImage as string} alt="Header" className="w-full object-contain" style={{ height: `${logoSize}px` }} />
      )}
      
      <div className={`flex-1 flex flex-col ${templateType === 'external' ? 'p-4' : ''}`}>
        {templateType === 'internal' ? (
          <div 
            className={`flex justify-between items-start pb-4 mb-4 ${templateStyle === 'modern' ? 'border-b-4' : 'border-b-2'}`}
            style={{ borderColor: '#000000' }}
          >
            <div className="flex items-center gap-4">
              {showLogo && settings?.logo && (
                <img src={settings.logo as string} alt="Logo" className="object-contain" style={{ height: `${logoSize}px` }} />
              )}
              <div>
                <h1 className="text-xl font-bold mb-1" style={{ color: '#000' }}>{companyName}</h1>
                <p className="text-sm" style={{ color: '#000' }}>{companyAddress}</p>
                <p className="text-sm" style={{ color: '#000' }}>هاتف: {phone}</p>
                {taxNumber && <p className="text-sm" style={{ color: '#000' }}>الرقم الضريبي: {taxNumber}</p>}
              </div>
            </div>
            <div 
              className="text-left p-3 min-w-[200px]"
              style={{ border: '2px solid #000', backgroundColor: '#fff' }}
            >
              <h2 
                className="text-lg font-bold mb-2 border-b pb-2"
                style={{ color: '#000', borderColor: '#000' }}
              >
                {invoice.type === 'sale' ? 'فاتورة مبيعات' : 
                 invoice.type === 'purchase' ? 'فاتورة مشتريات' : 
                 invoice.type === 'sale_return' ? 'مردودات مبيعات' : 'مردودات مشتريات'}
              </h2>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: '#000' }}>رقم الفاتورة:</span>
                <span className="font-bold" style={{ color: '#000' }}>{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#000' }}>التاريخ:</span>
                <span className="font-bold" style={{ color: '#000' }}>{invoice.date}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-4">
             <div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#000' }}>
                  {invoice.type === 'sale' ? 'فاتورة مبيعات' : 
                   invoice.type === 'purchase' ? 'فاتورة مشتريات' : 
                   invoice.type === 'sale_return' ? 'مردودات مبيعات' : 'مردودات مشتريات'}
                </h2>
                <p className="text-sm" style={{ color: '#000' }}>رقم الفاتورة: <span className="font-bold text-black">{invoice.invoice_number}</span></p>
                <p className="text-sm" style={{ color: '#000' }}>التاريخ: <span className="font-bold text-black">{invoice.date}</span></p>
             </div>
             <div className="text-left p-4 border border-black min-w-[250px]">
                <h3 className="font-bold text-sm mb-2" style={{ color: '#000' }}>بيانات {isSales ? 'العميل' : 'المورد'}:</h3>
                <p className="font-bold text-lg" style={{ color: '#000' }}>{invoice.party_name || 'نقدي / عام'}</p>
                {invoice.buyer_name && <p className="text-sm mt-1" style={{ color: '#000' }}>المشتري: <span className="font-bold text-black">{invoice.buyer_name}</span></p>}
                {invoice.party_phone && <p dir="ltr" className="text-sm mt-1" style={{ color: '#000' }}>{invoice.party_phone}</p>}
             </div>
          </div>
        )}

        {templateType === 'internal' && (
          <div 
            className="mb-6 p-3 flex justify-between items-center"
            style={{ border: '2px solid #000', backgroundColor: '#fff', color: '#000' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold mb-1">{isSales ? 'بيانات العميل' : 'بيانات المورد'}</span>
                <span className="font-bold text-lg">{invoice.party_name || 'نقدي / عميل عام'}</span>
                {invoice.buyer_name && <span className="text-sm mt-1">(المشتري: {invoice.buyer_name})</span>}
              </div>
              
              {(invoice.party_phone || invoice.party_address) && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-black" style={{ fontSize: '1.2rem', lineHeight: 1 }}>|</span>
                  {invoice.party_phone && <span>هاتف: <span className="font-bold" dir="ltr">{invoice.party_phone}</span></span>}
                  
                  {invoice.party_phone && invoice.party_address && <span className="font-bold text-black" style={{ fontSize: '1.2rem', lineHeight: 1 }}>|</span>}
                  {invoice.party_address && <span>العنوان: <span className="font-bold">{invoice.party_address}</span></span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
               <span className="font-bold">طريقة الدفع:</span>
               <span>{translatedPaymentMethod}</span>
               <span className="font-bold text-black" style={{ fontSize: '1.2rem', lineHeight: 1 }}>|</span>
               <span className="font-bold">العملة:</span>
               <span>{currencyName}</span>
            </div>
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#fff', color: '#000', borderBottom: '2px solid #000' }}>
              <th className="border border-black p-2 text-right">الصنف</th>
              <th className="border border-black p-2 text-center w-24">الكمية</th>
              <th className="border border-black p-2 text-center w-32">السعر</th>
              <th className="border border-black p-2 text-center w-32">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-black p-2">{item.product_name || item.name}</td>
                <td className="border border-black p-2 text-center">{Number(item.quantity).toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{formatCurrency(Number(item.unit_price), currencyCode as any)}</td>
                <td className="border border-black p-2 text-center">{formatCurrency(Number(item.total), currencyCode as any)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        {/* Totals and Notes Wrapper */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-1/2 text-sm pr-2">
          </div>

          <div className="w-64 border border-black overflow-hidden">
            <div className="flex justify-between p-2 font-bold text-base" style={{ borderBottom: '2px solid #000' }}>
              <span style={{ color: '#000' }}>الإجمالي:</span>
              <span style={{ color: '#000' }}>{formatCurrency(Number(invoice.total || 0), currencyCode as any)}</span>
            </div>
            {Number(invoice.discount_amount || 0) > 0 && (
              <div className="flex justify-between p-2 text-sm border-b border-black">
                <span style={{ color: '#000' }}>مبلغ الخصم:</span>
                <span style={{ color: '#000' }}>{formatCurrency(Number(invoice.discount_amount || 0), currencyCode as any)}</span>
              </div>
            )}
            {expensesTotal > 0 && (
              <div className="flex justify-between p-2 text-sm border-b border-black">
                <span style={{ color: '#000' }}>مصاريف اضافية:</span>
                <span style={{ color: '#000' }}>{formatCurrency(expensesTotal, currencyCode as any)}</span>
              </div>
            )}
            {Number(invoice.paid_amount || 0) > 0 && (
              <div className="flex justify-between p-2 border-t border-black text-sm">
                <span style={{ color: '#000' }}>المبلغ المدفوع:</span>
                <span style={{ color: '#000' }}>{formatCurrency(Number(invoice.paid_amount || 0), currencyCode as any)}</span>
              </div>
            )}
            {Number(invoice.remaining_amount || 0) > 0 && (
              <div className="flex justify-between p-2 border-t border-black text-sm font-bold">
                <span style={{ color: '#000' }}>المتبقي:</span>
                <span style={{ color: '#000' }}>{formatCurrency(Number(invoice.remaining_amount || 0), currencyCode as any)}</span>
              </div>
            )}
          </div>
        </div>

        {templateType === 'internal' && invoice.notes && (
          <div 
            className="mt-6 p-3 flex items-start text-sm"
            style={{ border: '2px solid #000', backgroundColor: '#fff', color: '#000' }}
          >
            <span className="font-bold whitespace-nowrap">ملاحظات :</span>
            <span className="mx-2 font-bold" style={{ fontSize: '1.2rem', lineHeight: 1 }}>|</span>
            <span>{invoice.notes}</span>
          </div>
        )}

        {templateType === 'internal' && footerText && (
          <div className="mt-4 text-center text-sm font-bold p-3 border border-black" style={{ color: '#000' }}>
            {footerText}
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
