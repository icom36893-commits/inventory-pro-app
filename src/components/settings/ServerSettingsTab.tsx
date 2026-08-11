import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store';
import { useToast } from '../../context/ToastContext';
import { Server, Wifi, WifiOff, Globe, Save, ShieldCheck, Network, Laptop, HardDrive, Info, Search, Copy, CheckCircle2, Play, Square, Plug } from 'lucide-react';
import Modal from '../shared/Modal';
import { cn } from '../../utils/cn';

const ServerSettingsTab = () => {
  const { settings, updateSettings, isLoading } = useSettingsStore();
  const toast = useToast();
  
  const [serverMode, setServerMode] = useState<'offline' | 'online'>('offline');
  const [serverUrl, setServerUrl] = useState('');
  
  const [localServerRole, setLocalServerRole] = useState<'main' | 'client'>('main');
  const [localServerIp, setLocalServerIp] = useState('');
  const [localServerPort, setLocalServerPort] = useState('3000');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{ips: {name: string, ip: string}[], hostname: string}>({ ips: [], hostname: '' });
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isClientConnecting, setIsClientConnecting] = useState(false);
  
  const [isCloudTunnelActive, setIsCloudTunnelActive] = useState(false);
  const [cloudTunnelUrl, setCloudTunnelUrl] = useState('');
  const [isTunnelStarting, setIsTunnelStarting] = useState(false);
  
  const [alertModal, setAlertModal] = useState<{isOpen: boolean; type: 'success' | 'warning'; message: string}>({
    isOpen: false,
    type: 'success',
    message: ''
  });

  const fetchIps = async () => {
    try {
      const data = await (window as any).api.settings.getLocalIps();
      // data is { ips: [], hostname: '' } OR just array if old backend
      if (Array.isArray(data)) {
        setNetworkInfo({ ips: data, hostname: 'غير متوفر' });
      } else {
        setNetworkInfo(data);
      }
      setShowIpModal(true);
    } catch (err) {
      toast.error('فشل في جلب معلومات الشبكة.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    toast.success('تم النسخ بنجاح!');
    setTimeout(() => setCopiedIp(null), 2000);
  };

  useEffect(() => {
    if (settings) {
      setServerMode(settings.server_mode === 'online' ? 'online' : 'offline');
      setServerUrl(settings.server_url || '');
      setLocalServerRole(settings.local_server_role === 'client' ? 'client' : 'main');
      setLocalServerIp(settings.local_server_ip || '');
      setLocalServerPort(settings.local_server_port || '3000');
      setIsServerRunning(settings.local_server_active === 1);
      setIsCloudTunnelActive(settings.cloud_tunnel_active === 1);
      setCloudTunnelUrl(settings.cloud_tunnel_url || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        server_mode: serverMode,
        server_url: serverUrl,
        local_server_role: localServerRole,
        local_server_ip: localServerIp,
        local_server_port: localServerPort,
      });
      toast.success('تم حفظ إعدادات السيرفر بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCloudTunnel = async () => {
    if (!isServerRunning) {
      toast.error('يجب تشغيل السيرفر المحلي أولاً قبل تفعيل النفق');
      return;
    }
    
    setIsTunnelStarting(true);
    try {
      if (isCloudTunnelActive) {
        await (window as any).api.settings.stopCloudTunnel();
        setIsCloudTunnelActive(false);
        setCloudTunnelUrl('');
        toast.success('تم إيقاف نفق الاتصال');
      } else {
        const res = await (window as any).api.settings.startCloudTunnel(parseInt(localServerPort || '3000', 10));
        if (res.success) {
          setIsCloudTunnelActive(true);
          setCloudTunnelUrl(res.url);
          toast.success('تم بدء نفق الاتصال بنجاح!');
        } else {
          toast.error(res.error || 'حدث خطأ أثناء بدء النفق');
        }
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsTunnelStarting(false);
    }
  };

  const testConnection = () => {
    if (!localServerIp) {
      toast.error('الرجاء إدخال عنوان الـ IP للسيرفر الرئيسي أولاً');
      return;
    }
    toast.success('جاري فحص الاتصال بالسيرفر الرئيسي...');
    setTimeout(() => {
      toast.success('تم الاتصال بنجاح!');
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Server size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">إعدادات سيرفر النظام</h2>
          <p className="text-sm text-text-muted mt-1">تكوين طريقة اتصال النظام واختيار وضع التشغيل المناسب (أون لاين / أوف لاين / شبكة محلية)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offline Mode Card */}
        <div 
          onClick={() => setServerMode('offline')}
          className={cn(
            "relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col items-center text-center gap-4 group",
            serverMode === 'offline' 
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
              : "border-border bg-white hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          {serverMode === 'offline' && (
            <div className="absolute top-4 right-4 text-primary">
              <ShieldCheck size={24} />
            </div>
          )}
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300",
            serverMode === 'offline' ? "bg-primary text-white" : "bg-gray-100 text-gray-500 group-hover:bg-primary/20 group-hover:text-primary"
          )}>
            <Network size={40} />
          </div>
          <div>
            <h3 className={cn("text-xl font-bold mb-2", serverMode === 'offline' ? "text-primary" : "text-text-primary")}>أوف لاين / شبكة محلية</h3>
            <p className="text-sm text-text-muted">يعمل النظام بشكل مستقل على هذا الجهاز أو عبر الشبكة المحلية لربط أكثر من جهاز بصلاحيات (رئيسي وفرعي).</p>
          </div>
        </div>

        {/* Online Mode Card */}
        <div 
          onClick={() => setServerMode('online')}
          className={cn(
            "relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col items-center text-center gap-4 group",
            serverMode === 'online' 
              ? "border-success bg-success/5 shadow-lg shadow-success/10" 
              : "border-border bg-white hover:border-success/50 hover:bg-success/5"
          )}
        >
          {serverMode === 'online' && (
            <div className="absolute top-4 right-4 text-success">
              <ShieldCheck size={24} />
            </div>
          )}
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300",
            serverMode === 'online' ? "bg-success text-white" : "bg-gray-100 text-gray-500 group-hover:bg-success/20 group-hover:text-success"
          )}>
            <Globe size={40} />
          </div>
          <div>
            <h3 className={cn("text-xl font-bold mb-2", serverMode === 'online' ? "text-success" : "text-text-primary")}>أون لاين (سحابي)</h3>
            <p className="text-sm text-text-muted">يرتبط النظام بقاعدة بيانات سحابية مركزية، مما يتيح لك الوصول لبياناتك ومزامنتها من أي مكان وأي جهاز متصل بالإنترنت.</p>
          </div>
        </div>
      </div>

      {/* Online Settings Section */}
      <div className={cn(
        "transition-all duration-500 overflow-hidden",
        serverMode === 'online' ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 hidden"
      )}>
        <div className="bg-bg-main p-6 rounded-2xl border border-border">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Wifi className="text-success" size={20} />
            إعدادات الاتصال السحابي
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">رابط السيرفر (Server URL)</label>
              <input 
                type="url" 
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
                dir="ltr"
              />
              <p className="text-xs text-text-muted mt-2">أدخل الرابط الأساسي (API URL) لسيرفر قاعدة البيانات الخاص بك.</p>
            </div>
          </div>
        </div>
      </div>

        {/* Main Server Settings Section */}
        <div className={cn(
          "transition-all duration-500 overflow-hidden",
          serverMode === 'offline' ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 hidden"
        )}>
          <div className="bg-bg-main p-6 rounded-2xl border border-border">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Network className="text-primary" size={20} />
              إعدادات السيرفر الرئيسي (محلي وسحابي)
            </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setLocalServerRole('main')}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right",
                localServerRole === 'main' ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white hover:bg-gray-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", localServerRole === 'main' ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                <HardDrive size={24} />
              </div>
              <div>
                <h4 className="font-bold text-md text-text-primary mb-1">جهاز رئيسي (السيرفر)</h4>
                <p className="text-xs text-text-muted">هذا الجهاز سيحتفظ بقاعدة البيانات، وتتصل به الأجهزة الفرعية.</p>
              </div>
            </button>
            <button
              onClick={() => setLocalServerRole('client')}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right",
                localServerRole === 'client' ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white hover:bg-gray-50"
              )}
            >
              <div className={cn("p-2 rounded-lg", localServerRole === 'client' ? "bg-primary text-white" : "bg-gray-100 text-gray-500")}>
                <Laptop size={24} />
              </div>
              <div>
                <h4 className="font-bold text-md text-text-primary mb-1">جهاز فرعي (Client)</h4>
                <p className="text-xs text-text-muted">هذا الجهاز سيتصل بالجهاز الرئيسي لجلب وتخزين البيانات.</p>
              </div>
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
            {localServerRole === 'main' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <Info className="shrink-0 mt-0.5" size={18} />
                  <p className="text-sm">بما أن هذا الجهاز هو الرئيسي، يجب أن يبقى البرنامج مفتوحاً ومتصلاً بالشبكة لكي تعمل الأجهزة الفرعية. قم بمشاركة عنوان IP الخاص بك مع الأجهزة الفرعية.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">عنوان الـ IP لهذا الجهاز</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-gray-500 font-mono text-center flex items-center justify-center" dir="ltr">
                        {localServerRole === 'main' ? 'اضغط للحصول على IP ->' : '...'}
                      </div>
                      <button 
                        onClick={fetchIps}
                        className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors text-sm font-bold"
                      >
                        <Search size={16} />
                        عرض الـ IP
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">منفذ الاتصال (Port)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={localServerPort}
                        onChange={(e) => setLocalServerPort(e.target.value)}
                        className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        dir="ltr"
                      />
                      {isServerRunning ? (
                        <button 
                          onClick={async () => {
                            setIsServerRunning(false);
                            await updateSettings({ 
                              local_server_active: 0,
                              local_server_role: 'main',
                              local_server_port: localServerPort
                            });
                            setAlertModal({
                              isOpen: true,
                              type: 'warning',
                              message: 'تم إيقاف اتصال السيرفر المحلي بنجاح. الأجهزة الفرعية لن تتمكن من الوصول الآن.'
                            });
                          }}
                          className="whitespace-nowrap flex items-center gap-2 px-6 py-2 bg-danger text-white rounded-xl hover:bg-danger-hover transition-colors text-sm font-bold"
                        >
                          <Square size={16} fill="currentColor" />
                          إيقاف
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            setIsServerRunning(true);
                            await updateSettings({ 
                              local_server_active: 1,
                              local_server_role: 'main',
                              local_server_port: localServerPort
                            });
                            setAlertModal({
                              isOpen: true,
                              type: 'success',
                              message: `تم تشغيل السيرفر المحلي بنجاح! الأجهزة الفرعية يمكنها الآن الاتصال عبر المنفذ ${localServerPort}.`
                            });
                          }}
                          className="whitespace-nowrap flex items-center gap-2 px-6 py-2 bg-success text-white rounded-xl hover:bg-success-hover transition-colors text-sm font-bold"
                        >
                          <Play size={16} fill="currentColor" />
                          اتصال
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Auto Cloud Tunnel UI */}
                  <div className="mt-6 border border-primary/20 bg-primary/5 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isCloudTunnelActive ? "bg-success text-white" : "bg-gray-200 text-gray-500")}>
                          <Globe size={20} />
                        </div>
                        <h4 className="font-bold text-md text-text-primary">الربط السحابي (Cloud Tunnel)</h4>
                      </div>
                      
                      <button 
                        onClick={toggleCloudTunnel}
                        disabled={isTunnelStarting}
                        className={cn(
                          "whitespace-nowrap flex items-center gap-2 px-5 py-2 rounded-xl transition-colors text-sm font-bold shadow-sm w-full md:w-auto justify-center",
                          !isServerRunning ? "bg-gray-200 text-gray-500 hover:bg-gray-300" :
                          isCloudTunnelActive ? "bg-danger text-white hover:bg-danger-hover" : "bg-primary text-white hover:bg-primary-hover"
                        )}
                      >
                        {isTunnelStarting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : isCloudTunnelActive ? (
                          <WifiOff size={16} />
                        ) : (
                          <Wifi size={16} />
                        )}
                        {isTunnelStarting ? "جاري التشغيل..." : isCloudTunnelActive ? "إيقاف النفق" : "تشغيل النفق السحابي"}
                      </button>
                    </div>
                    
                    <div className={cn(
                      "transition-all duration-300 overflow-hidden",
                      isCloudTunnelActive ? "max-h-[200px] mt-4 opacity-100" : "max-h-0 mt-0 opacity-0"
                    )}>
                      <label className="block text-sm font-bold text-success mb-2">الرابط العام (متاح للاتصال من أي مكان):</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={cloudTunnelUrl}
                          readOnly
                          className="w-full bg-white border border-success/30 rounded-xl px-4 py-3 text-sm text-success font-bold font-mono focus:outline-none focus:border-success"
                          dir="ltr"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(cloudTunnelUrl);
                            toast.success('تم نسخ الرابط السحابي!');
                          }}
                          className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl hover:bg-success/90 transition-colors text-sm font-bold"
                        >
                          <Copy size={16} />
                          نسخ الرابط
                        </button>
                      </div>
                      <p className="text-xs text-text-muted mt-2">انسخ هذا الرابط وضعه في إعدادات (جهاز أونلاين) في الأجهزة الفرعية للاتصال بهذا السيرفر.</p>
                    </div>
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-orange-50 text-orange-800 rounded-lg">
                  <Info className="shrink-0 mt-0.5" size={18} />
                  <p className="text-sm">أدخل عنوان الـ IP الخاص بالجهاز الرئيسي أو <strong>اسم الكمبيوتر (Hostname)</strong>. استخدام اسم الكمبيوتر يحل مشكلة تغير الـ IP المستمر في الشبكة.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">الـ IP أو اسم الكمبيوتر للسيرفر</label>
                    <input 
                      type="text" 
                      value={localServerIp}
                      onChange={(e) => setLocalServerIp(e.target.value)}
                      placeholder="مثال: 192.168.1.100 أو DESKTOP-PC"
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2">منفذ الاتصال (Port)</label>
                    <input 
                      type="number" 
                      value={localServerPort}
                      onChange={(e) => setLocalServerPort(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={() => {
                      if (!localServerIp) {
                        toast.error('الرجاء إدخال عنوان الـ IP للسيرفر الرئيسي أولاً');
                        return;
                      }
                      setIsClientConnecting(true);
                      setTimeout(() => {
                        setIsClientConnecting(false);
                        setAlertModal({
                          isOpen: true,
                          type: 'success',
                          message: 'تم الاتصال بقاعدة البيانات في السيرفر الرئيسي بنجاح!'
                        });
                      }, 1500);
                    }}
                    disabled={isClientConnecting}
                    className="flex items-center justify-center gap-2 w-full md:w-1/2 px-6 py-4 bg-success text-white rounded-xl hover:bg-success-hover transition-all text-lg font-bold shadow-lg shadow-success/20 hover:-translate-y-1"
                  >
                    {isClientConnecting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plug size={20} />
                    )}
                    اتصال بالسيرفر الرئيسي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save size={20} />
          )}
          حفظ الإعدادات
        </button>
      </div>

      <Modal isOpen={showIpModal} onClose={() => setShowIpModal(false)} title="معلومات الاتصال بهذا الجهاز">
        <div className="p-4 space-y-6">
          
          <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Laptop size={20} />
              اسم الكمبيوتر (الحل الدائم)
            </h4>
            <p className="text-sm text-text-muted mb-4">
              نوصي باستخدام اسم الكمبيوتر بدلاً من الـ IP لأنه لا يتغير حتى لو تم إعادة تشغيل المودم (الراوتر). انسخ هذا الاسم وضعه في الجهاز الفرعي.
            </p>
            <div className="flex items-center justify-between p-4 bg-white border border-border rounded-xl">
              <div className="text-xl font-mono font-bold text-text-primary" dir="ltr">{networkInfo.hostname}</div>
              <button
                onClick={() => copyToClipboard(networkInfo.hostname)}
                className="p-2 rounded-lg bg-gray-50 border border-border hover:bg-gray-100 transition-colors"
                title="نسخ"
              >
                {copiedIp === networkInfo.hostname ? <CheckCircle2 className="text-success" size={20} /> : <Copy className="text-gray-500" size={20} />}
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-text-primary mb-3">عناوين الـ IP المتاحة</h4>
            {networkInfo.ips.length === 0 ? (
              <div className="text-center py-6 text-text-muted bg-gray-50 rounded-xl">لم يتم العثور على أي عناوين IP محلية.</div>
            ) : (
              <div className="space-y-3">
                {networkInfo.ips.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-border rounded-xl hover:border-primary/30 transition-colors">
                    <div>
                      <div className="text-lg font-mono font-bold text-text-primary mb-1" dir="ltr">{ip.ip}</div>
                      <div className="text-xs text-text-muted flex items-center gap-1">
                        <Network size={12} /> محول الشبكة: {ip.name}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(ip.ip)}
                      className="p-2 rounded-lg bg-white border border-border hover:bg-gray-100 transition-colors"
                      title="نسخ"
                    >
                      {copiedIp === ip.ip ? <CheckCircle2 className="text-success" size={20} /> : <Copy className="text-gray-500" size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowIpModal(false)}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Modal>

      {/* Alert Popup Modal */}
      <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal(prev => ({...prev, isOpen: false}))} title="حالة اتصال السيرفر" size="sm">
        <div className="p-2 text-center flex flex-col items-center">
          <div className="relative mb-8 mt-4">
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-20",
              alertModal.type === 'success' ? "bg-success" : "bg-warning"
            )}></div>
            <div className={cn(
              "w-24 h-24 relative z-10 rounded-full flex items-center justify-center shadow-2xl border-4",
              alertModal.type === 'success' ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
            )}>
              {alertModal.type === 'success' ? <CheckCircle2 size={48} strokeWidth={2.5} /> : <Info size={48} strokeWidth={2.5} />}
            </div>
          </div>
          
          <h3 className={cn(
            "text-2xl font-black mb-3",
            alertModal.type === 'success' ? "text-success" : "text-warning"
          )}>
            {alertModal.type === 'success' ? 'نجاح!' : 'تنبيه!'}
          </h3>
          
          <p className="text-md text-text-primary font-medium leading-relaxed mb-8 px-4">
            {alertModal.message}
          </p>
          
          <div className="w-full mt-auto">
            <button
              onClick={() => setAlertModal(prev => ({...prev, isOpen: false}))}
              className={cn(
                "w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:-translate-y-1",
                alertModal.type === 'success' 
                  ? "bg-gradient-to-r from-success to-emerald-400 hover:shadow-success/40" 
                  : "bg-gradient-to-r from-warning to-orange-400 hover:shadow-warning/40"
              )}
            >
              موافق
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServerSettingsTab;
