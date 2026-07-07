export const defaultTreasuryTemplate = `
<div style="font-family: 'Cairo', sans-serif; padding: 40px; background-color: white; color: #1e293b; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;" dir="rtl">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px;">
    <div style="display: flex; align-items: center; gap: 20px;">
      {{logo_img}}
      <div>
        <h1 style="margin: 0 0 5px; font-size: 28px; color: #1e293b; font-weight: 800;">{{company_name}}</h1>
        <p style="margin: 0; color: #64748b; font-size: 14px;">{{company_address}}</p>
        <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">هاتف: {{company_phone}}</p>
        {{tax_number_html}}
      </div>
    </div>
    <div style="text-align: left; background-color: #f8fafc; padding: 15px 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 10px; font-size: 24px; color: #0f172a; font-weight: 800;">{{receipt_type_label}}</h2>
      <p style="margin: 0 0 5px; color: #64748b; font-size: 14px;">رقم السند: <strong style="color: #0f172a;">{{receipt_number}}</strong></p>
      <p style="margin: 0; color: #64748b; font-size: 14px;">التاريخ: <strong style="color: #0f172a;">{{date}}</strong></p>
    </div>
  </div>

  <!-- Amount Area -->
  <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
    <p style="margin: 0 0 5px; color: #64748b; font-size: 16px; font-weight: bold;">مبلغ وقدره</p>
    <h2 style="margin: 0; font-size: 32px; color: #0f172a; font-weight: 900;">{{amount}}</h2>
  </div>

  <!-- Details Area -->
  <div style="margin-bottom: 40px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; width: 25%; color: #64748b; font-weight: bold;">الطرف الثاني:</td>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 16px; font-weight: 700;">{{party_name}}</td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">التصنيف:</td>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 16px;">{{category}}</td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">الوصف / البيان:</td>
          <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 16px; line-height: 1.6;">{{description}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Signatures -->
  <div style="display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <div style="text-align: center; width: 200px;">
      <p style="margin: 0 0 40px; color: #64748b; font-weight: bold;">توقيع المستلم</p>
      <div style="border-bottom: 1px solid #94a3b8;"></div>
    </div>
    <div style="text-align: center; width: 200px;">
      <p style="margin: 0 0 40px; color: #64748b; font-weight: bold;">توقيع المحاسب / الختم</p>
      <div style="border-bottom: 1px solid #94a3b8;"></div>
    </div>
  </div>
</div>
`;
