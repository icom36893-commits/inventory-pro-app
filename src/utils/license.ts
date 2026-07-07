export type ActivationType = '14_days' | '1_month' | '1_year' | 'lifetime';

export interface VerifyLicenseResult {
  valid: boolean;
  error?: string;
  message?: string;
  activationType?: ActivationType;
  expiryDate?: string;
}

/**
 * دالة للتحقق من السيريال ومحاكاة الاتصال بخادم التراخيص
 */
export async function verifyLicense(serialKey: string): Promise<VerifyLicenseResult> {
  // التحقق من الاتصال بالإنترنت أولاً
  if (!navigator.onLine) {
    return { valid: false, error: 'لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت لتفعيل النظام.' };
  }

  const cleanSerial = (serialKey || "").trim().toUpperCase();
  const prefix = "PRO-2026";

  if (!cleanSerial.startsWith(prefix)) {
    return { valid: false, error: `صيغة المفتاح غير صحيحة. يجب أن يبدأ بـ ${prefix}` };
  }

  const isValidFormat = /^PRO-2026-[A-Z0-9\-]{5,20}$/.test(cleanSerial);
  
  if (!isValidFormat) {
    return { valid: false, error: 'صيغة المفتاح غير صحيحة (تأكد من إدخال المفتاح بشكل صحيح)' };
  }

  try {
    const result = await (window as any).api.license.verify(cleanSerial);
    
    if (result && result.valid) {
      let activationType: ActivationType = '1_month';
      
      // Map Arabic subscription types to system activation types
      if (result.activationType === 'تجريبي') activationType = '14_days';
      else if (result.activationType === 'شهر') activationType = '1_month';
      else if (result.activationType === '3 أشهر') activationType = '1_month';
      else if (result.activationType === '6 أشهر') activationType = '1_month';
      else if (result.activationType === 'سنة') activationType = '1_year';
      else if (result.activationType === 'مدى الحياة') activationType = 'lifetime';
      else activationType = '1_month'; // Default fallback
      
      return {
        valid: true,
        message: result.message,
        activationType,
        expiryDate: result.expiryDate
      };
    } else {
      return { valid: false, error: result?.error || 'فشل التحقق من الترخيص' };
    }
  } catch (error) {
    console.error('License verification error:', error);
    return { valid: false, error: 'حدث خطأ أثناء الاتصال بنظام التراخيص' };
  }
}
