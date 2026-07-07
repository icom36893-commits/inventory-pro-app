export const defaultReportTemplate = `
<div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; background-color: #ffffff; color: #333; line-height: 1.6;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #334155; padding-bottom: 15px; margin-bottom: 30px;">
    <div style="display: flex; align-items: center; gap: 20px;">
      {{logo_img}}
      <div>
        <h1 style="margin: 0; font-size: 24px; color: #334155; font-weight: bold;">{{company_name}}</h1>
      </div>
    </div>
    <div style="text-align: left;">
      <h2 style="margin: 0 0 5px; font-size: 24px; color: #334155; font-weight: bold;">{{report_title}}</h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">تاريخ التقرير: {{date}}</p>
    </div>
  </div>

  <!-- Content Placeholder -->
  <div style="min-height: 400px;">
    {{report_content}}
  </div>

  <!-- Footer -->
  {{footer_text_html}}
  
  <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px;">
    <div>طبع بواسطة: نظام المخزون برو</div>
    <div>صفحة 1 من 1</div>
  </div>
</div>
`;
