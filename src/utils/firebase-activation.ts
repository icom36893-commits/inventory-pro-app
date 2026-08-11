// 1. استيراد مكتبات Firebase الأساسية
import { initializeApp } from "firebase/app";
// @ts-expect-error: No definitions for this package - Ignore type error due to module resolution in this setup
import { getFirestore, collection, query, where, getDocs, addDoc } from "firebase/firestore";

// 2. إعدادات الاتصال بقاعدة البيانات السحابية (نفسها المستخدمة في لوحة التحكم)
const firebaseConfig = {
  apiKey: "AIzaSyCbIk4mwmt2VKP_fyKNqcq9W3dttsDn-gw",
  authDomain: "makhzan-pro-licenses.firebaseapp.com",
  projectId: "makhzan-pro-licenses",
  storageBucket: "makhzan-pro-licenses.firebasestorage.app",
  messagingSenderId: "889060817334",
  appId: "1:889060817334:web:0d5a84a1d7aa1b549ae917"
};

let app: any = null;
let db: any = null;

function getDb() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (e) {
      console.error("Firebase init error", e);
    }
  }
  return db;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  activationType?: '2_days' | '14_days' | '1_month' | '1_year' | 'lifetime';
  expiryDate?: string;
}

/**
 * دالة التفعيل: تقوم بالتحقق من السيريال عبر الإنترنت وتسجيل الجهاز
 * 
 * @param {string} serialInput - الكود الذي أدخله المستخدم (مثل PRO-2026-42SMIUD)
 * @param {string} deviceName - اسم جهاز المستخدم (مثال: PC-MOHAMMED)
 * @param {string} deviceId - المعرف الفريد للجهاز (Hardware ID)
 * @returns {Promise<ActivationResult>} نتيجة العملية
 */
export async function activateSystemWithFirebase(serialInput: string, deviceName: string, deviceId: string): Promise<ActivationResult> {
  try {
    // 1. التحقق من وجود إنترنت
    if (!navigator.onLine) {
      return { success: false, message: "لا يوجد اتصال بالإنترنت. تفعيل النظام يتطلب إنترنت." };
    }

    const serial = (serialInput || "").trim().toUpperCase();
    
    // 2. التحقق من الصيغة المبدئية (تبدأ بالبادئة الصحيحة)
    if (!serial.startsWith("PRO-2026-")) {
      return { success: false, message: "صيغة المفتاح غير صحيحة." };
    }

    // 3. البحث عن هذا المفتاح في السحابة (Firestore)
    const database = getDb();
    if (!database) {
      return { success: false, message: "فشل في تهيئة الاتصال السحابي، يرجى المحاولة لاحقاً." };
    }
    
    const licensesRef = collection(database, "licenses");
    const qLicense = query(licensesRef, where("serial", "==", serial));
    const licenseSnap = await getDocs(qLicense);

    // إذا لم يتم العثور على المفتاح نهائياً
    if (licenseSnap.empty) {
      return { success: false, message: "المفتاح غير مسجل في النظام أو غير صحيح." };
    }

    const licenseData = licenseSnap.docs[0].data();
    const licenseId = licenseSnap.docs[0].id; // المعرف السحابي للترخيص

    // 4. التحقق من حالة الترخيص (منتهي أم لا)
    if (licenseData.status !== "فعال") {
      return { success: false, message: "هذا الترخيص منتهي أو تم إيقافه من قبل الإدارة." };
    }

    let activationType: '2_days' | '14_days' | '1_month' | '1_year' | 'lifetime' = '1_year';
    let durationMonths = 12; // الافتراضي
    
    // تحديد نوع التفعيل ومدة الصلاحية بناءً على نوع الترخيص في قاعدة البيانات
    const typeStr = (licenseData.type || licenseData.plan || licenseData.duration || "").toString().trim().toLowerCase();
    
    if (typeStr.includes('تجريب') || typeStr.includes('trial') || typeStr === '2_days') {
        activationType = '2_days';
        durationMonths = 0.1;
    } else if (typeStr.includes('14') || typeStr === '14_days') {
        activationType = '14_days';
        durationMonths = 0.5;
    } else if (typeStr.includes('شهرين') || typeStr === '2_months' || typeStr === '2 months') {
        activationType = '1_month'; 
        durationMonths = 2;
    } else if (typeStr.includes('3') && (typeStr.includes('شهر') || typeStr.includes('اشهر') || typeStr.includes('أشهر') || typeStr.includes('month'))) {
        activationType = '1_month'; 
        durationMonths = 3;
    } else if (typeStr.includes('6') && (typeStr.includes('شهر') || typeStr.includes('اشهر') || typeStr.includes('أشهر') || typeStr.includes('month'))) {
        activationType = '1_month';
        durationMonths = 6;
    } else if (typeStr.includes('شهر') || typeStr === '1_month' || typeStr === '1 month' || typeStr === 'month') {
        activationType = '1_month';
        durationMonths = 1;
    } else if (typeStr.includes('سنة') || typeStr.includes('سنه') || typeStr.includes('year') || typeStr === '1_year' || typeStr === '12_months') {
        activationType = '1_year';
        durationMonths = 12;
    } else if (typeStr.includes('حياة') || typeStr.includes('حياه') || typeStr.includes('lifetime') || typeStr.includes('دائم')) {
        activationType = 'lifetime';
        durationMonths = 1200; 
    } else {
        // إذا لم يتطابق مع أي من الأسماء المعروفة، نعتمد على الحقل الافتراضي أو نجعله 14 يوم لتفادي جعله مدى الحياة بالخطأ
        const durationDays = Number(licenseData.duration_days);
        if (durationDays > 0) {
            if (durationDays <= 2) { activationType = '2_days'; durationMonths = 0.1; }
            else if (durationDays <= 14) { activationType = '14_days'; durationMonths = 0.5; }
            else if (durationDays <= 31) { activationType = '1_month'; durationMonths = 1; }
            else if (durationDays <= 365) { activationType = '1_year'; durationMonths = 12; }
            else { activationType = 'lifetime'; durationMonths = 1200; }
        } else {
            // Default fallback if everything fails, to prevent unexpected lifetime access
            activationType = '1_month';
            durationMonths = 1;
        }
    }
    
    const now = new Date();
    let expiry = new Date(now);
    
    if (licenseData.end_date) {
        // If Firebase already provides the exact end_date, use it!
        expiry = new Date(licenseData.end_date);
    } else {
        // Fallback calculation if end_date is missing
        if (activationType === '14_days') {
            expiry.setDate(expiry.getDate() + 14);
        } else if (activationType === '2_days') {
            expiry.setDate(expiry.getDate() + 2);
        } else if (activationType === 'lifetime') {
            expiry.setFullYear(expiry.getFullYear() + 100);
        } else {
            expiry.setMonth(expiry.getMonth() + durationMonths);
        }
    }

    // 5. التحقق مما إذا كان الترخيص مفعلاً ومستخدماً حالياً على جهاز آخر
    const activationsRef = collection(database, "activations");
    const qActivation = query(activationsRef, where("license_id", "==", licenseId), where("status", "==", "نشط"));
    const activationSnap = await getDocs(qActivation);

    if (!activationSnap.empty) {
      const activeDevice = activationSnap.docs[0].data();
      // إذا كان مستخدماً على نفس الجهاز (يحاول التفعيل مرتين)، فلا مشكلة
      if (activeDevice.device_id === deviceId) {
         return { 
            success: true, 
            message: "الجهاز مفعل مسبقاً بنجاح.",
            activationType: activationType,
            expiryDate: expiry.toISOString()
         };
      } else {
         return { success: false, message: "هذا المفتاح مستخدم مسبقاً على جهاز آخر. يجب إلغاء التفعيل السابق أولاً." };
      }
    }

    // 6. تسجيل التفعيل الجديد وربطه بهذا الجهاز في السحابة
    const today = new Date().toISOString().split('T')[0];
    await addDoc(activationsRef, {
      license_id: licenseId,
      device_name: deviceName || "جهاز عميل",
      device_id: deviceId || "UNKNOWN-HWID",
      activation_date: today,
      last_used: today,
      status: "نشط"
    });

    return { 
        success: true, 
        message: "تم تفعيل النظام بنجاح!",
        activationType: activationType,
        expiryDate: expiry.toISOString()
    };

  } catch (error) {
    console.error("حدث خطأ أثناء الاتصال بالخادم:", error);
    return { success: false, message: "حدث خطأ في الشبكة، يرجى المحاولة لاحقاً." };
  }
}
