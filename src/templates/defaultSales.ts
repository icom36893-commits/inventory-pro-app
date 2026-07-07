export const defaultSalesTemplate = `
<div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; background-color: #ffffff; color: #333; line-height: 1.6;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #1E40AF; padding-bottom: 20px; margin-bottom: 30px;">
    <div style="display: flex; align-items: center; gap: 20px;">
      {{logo_img}}
      <div>
        <h1 style="margin: 0; font-size: 28px; color: #1E40AF; font-weight: bold;">{{company_name}}</h1>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">{{company_address}}</p>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">هاتف: <span dir="ltr">{{company_phone}}</span></p>
        {{tax_number_html}}
      </div>
    </div>
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; min-width: 250px;">
      <h2 style="margin: 0 0 15px; font-size: 22px; color: #1E40AF; font-weight: bold; border-bottom: 2px solid #bfdbfe; padding-bottom: 10px;">{{invoice_type_label}}</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b; font-size: 14px;">رقم الفاتورة:</span>
        <span style="font-weight: bold;">{{invoice_number}}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b; font-size: 14px;">التاريخ:</span>
        <span style="font-weight: bold;">{{date}}</span>
      </div>
    </div>
  </div>

  <!-- Party Info -->
  <div style="background-color: #f8fafc; border-right: 4px solid #1E40AF; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between;">
    <div>
      <p style="margin: 0 0 5px; color: #64748b; font-size: 12px; font-weight: bold;">{{party_title}}</p>
      <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #334155;">{{party_name}}</h3>
    </div>
    {{party_contact_html}}
  </div>

  <!-- Items Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <thead>
      <tr style="background-color: #1E40AF; color: #ffffff;">
        <th style="padding: 12px; text-align: right; border: 1px solid #1e3a8a;">الصنف</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a; width: 100px;">الكمية</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a; width: 120px;">السعر</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #1e3a8a; width: 120px;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      {{items_table_rows}}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
    <div style="width: 300px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="display: flex; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; background-color: #fff;">
        <span style="color: #64748b;">المجموع الفرعي:</span>
        <span style="font-weight: bold;">{{subtotal}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; background-color: #fff;">
        <span style="color: #64748b;">الضريبة المضافة:</span>
        <span style="font-weight: bold;">{{tax_amount}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 15px; background-color: #eff6ff;">
        <span style="font-size: 18px; font-weight: bold; color: #1E40AF;">الإجمالي المستحق:</span>
        <span style="font-size: 18px; font-weight: bold; color: #1E40AF;">{{total}}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  {{footer_text_html}}
  
  <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 14px;">
    <div>توقيع المستلم: ______________________</div>
    <div>الختم: ______________________</div>
  </div>
</div>
`;
