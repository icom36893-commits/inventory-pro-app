export const defaultSalesPosTemplate = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 6mm; width: 80mm; background-color: #ffffff; color: #000000; line-height: 1.6; box-sizing: border-box;">
  <!-- Header with Logo -->
  <div style="text-align: center; margin-bottom: 5mm; padding-bottom: 5mm; border-bottom: 2px solid #000000;">
    {{pos_logo_img}}
    <h1 style="margin: 3mm 0 1mm; font-size: 16px; font-weight: 800; color: #000000; letter-spacing: 0.5px;">{{company_name}}</h1>
    {{#if company_address}}
      <p style="margin: 1mm 0; font-size: 10px; color: #000000;">{{company_address}}</p>
    {{/if}}
    {{#if company_phone}}
      <p style="margin: 1mm 0; font-size: 10px; color: #000000;">هاتف: <span dir="ltr">{{company_phone}}</span></p>
    {{/if}}
    {{tax_number_html}}
  </div>

  <!-- Invoice Info -->
  <div style="margin-bottom: 4mm; padding: 3mm; background-color: #ffffff; border-radius: 0px; border: 1px solid #000000;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm;">
      <span style="font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">فاتورة مبيعات</span>
      <span style="font-size: 14px; font-weight: 800; color: #000000;">{{invoice_number}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #000000;">
      <span>التاريخ والوقت:</span>
      <span dir="ltr">{{date}}</span>
    </div>
  </div>

  <!-- Party Info -->
  <div style="margin-bottom: 4mm;">
    <p style="font-weight: 700; margin: 0 0 1mm; font-size: 11px; color: #000000;">العميل:</p>
    <p style="margin: 0; font-size: 11px; color: #000000;">{{party_name}}</p>
    {{#if party_phone}}
      <p style="margin: 1mm 0 0; font-size: 10px; color: #000000;" dir="ltr">هاتف: {{party_phone}}</p>
    {{/if}}
  </div>

  <!-- Items Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
    <thead>
      <tr style="border-bottom: 2px solid #000000;">
        <th style="text-align: right; padding: 2mm 0; font-size: 10px; font-weight: 800; color: #000000;">الصنف</th>
        <th style="text-align: center; padding: 2mm 0; font-size: 10px; font-weight: 800; color: #000000;">الكمية</th>
        <th style="text-align: center; padding: 2mm 0; font-size: 10px; font-weight: 800; color: #000000;">السعر</th>
        <th style="text-align: center; padding: 2mm 0; font-size: 10px; font-weight: 800; color: #000000;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      {{items_table_rows}}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="border-top: 2px dashed #000000; padding-top: 4mm; margin-bottom: 4mm;">
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 11px; color: #000000;">
      <span>طريقة الدفع:</span>
      <span style="font-weight: 600;">{{payment_method}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 11px; color: #000000;">
      <span>العملة:</span>
      <span style="font-weight: 600;">{{currency_name}}</span>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 11px; color: #000000; margin-top: 3mm; border-top: 1px dashed #000; padding-top: 2mm;">
      <span>المجموع الفرعي:</span>
      <span style="font-weight: 600;">{{subtotal}}</span>
    </div>
    
    {{#if discount_amount}}
    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 11px; color: #000000;">
      <span>مبلغ الخصم:</span>
      <span style="font-weight: 600;">{{discount_amount}}</span>
    </div>
    {{/if}}

    {{#if expenses_total}}
    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm; font-size: 11px; color: #000000;">
      <span>مصاريف اضافية:</span>
      <span style="font-weight: 600;">{{expenses_total}}</span>
    </div>
    {{/if}}

    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; color: #000000; margin-bottom: 2mm; margin-top: 2mm; border-top: 1px dashed #000; padding-top: 2mm;">
      <span>الإجمالي الكل:</span>
      <span>{{total}}</span>
    </div>

    {{#if paid_amount}}
      <div style="display: flex; justify-content: space-between; margin-top: 3mm; font-size: 11px; color: #000000;">
        <span>المبلغ المسدد:</span>
        <span style="font-weight: 700;">{{paid_amount}}</span>
      </div>
    {{/if}}
    {{#if remaining_amount}}
      <div style="display: flex; justify-content: space-between; margin-top: 2mm; font-size: 11px; font-weight: 700; color: #000000;">
        <span>المتبقي:</span>
        <span>{{remaining_amount}}</span>
      </div>
    {{/if}}
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding-top: 5mm; border-top: 2px solid #000000;">
    <p style="margin: 0 0 2mm; font-size: 11px; font-weight: 700; color: #000000; letter-spacing: 0.5px;">شكراً لثقتكم بنا!</p>
    <p style="margin: 0; font-size: 10px; color: #000000;">{{current_timestamp}}</p>
  </div>
</div>
`;
