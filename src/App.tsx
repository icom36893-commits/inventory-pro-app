import React, { useState, useEffect, Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import Auth from './pages/Auth';
import Setup from './pages/Setup';
import Modal from './components/shared/Modal';
import { Download, ShieldCheck, Info } from 'lucide-react';
import { useSettingsStore, useAuthStore, useLicenseStore, useNotificationStore } from './store';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCheckingDb, setIsCheckingDb] = useState(true);

  const [showAutoUpdateAlert, setShowAutoUpdateAlert] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'alert' | 'downloading' | 'completed'>('alert');
  const { fetchSettings } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const { isSetupComplete, setSetupComplete, checkActivationStatus } = useLicenseStore();

  useEffect(() => {
    fetchSettings();
    checkActivationStatus();
    
    // Auto-detect if database was wiped by reset script
    const checkDbStatus = async () => {
      try {
        if ((window as any).api && (window as any).api.users) {
          const users = await (window as any).api.users.getAll();
          if (users.length > 0) {
             if (!isSetupComplete) {
               setSetupComplete(true);
               
               // Fix: Ensure the system gets the 14-day trial if it was skipped or interrupted
               const { isActivated, activateSystem } = useLicenseStore.getState();
               if (!isActivated) {
                 const expiryDate = new Date();
                 expiryDate.setDate(expiryDate.getDate() + 14);
                 activateSystem('14_days', expiryDate.toISOString());
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

  // Auto Update Check on Startup
  useEffect(() => {
    if (isAuthenticated && isSetupComplete && localStorage.getItem('autoUpdateEnabled') === 'true') {
      const hasChecked = sessionStorage.getItem('hasCheckedUpdate');
      if (!hasChecked) {
        sessionStorage.setItem('hasCheckedUpdate', 'true');
        
        (window as any).api.updater.onUpdateAvailable(() => {
          setShowAutoUpdateAlert(true);
          setUpdateStatus('alert');
        });

        (window as any).api.updater.checkForUpdates();
      }
    }
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
        return <Dashboard />;
      case 'sales':
        return <Sales />;
      case 'purchases':
        return <Purchases />;
      case 'inventory':
        return <Inventory />;
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

      <Modal isOpen={showAutoUpdateAlert} onClose={() => {}} title={updateStatus === 'alert' ? 'تحديث جديد متوفر' : updateStatus === 'completed' ? 'اكتمل التحديث' : 'جاري التحديث التلقائي'}>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          {updateStatus === 'alert' ? (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Info className="text-primary" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">تحديث جديد متوفر للنظام</h3>
              <p className="text-gray-500 mb-6">يوجد تحديث جديد متاح. بما أنك مفعل خيار التحديث التلقائي، سيتم تحديث النظام الآن.</p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowAutoUpdateAlert(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  تأجيل التحديث
                </button>
                <button 
                  onClick={startAutoUpdate}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-primary-light transition-all"
                >
                  تحديث الآن
                </button>
              </div>
            </>
          ) : updateStatus === 'completed' ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">تم الانتهاء من تحديث النظام</h3>
              <p className="text-gray-500 mb-6">تم التحديث بنجاح. سيتم إعادة تشغيل النظام لتطبيق التغييرات.</p>
              <button 
                onClick={() => {
                  (window as any).api.updater.installUpdate();
                }}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold w-full shadow-md hover:bg-primary-light transition-all"
              >
                إغلاق وإعادة التشغيل
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Download className="text-primary animate-bounce" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">جاري جلب الملفات وتثبيت التحديث...</h3>
              
              <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden border border-gray-200">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${updateProgress}%` }}
                ></div>
              </div>
              <p className="text-primary font-bold text-lg">{updateProgress}%</p>
              <p className="text-sm text-gray-400 mt-4">الرجاء عدم إغلاق البرنامج أثناء التحديث.</p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default App;
