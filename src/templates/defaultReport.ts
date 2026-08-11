export const defaultReportTemplate = `
<style>
  @page { size: A4 landscape; margin: 10mm; }
  /* Force table styling to match invoice custom HTML */
  .print-area-view table { width: 100%; border-collapse: collapse !important; margin-bottom: 0; }
  .print-area-view th, .print-area-view td { border: 1px solid #000 !important; padding: 8px !important; color: #000 !important; background-color: transparent !important; }
  .print-area-view th { background-color: #fff !important; font-weight: bold; border-bottom: 2px solid #000 !important; }
  
  /* Override arbitrary tailwind classes for pure black and white */
  .print-area-view .bg-bg-main { background-color: transparent !important; border: 1px solid #000 !important; }
  .print-area-view .bg-white { background-color: transparent !important; }
  .print-area-view .border-border { border-color: #000 !important; }
  .print-area-view .text-text-muted { color: #000 !important; font-weight: bold !important; }
  .print-area-view .text-primary, .print-area-view .text-success, .print-area-view .text-danger { color: #000 !important; }
  .print-area-view .border-success\\/20, .print-area-view .border-danger\\/20, .print-area-view .border-primary\\/20 { border-color: #000 !important; }
  .print-area-view .shadow-sm, .print-area-view .shadow-md, .print-area-view .shadow-lg { box-shadow: none !important; border: 1px solid #000 !important; }
  .print-area-view .bg-success, .print-area-view .bg-danger, .print-area-view .bg-primary { background-color: transparent !important; border: 1px solid #000 !important; color: #000 !important; }
</style>

<!-- Header -->
<div style="background-color: #fff; color: #000; font-family: 'Cairo', sans-serif; direction: rtl; display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 24px; border-bottom: 2px solid #000;">
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
      {{report_title}}
    </h2>
    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
      <span style="color: #000;">من تاريخ:</span>
      <span style="font-weight: bold; color: #000;">{{start_date}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 14px;">
      <span style="color: #000;">إلى تاريخ:</span>
      <span style="font-weight: bold; color: #000;">{{end_date}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px;">
      <span style="color: #000;">تاريخ الطباعة:</span>
      <span style="font-weight: bold; color: #000;">{{date}}</span>
    </div>
  </div>
</div>

{{report_content}}

<!-- Footer -->
<div style="background-color: #fff; color: #000; font-family: 'Cairo', sans-serif; direction: rtl;">
  {{footer_text_html}}
</div>
`;
