import React from 'react';
import Modal from './Modal';
import { BookOpen, LayoutDashboard, ShoppingCart, Truck, PackageSearch, Users, Wallet, BarChart3, Settings, ShieldCheck, Wrench, Search, Keyboard, HardDrive, Key, AppWindow, Bot, Server, Smartphone } from 'lucide-react';

interface GuideModalProps {
 isOpen: boolean;
 onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
 return (
 <Modal isOpen={isOpen} onClose={onClose} title="دليل الاستخدام الشامل" size="xl">
 <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar pb-6 relative">
 
 {/* مقدمة */}
 <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-primary/20">
 <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full "></div>
 <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full "></div>
 
 <div className="flex items-center gap-4 mb-4 relative z-10">
 <div className="p-4 bg-white/20 rounded-2xl shadow-inner border border-white/30">
 <BookOpen size={32} className="text-white drop-shadow-md" />
 </div>
 <div>
 <h3 className="text-3xl font-black drop-shadow-md tracking-wide">مرحباً بك في المخزن برو</h3>
 <p className="text-white/80 font-medium text-lg">النظام الشامل والمتقدم لإدارة الأنشطة التجارية</p>
 </div>
 </div>
 <p className="text-white/90 leading-relaxed text-lg relative z-10 font-medium max-w-3xl">
 تم تصميم هذا النظام ليكون الحل الأمثل والأذكى لإدارة مبيعاتك، مشترياتك، مخزونك، وحساباتك بكل دقة واحترافية. يوفر النظام تجربة مستخدم عصرية وسريعة جداً تضمن لك إنجاز كافة مهامك اليومية بسهولة وأمان تام.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* لوحة القيادة */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
 <LayoutDashboard size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">1. لوحة القيادة</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li>نظرة عامة سريعة وحية على أداء النشاط التجاري.</li>
 <li>إجمالي المبيعات والمشتريات والأرباح اليومية والشهرية.</li>
 <li>رسومات بيانية تفاعلية لحركة الأموال.</li>
 <li><span className="text-blue-600 font-bold">تنبيهات ذكية:</span> إشعارات فورية للأصناف التي أوشكت على النفاد.</li>
 </ul>
 </div>

 {/* المبيعات */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-2xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
 <ShoppingCart size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">2. إدارة المبيعات</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li><strong>نقاط البيع السريعة:</strong> إنشاء فواتير البيع بسرعة فائقة.</li>
 <li>دعم كامل للبحث باستخدام (الاسم، التصنيف، أو قارئ الباركود).</li>
 <li>طرق دفع متعددة: (نقدي، آجل، دفع جزئي، شبكة).</li>
 <li>إدارة <strong className="text-red-500">مردودات المبيعات</strong> مع التسوية التلقائية للحسابات والمخزون.</li>
 </ul>
 </div>

 {/* المشتريات */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
 <Truck size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">3. إدارة المشتريات</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li>تسجيل الفواتير الواردة من الموردين وتحديث الأرصدة تلقائياً.</li>
 <li>نظام ذكي يكتشف ويُحدث تكلفة الشراء عند تغير الأسعار.</li>
 <li>متابعة دقيقة للفواتير الآجلة وحسابات الموردين.</li>
 <li>مردودات المشتريات لمعالجة البضائع التالفة أو المرتجعة.</li>
 </ul>
 </div>

 {/* المخزون */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
 <PackageSearch size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">4. إدارة المخزون</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li>إضافة الأصناف، التصنيفات، ووحدات القياس المتعددة.</li>
 <li>تحديد أسعار الجملة، التجزئة، والتكلفة لكل صنف.</li>
 <li><strong>الجرد الفعلي:</strong> نظام لتسوية الفروقات بين الرصيد الدفتري والفعلي.</li>
 <li>إدارة التوالف وحساب تكلفتها على المنشأة.</li>
 </ul>
 </div>

 {/* العملاء والموردين */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-teal-400 to-cyan-600 text-white rounded-2xl shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
 <Users size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">5. العملاء والموردين</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li>قاعدة بيانات شاملة لجهات الاتصال وأرقام الهواتف.</li>
 <li><strong>كشف حساب:</strong> تقرير مفصل يوضح حركة العميل/المورد من بداية التعامل.</li>
 <li>إضافة الأرصدة الافتتاحية والديون السابقة بسهولة.</li>
 </ul>
 </div>

 {/* الخزينة */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-yellow-400 to-amber-600 text-white rounded-2xl shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
 <Wallet size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">6. إدارة الخزينة الجديدة</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li><strong>إدارة الصناديق:</strong> متابعة الكاش، الحسابات البنكية، والمحافظ في مكان واحد.</li>
 <li><strong>كشف الحساب:</strong> تقرير مفصل عن الحركات المالية والتحويلات.</li>
 <li><strong>القيود اليومية:</strong> تسجيل القيود المزدوجة ومتابعتها بكل سهولة ومرونة.</li>
 <li><strong>سندات القبض والصرف:</strong> استلام ودفع الأموال بدقة مع ربطها بالصناديق.</li>
 </ul>
 </div>

 {/* المعدات */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-2xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
 <Wrench size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">7. المعدات والأصول</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li>سجل كامل للمعدات والأدوات الخاصة بالمنشأة.</li>
 <li>إدارة العهد الموكلة للموظفين وحالة المعدات (متاحة، معارة).</li>
 <li>طباعة أذونات تسليم واستلام المعدات بضغطة زر.</li>
 </ul>
 </div>

 {/* التقارير */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-indigo-400 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
 <BarChart3 size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">8. التقارير الشاملة</h4>
 </div>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li><strong>الميزانية وقائمة الدخل:</strong> لمعرفة أرباحك الحقيقية.</li>
 <li>تقارير يومية/شهرية للمبيعات والمشتريات وحركة الأصناف.</li>
 <li>تقارير حركة الصندوق وتقييم المخزون المالي.</li>
 <li>تصدير جميع التقارير (Excel / PDF) جاهزة للطباعة.</li>
 </ul>
 </div>

 {/* الإعدادات والأمان */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-slate-500/10 hover:-translate-y-1 transition-all group md:col-span-2">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-slate-600 to-gray-800 text-white rounded-2xl shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform">
 <Settings size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">9. الإعدادات والنسخ الاحتياطي</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li><strong>بيانات الشركة:</strong> تغيير اسم النظام والشعار لتظهر في الفواتير.</li>
 <li><strong>الضرائب:</strong> إضافة وتعديل نسبة ضريبة القيمة المضافة.</li>
 <li><strong>المستخدمون:</strong> إضافة مستخدمين جدد وتحديد صلاحيات دقيقة لكل منهم لحماية بياناتك.</li>
 </ul>
 <ul className="list-disc list-inside text-gray-600 space-y-3 text-sm font-medium leading-relaxed">
 <li><strong className="text-primary">التحديثات:</strong> النظام يدعم التحديثات التلقائية للحصول على أحدث الميزات.</li>
 <li><strong className="text-primary">النسخ الاحتياطي:</strong> يمكن أخذ نسخة احتياطية من قواعد البيانات يدوياً، واستعادتها في أي وقت لضمان عدم ضياع أعمالك.</li>
 </ul>
 </div>
 </div>

 {/* إعدادات النظام المتقدمة */}
 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all group md:col-span-2">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-3.5 bg-gradient-to-br from-rose-400 to-pink-600 text-white rounded-2xl shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
 <Settings size={24} />
 </div>
 <h4 className="text-2xl font-black text-gray-800">10. إعدادات النظام المتقدمة وتطبيق الهاتف</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
 <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><AppWindow size={20} className="text-rose-500" /> التخصيص والتصميم</h5>
 <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm font-medium leading-relaxed">
 <li>تخصيص واجهة المستخدم والمظهر العام.</li>
 <li>تغيير ثيم التطبيق وإدارة تفضيلات العرض والألوان.</li>
 <li>التحكم في خيارات العرض المتقدمة وإعدادات الطباعة.</li>
 </ul>
 </div>
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
 <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Smartphone size={20} className="text-rose-500" /> تطبيق الهاتف (Mobile App)</h5>
 <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm font-medium leading-relaxed">
 <li><strong>إعدادات التطبيق:</strong> ربط النظام المكتبي بتطبيق الهاتف بكل سهولة ومرونة.</li>
 <li>التحكم في مزامنة البيانات السحابية (Firebase Sync) لتوفير التزامن الفوري.</li>
 <li>متابعة أعمالك من أي مكان وفي أي وقت.</li>
 </ul>
 </div>
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
 <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Bot size={20} className="text-rose-500" /> إعدادات البوت</h5>
 <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm font-medium leading-relaxed">
 <li>ربط التطبيق مع البوت لإرسال الإشعارات والتقارير.</li>
 <li>إعدادات الرد الآلي وتخصيص رسائل البوت للعملاء.</li>
 <li>تفعيل وإدارة أوامر البوت المخصصة.</li>
 </ul>
 </div>
 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
 <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Server size={20} className="text-rose-500" /> إعدادات السيرفر</h5>
 <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm font-medium leading-relaxed">
 <li>إدارة الاتصال بالسيرفر وقواعد البيانات.</li>
 <li>تكوين المنافذ (Ports) وإعدادات الشبكة المتقدمة.</li>
 <li>مراقبة حالة السيرفر وتخصيص خيارات المزامنة.</li>
 </ul>
 </div>
 </div>
 </div>
 </div>

 {/* النصائح الذهبية */}
 <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-200/50 shadow-lg shadow-amber-500/5 mt-8 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -mr-16 -mt-16"></div>
 <div className="flex items-center gap-4 mb-6 relative z-10">
 <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl border border-amber-200">
 <ShieldCheck size={28} />
 </div>
 <h4 className="text-2xl font-black text-amber-900">نصائح ذهبية للحصول على أفضل تجربة</h4>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
 <div className="flex gap-4">
 <Search className="text-amber-500 flex-shrink-0 mt-1" size={20} />
 <p className="text-amber-800 font-medium leading-relaxed">
 <strong>البحث الذكي:</strong> استخدم حقل البحث في أي صفحة للوصول السريع دون الحاجة للتمرير. النظام يبحث في كل مكان بلمحة بصر.
 </p>
 </div>
 <div className="flex gap-4">
 <HardDrive className="text-amber-500 flex-shrink-0 mt-1" size={20} />
 <p className="text-amber-800 font-medium leading-relaxed">
 <strong>حماية البيانات:</strong> ننصح وبشدة بأخذ <span className="font-bold underline decoration-amber-400">نسخة احتياطية</span> أسبوعياً وحفظها في محرك خارجي أو فلاش ميموري.
 </p>
 </div>
 <div className="flex gap-4">
 <Keyboard className="text-amber-500 flex-shrink-0 mt-1" size={20} />
 <p className="text-amber-800 font-medium leading-relaxed">
 <strong>سرعة الإدخال:</strong> استخدم القائمة العلوية السريعة (الملف) لإنشاء الفواتير والسندات من أي واجهة في النظام دون الرجوع للقائمة الرئيسية.
 </p>
 </div>
 <div className="flex gap-4">
 <Key className="text-amber-500 flex-shrink-0 mt-1" size={20} />
 <p className="text-amber-800 font-medium leading-relaxed">
 <strong>صلاحيات الموظفين:</strong> لا تشارك حساب المدير (Admin) مع الموظفين، قم بإنشاء حساب خاص لكل كاشير بصلاحيات محدودة للحد من الأخطاء.
 </p>
 </div>
 </div>
 </div>

 </div>
 
 <div className="flex justify-end pt-6 border-t border-gray-100 mt-2 bg-gray-50/50 rounded-b-[2.5rem] px-6 pb-6">
 <button 
 onClick={onClose} 
 className="px-12 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all"
 >
 حسناً، استعد للبدء
 </button>
 </div>
 </Modal>
 );
};

export default GuideModal;
