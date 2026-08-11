const fs = require('fs');
const path = require('path');

const content = `مرحباً بك في نظام "المخزون برو" الإصدار 1.0.5

النظام الشامل لإدارة المبيعات والمشتريات والمخزون، المصمم خصيصاً لتلبية احتياجات نشاطك التجاري بكل احترافية وسهولة.

أهم مميزات النظام في هذا الإصدار:
1. إعدادات التطبيق متكاملة تتيح لك تخصيص النظام بشكل كامل.
2. إضافة رصيد أولي (واجهة إدارة المخزون) لسهولة جرد وبدء العمل.
3. دعم كامل لفاتورة كاشير 80مم بتصميم مخصص وسريع للطباعة.
4. مميزات إضافية في فاتورة المبيعات والمشتريات تشمل (الخصم، والمصاريف الإضافية).
5. نظام صلاحيات متقدم للمستخدمين، تمت إضافته في نافذة المستخدمين لحماية بياناتك وتخصيص الوصول.
6. إدارة شاملة للمخزون والمنتجات مع تنبيهات عند نقص الكميات.
7. فواتير مبيعات ومشتريات احترافية بتصميمات متعددة وقابلة للطباعة.
8. تقارير مالية وإحصائيات دقيقة لاتخاذ قرارات أفضل.
9. إدارة كاملة لحسابات العملاء والموردين وكشوفات الحساب.
10. النسخ الاحتياطي التلقائي للبيانات لحمايتها من الضياع.

----------------------------------
تواصل مع فريق الدعم : 07844112111
الموقع الرسمي : https://pro.iqa5.site/
----------------------------------

شكراً لاختيارك "المخزون برو". نتمنى لك التوفيق والنجاح في أعمالك!
`;

const filePaths = [
  path.join(__dirname, 'buildResources', 'features.txt'),
  path.join(__dirname, 'build', 'features.txt'),
  path.join(__dirname, 'release', '1.0.5', 'features.txt')
];

const bom = Buffer.from([0xFF, 0xFE]);
const textBuf = Buffer.from(content, 'utf16le');

for (const p of filePaths) {
  // ensure dir exists
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, Buffer.concat([bom, textBuf]));
}
console.log('Features file written with UTF-16LE BOM successfully to multiple locations.');
