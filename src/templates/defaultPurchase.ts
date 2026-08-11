export const defaultPurchaseTemplate = `
<div style="background-color: #fff; color: #000; font-family: 'Cairo', sans-serif; display: flex; flex-direction: column; padding: 16px; direction: rtl; min-height: 100%;">
  
  <div style="display: flex; flex-direction: column; flex: 1;">
    
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 2px solid #000;">
      <div style="display: flex; align-items: center; gap: 16px;">
        {{logo_img}}
        <div>
          <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 4px; color: #000;">{{company_name}}</h1>
          <p style="font-size: 14px; margin: 0; color: #000;">{{company_address}}</p>
          <p style="font-size: 14px; margin: 0; color: #000;">هاتف: <span dir="ltr">{{company_phone}}</span></p>
          {{tax_number_html}}
        </div>
      </div>
      <div style="text-align: left; padding: 12px; min-width: 200px; border: 2px solid #000; background-color: #fff;">
        <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 8px; border-bottom: 1px solid #000; padding-bottom: 8px; color: #000;">
          {{invoice_type_label}}
        </h2>
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
          <span style="color: #000;">رقم الفاتورة:</span>
          <span style="font-weight: bold; color: #000;">{{invoice_number}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px;">
          <span style="color: #000;">التاريخ:</span>
          <span style="font-weight: bold; color: #000;">{{date}}</span>
        </div>
      </div>
    </div>

    <!-- Party Info -->
    <div style="margin-bottom: 24px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; background-color: #fff; color: #000;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="display: flex; flex-direction: column; text-align: right;">
          <span style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">{{party_title}}</span>
          <span style="font-size: 18px; font-weight: bold;">{{party_name}}</span>
          {{buyer_name_html}}
        </div>
        {{party_contact_html}}
      </div>
      {{payment_method_html}}
    </div>

    <!-- Items Table -->
    <table style="width: 100%; margin-bottom: 32px; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #fff; color: #000; border-bottom: 2px solid #000;">
          <th style="border: 1px solid #000; padding: 8px; text-align: right;">الصنف</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 96px;">الكمية</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 128px;">السعر</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 128px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals Wrapper -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div style="width: 50%; padding-right: 8px;">
      </div>
      
      <div style="width: 256px; border: 1px solid #000; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; padding: 8px; font-size: 14px;">
          <span style="color: #000;">المجموع الفرعي:</span>
          <span style="color: #000;">{{subtotal}}</span>
        </div>
        {{discount_html}}
        {{expenses_html}}
        <div style="display: flex; justify-content: space-between; padding: 8px; border-top: 2px solid #000; font-weight: bold; font-size: 16px;">
          <span style="color: #000;">الإجمالي:</span>
          <span style="color: #000;">{{total}}</span>
        </div>
        {{paid_amount_html}}
        {{remaining_amount_html}}
      </div>
    </div>

    {{notes_html}}

    {{footer_text_html}}


    
  </div>
</div>
`;
