import React, { useState, useEffect, Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import Auth from './pages/Auth';
import Setup from './pages/Setup';
import Modal from './components/shared/Modal';
import GuideModal from './components/shared/GuideModal';
import AboutModal from './components/shared/AboutModal';
import SupportModal from './components/shared/SupportModal';
import { Download, ShieldCheck, Info, DownloadCloud } from 'lucide-react';
import { useSettingsStore, useAuthStore, useLicenseStore, useNotificationStore, usePermissionsStore } from './store';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sales = lazy(() => import('./pages/Sales'));
const Inventory = lazy(() => import('./pages/Inventory'));
const CustomersSuppliers = lazy(() => import('./pages/CustomersSuppliers'));
const Treasury = lazy(() => import('./pages/Treasury'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Equipment = lazy(() => import('./pages/Equipment'));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCheckingDb, setIsCheckingDb] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [showAutoUpdateAlert, setShowAutoUpdateAlert] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'alert' | 'downloading' | 'completed' | 'not-available'>('alert');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const { fetchSettings } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const { isSetupComplete, setSetupComplete, checkActivationStatus } = useLicenseStore();
  const { initializePermissions } = usePermissionsStore();

  useEffect(() => {
    fetchSettings();
    checkActivationStatus();
    initializePermissions();
    
    // Auto-detect if database was wiped by reset script
    const checkDbStatus = async () => {
      try {
        if ((window as any).api && (window as any).api.users) {
          const users = await (window as any).api.users.getAll();
          if (users.length > 0) {
             if (!isSetupComplete) {
               setSetupComplete(true);
               
               // Fix: Ensure the system gets the 2-day trial if it was skipped or interrupted
               const { isActivated, activateSystem } = useLicenseStore.getState();
               if (!isActivated) {
                 const expiryDate = new Date();
                 expiryDate.setDate(expiryDate.getDate() + 2);
                 activateSystem('2_days', expiryDate.toISOString());
               }
             }
          } else if (users.length === 0 && isSetupComplete) {
            // Database is empty but frontend thinks setup is complete!
            // Wipe local storage and reload
            localStorage.clear();
            window.location.reload();
            return;
          }
        }
      } catch (e) {
        console.error('Error checking DB status', e);
      } finally {
        setIsCheckingDb(false);
      }
    };
    checkDbStatus();
  }, [fetchSettings, checkActivationStatus, isSetupComplete, setSetupComplete]);

  // Notification Engine Sync
  useEffect(() => {
    if (!isAuthenticated || !isSetupComplete) return;

    let isMounted = true;
    const { fetchNotifications } = useNotificationStore.getState();

    const syncNotifications = async () => {
      const notifyLowStock = useNotificationStore.getState().notifyLowStock;
      
      try {
        if ((window as any).api && (window as any).api.notifications) {
          // If enabled, check low stock in the backend (it handles deduping itself)
          if (notifyLowStock) {
            await (window as any).api.notifications.checkLowStock();
          }
          
          if (!isMounted) return;
          // Fetch updated notifications list from backend
          await fetchNotifications();
        }
      } catch (e) {
        console.error('Error syncing notifications', e);
      }
    };

    // Sync on load
    syncNotifications();

    // Check periodically every 5 minutes
    const interval = setInterval(syncNotifications, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, isSetupComplete]);

  useEffect(() => {
    if ((window as any).api && (window as any).api.onMenuAction) {
      (window as any).api.onMenuAction(async (action: string) => {
        const { isAuthenticated } = useAuthStore.getState();
        const { isSetupComplete } = useLicenseStore.getState();
        if (!isAuthenticated || !isSetupComplete) return;

        if (action === 'new-sales') {
          setActiveTab('sales');
          useSettingsStore.getState().setPendingAction('open_sales_modal');
        } else if (action === 'new-purchase') {
          setActiveTab('purchases');
          useSettingsStore.getState().setPendingAction('open_purchase_modal');
        } else if (action === 'backup') {
          await (window as any).api.settings.exportBackup();
        } else if (action === 'restore') {
          await (window as any).api.settings.importBackup();
        } else if (action === 'update') {
          setShowAutoUpdateAlert(true);
          setUpdateStatus('checking');
          (window as any).api.updater.checkForUpdates();
        } else if (action === 'local-update') {
          await (window as any).api.settings.installLocalUpdate();
        } else if (action === 'guide') {
          setShowGuideModal(true);
        } else if (action === 'about') {
          setShowAboutModal(true);
        } else if (action === 'support') {
          setShowSupportModal(true);
        }
      });
    }
  }, [setActiveTab]);

  // Updater Events & Auto Update Check
  useEffect(() => {
    if ((window as any).api && (window as any).api.updater) {
      (window as any).api.updater.onUpdateAvailable((version: string) => {
        setShowAutoUpdateAlert(true);
        setUpdateStatus('alert');
        if (version) setUpdateVersion(version);
      });

      (window as any).api.updater.onUpdateNotAvailable(() => {
        setUpdateStatus((prev) => {
          if (prev === 'checking') {
            return 'not-available';
          }
          return prev;
        });
      });

      // Auto update check on startup
      if (isAuthenticated && isSetupComplete && localStorage.getItem('autoUpdateEnabled') === 'true') {
        const hasChecked = sessionStorage.getItem('hasCheckedUpdate');
        if (!hasChecked) {
          sessionStorage.setItem('hasCheckedUpdate', 'true');
          (window as any).api.updater.checkForUpdates();
        }
      }
    }

    const handleTriggerUpdate = () => {
      setShowAutoUpdateAlert(true);
      setUpdateStatus('checking');
      (window as any).api.updater.checkForUpdates();
    };
    window.addEventListener('trigger-update', handleTriggerUpdate);

    return () => {
      window.removeEventListener('trigger-update', handleTriggerUpdate);
    };
  }, [isAuthenticated, isSetupComplete]);

  const startAutoUpdate = () => {
    setUpdateStatus('downloading');
    setUpdateProgress(0);

    (window as any).api.updater.onUpdateProgress((progress: any) => {
      setUpdateProgress(Math.round(progress.percent));
    });

    (window as any).api.updater.onUpdateDownloaded(() => {
      setUpdateStatus('completed');
    });

    (window as any).api.updater.onError((error: string) => {
      console.error(error);
      setShowAutoUpdateAlert(false);
    });
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'sales':
        return <Sales />;
      case 'purchases':
        return <Purchases />;
      case 'inventory':
        return <Inventory />;
      case 'equipment':
        return <Equipment />;
      case 'customers':
        return <CustomersSuppliers initialType="customer" />;
      case 'suppliers':
        return <CustomersSuppliers initialType="supplier" />;
      case 'treasury':
        return <Treasury />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  if (isCheckingDb) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <Setup />;
  }

  if (!isAuthenticated) {
    return <Auth onLogin={() => {}} />;
  }

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </div>
      </Layout>

      <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />

      <Modal 
        isOpen={showAutoUpdateAlert} 
        onClose={() => setShowAutoUpdateAlert(false)} 
        title={
          updateStatus === 'checking' ? 'التحقق من التحديثات' :
          updateStatus === 'not-available' ? 'النظام محدث' :
          updateStatus === 'alert' ? 'تحديث جديد متوفر' : 
          updateStatus === 'completed' ? 'اكتمل التحديث' : 
          'جاري التحديث'
        }
      >
        <div className="p-10 flex flex-col items-center justify-center text-center">
          {updateStatus === 'checking' ? (
             <div className="animate-fade-in flex flex-col items-center">
               <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
               </div>
               <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">جاري البحث عن تحديثات...</h3>
               <p className="text-gray-500 mb-6 text-lg leading-relaxed max-w-sm">يرجى الانتظار بينما نقوم بالتحقق من وجود أحدث نسخة من النظام لضمان أفضل تجربة لك.</p>
             </div>
          ) : updateStatus === 'not-available' ? (
             <div className="animate-fade-in flex flex-col items-center">
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 transform rotate-3 hover:rotate-6 transition-all">
                 <ShieldCheck className="text-white" size={48} />
               </div>
               <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">النظام محدث بالكامل</h3>
               <p className="text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl font-bold mb-8 text-lg border border-emerald-100 shadow-sm">أنت تستخدم أحدث إصدار متاح</p>
               <button 
                 onClick={() => setShowAutoUpdateAlert(false)}
                 className="bg-gray-100 text-gray-800 px-10 py-4 rounded-2xl font-bold w-full hover:bg-gray-200 transition-all text-lg border border-gray-200 shadow-sm"
               >
                 حسناً، فهمت
               </button>
             </div>
          ) : updateStatus === 'alert' ? (
             <div className="animate-fade-in flex flex-col items-center">
               <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-[pulse_2s_infinite]">
                 <DownloadCloud className="text-white drop-shadow-md" size={56} />
               </div>
               <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">تحديث جديد متوفر!</h3>
               {updateVersion && (
                 <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl font-bold text-sm mb-5 border border-indigo-100 shadow-sm">
                   الإصدار الجديد: {updateVersion}
                 </div>
               )}
               <p className="text-gray-500 mb-8 max-w-sm text-lg leading-relaxed text-center">اكتشف الميزات الجديدة والتحسينات المذهلة في هذا الإصدار. ننصحك بالترقية فوراً للحصول على أفضل أداء وتجربة.</p>
               <div className="flex gap-4 w-full">
                 <button 
                   onClick={() => setShowAutoUpdateAlert(false)}
                   className="flex-1 bg-white text-gray-700 px-4 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all border-2 border-gray-200"
                 >
                   تأجيل التحديث
                 </button>
                 <button 
                   onClick={startAutoUpdate}
                   className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
                 >
                   تحديث النظام الآن
                 </button>
               </div>
             </div>
          ) : updateStatus === 'completed' ? (
             <div className="animate-fade-in flex flex-col items-center">
               <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/30 transform rotate-3 hover:rotate-6 transition-all">
                 <ShieldCheck className="text-white" size={48} />
               </div>
               <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">تم التحديث بنجاح</h3>
               <p className="text-gray-500 mb-8 max-w-sm text-lg leading-relaxed">تم التحديث بنجاح. يرجى إعادة تشغيل النظام لتطبيق التغييرات والاستمتاع بالميزات الجديدة.</p>
               <button 
                 onClick={() => {
                   (window as any).api.updater.installUpdate();
                 }}
                 className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-2xl font-bold w-full shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-3"
               >
                 إغلاق وإعادة التشغيل
               </button>
             </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="relative mb-8 mt-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-primary/30 relative z-10">
                  <Download className="text-white animate-bounce" size={40} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">جاري تحديث النظام</h3>
              <p className="text-gray-500 mb-8 max-w-sm text-center">يرجى الانتظار بينما نقوم بتنزيل أحدث الملفات وتثبيتها. قد تستغرق العملية بضع دقائق.</p>
              
              <div className="w-full bg-gray-100 rounded-2xl h-4 mb-2 overflow-hidden shadow-inner relative">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500 transition-all duration-300 relative overflow-hidden" 
                  style={{ width: `${updateProgress}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/30 w-full h-full flex" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem', animation: 'shimmer 1s linear infinite' }}></div>
                </div>
              </div>
              <div className="flex justify-between w-full text-sm font-black text-gray-700 px-1 mb-8">
                <span>{updateProgress.toFixed(0)}%</span>
                <span className="text-primary animate-pulse">جاري التحميل...</span>
              </div>
              <div className="bg-orange-50/80 border border-orange-200 text-orange-600 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-3 w-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                الرجاء عدم إغلاق البرنامج أثناء عملية التحديث
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default App;
