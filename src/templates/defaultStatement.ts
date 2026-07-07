export const defaultStatementTemplate = `
<div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; background-color: #ffffff; color: #1f2937; line-height: 1.5; font-size: 14px;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: flex; align-items: center; gap: 20px;">
        {{logo_img}}
        <div>
          <h1 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 700; color: #111827;">{{company_name}}</h1>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">{{company_address}}</p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">هاتف: <span dir="ltr">{{company_phone}}</span></p>
        </div>
      </div>
      
      <!-- Customer Card -->
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; width: fit-content; min-width: 250px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">حساب {{party_type_label}}:</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">{{party_name}}</p>
      </div>
    </div>
    
    <div style="text-align: left;">
      <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #111827;">كشف حساب</h2>
      <table style="width: auto; margin-left: auto; margin-bottom: 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 16px 4px 0; border: none; color: #6b7280; text-align: right;">تاريخ الإصدار:</td>
          <td style="padding: 4px 0; border: none; font-weight: 700; text-align: right;">{{statement_date}}</td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; border: none; color: #6b7280; text-align: right;">الفترة:</td>
          <td style="padding: 4px 0; border: none; font-weight: 700; text-align: right;" dir="ltr">{{statement_period}}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Transactions Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="padding: 12px 8px; text-align: right; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">التاريخ</th>
        <th style="padding: 12px 8px; text-align: right; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">نوع الحركة</th>
        <th style="padding: 12px 8px; text-align: center; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">رقم المرجع</th>
        <th style="padding: 12px 8px; text-align: left; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">مدين <span dir="ltr">({{currency}})</span></th>
        <th style="padding: 12px 8px; text-align: left; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">دائن <span dir="ltr">({{currency}})</span></th>
        <th style="padding: 12px 8px; text-align: left; border: 1px solid #d1d5db; color: #374151; font-weight: 700; font-size: 14px;">الرصيد <span dir="ltr">({{currency}})</span></th>
      </tr>
    </thead>
    <tbody>
      {{transactions_table_rows}}
    </tbody>
  </table>

  <!-- Totals Summary -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; gap: 20px;">
    <!-- بطاقات اليمين -->
    <div style="display: flex; gap: 20px;">
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-width: 150px;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">إجمالي المدين (عليه):</p>
        <p style="margin: 0; font-weight: 700; font-size: 18px; color: #111827;">{{total_debit}}</p>
      </div>
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-width: 150px;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">إجمالي الدائن (له):</p>
        <p style="margin: 0; font-weight: 700; font-size: 18px; color: #111827;">{{total_credit}}</p>
      </div>
    </div>
    
    <!-- بطاقة اليسار -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; min-width: 200px; text-align: left;">
      <p style="margin: 0 0 8px 0; color: #ef4444; font-size: 14px; font-weight: 700;">الرصيد النهائي:</p>
      <p style="margin: 0; font-weight: 700; font-size: 24px; color: #dc2626;">{{final_balance}}</p>
    </div>
  </div>

  <!-- Footer -->
  {{footer_text_html}}
</div>
`;
