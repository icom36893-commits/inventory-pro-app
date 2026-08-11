import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-http-cache')
import path from 'node:path'
import { getDb } from '../database/db'
import { initSettingsIpc } from './ipc/settings'
import { initProductsIpc } from './ipc/products'
import { initPartiesIpc } from './ipc/parties'
import { initInvoicesIpc } from './ipc/invoices'
import { initTreasuryIpc } from './ipc/treasury'
import { initUsersIpc } from './ipc/users'
import { initDashboardIpc } from './ipc/dashboard'
import { initReportsIpc } from './ipc/reports'
import { initBasicDataIpc } from './ipc/basicData'
import { initLicenseIpc } from './ipc/license'
import { setupNotificationsIPC } from './ipc/notifications'
import { initStocktakeIpc } from './ipc/stocktake'
import { initAutoBackup } from './autoBackup'
import { initTelegramBot } from './telegramBot'
import { initUpdaterIpc } from './ipc/updater'
import { initEquipmentIpc } from './ipc/equipment'
import { initPermissionsIpc } from './ipc/permissions'
import { initFirebaseSync } from './firebaseSync'
import { initMobileCommandProcessor } from './mobileCommandProcessor'
import { setupStatementsHandlers } from './ipc/statements'
import { setupJournalsHandlers } from './ipc/journals'

export const ipcHandlers = new Map<string, Function>();
const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel: string, listener: any) => {
  ipcHandlers.set(channel, listener);
  originalHandle(channel, async (event, ...args) => {
    const localChannels = ['settings:get', 'settings:update', 'settings:getLocalIps', 'settings:setAutoStart', 'settings:getAutoStart', 'settings:installLocalUpdate'];
    
    if (localChannels.includes(channel)) {
      return listener(event, ...args);
    }
    
    try {
       const db = await getDb();
       const settings = await db.get('SELECT local_server_role, local_server_ip, local_server_port, server_mode, server_url FROM company_settings LIMIT 1');
       
       const isLocalClient = settings?.server_mode === 'offline' && settings?.local_server_role === 'client' && settings?.local_server_ip;
       const isOnlineClient = settings?.server_mode === 'online' && settings?.server_url;
       
       if (isLocalClient || isOnlineClient) {
           let targetUrl = '';
           if (isOnlineClient) {
               targetUrl = settings.server_url.endsWith('/') ? `${settings.server_url}api/ipc` : `${settings.server_url}/api/ipc`;
           } else {
               targetUrl = `http://${settings.local_server_ip}:${settings.local_server_port || 3000}/api/ipc`;
           }
           
           const response = await fetch(targetUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ channel, args })
           });
           const json = await response.json();
           if (json.success) return json.data;
           throw new Error(json.error || 'Server error');
       }
    } catch (e) {
       console.error('Error forwarding request:', e);
    }
    
    return listener(event, ...args);
  });
};


process.env.APP_ROOT = path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: false,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Force Save As dialog for all downloads
  win.webContents.session.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({
      defaultPath: item.getFilename()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Initialize all IPC handlers FIRST
  initSettingsIpc()
  initProductsIpc()
  initPartiesIpc()
  initInvoicesIpc()
  initTreasuryIpc()
  initUsersIpc()
  initDashboardIpc()
  initReportsIpc()
  initBasicDataIpc()
  initLicenseIpc()
  setupNotificationsIPC()
  initStocktakeIpc()
  initEquipmentIpc()
  initPermissionsIpc()
  initAutoBackup()
  initTelegramBot()
  initUpdaterIpc()
  initFirebaseSync()
  initMobileCommandProcessor()
  setupStatementsHandlers()
  setupJournalsHandlers()

  const isServerOnly = process.env.SERVER_ONLY === 'true';

  if (isServerOnly) {
    console.log("Running in SERVER ONLY mode. No UI will be shown.");
    getDb().then(async (db) => {
      const settings = await db.get('SELECT local_server_port, cloud_tunnel_active FROM company_settings LIMIT 1');
      import('./apiServer').then(({ startApiServer, startCloudTunnel }) => {
        const port = parseInt(settings?.local_server_port || '3000', 10);
        startApiServer(port);
        if (settings?.cloud_tunnel_active === 1) {
          console.log("Starting Auto Cloud Tunnel...");
          startCloudTunnel(port).then(url => {
            console.log(`Cloud Tunnel is active at: ${url}`);
            db.run('UPDATE company_settings SET cloud_tunnel_url = ?', url);
          });
        }
      });
    });
    return;
  }

  createWindow()
  
  const menuTemplate = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'فاتورة مبيعات جديدة',
          click: () => { win?.webContents.send('menu-action', 'new-sales'); }
        },
        {
          label: 'فاتورة مشتريات جديدة',
          click: () => { win?.webContents.send('menu-action', 'new-purchase'); }
        },
        { type: 'separator' },
        {
          label: 'أخذ نسخة احتياطية',
          click: () => { win?.webContents.send('menu-action', 'backup'); }
        },
        {
          label: 'استعادة نسخة احتياطية',
          click: () => { win?.webContents.send('menu-action', 'restore'); }
        },
        { type: 'separator' },
        {
          label: 'تثبيت تحديث محلي',
          click: () => { win?.webContents.send('menu-action', 'local-update'); }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          role: 'quit'
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'تحديث الواجهة',
          role: 'reload'
        },
        {
          label: 'تكبير حجم الشاشة',
          role: 'zoomIn'
        },
        {
          label: 'تصغير حجم الشاشة',
          role: 'zoomOut'
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'دليل المستخدم',
          click: () => { win?.webContents.send('menu-action', 'guide'); }
        },
        {
          label: 'البحث عن تحديثات',
          click: () => { win?.webContents.send('menu-action', 'update'); }
        },
        { type: 'separator' },
        {
          label: 'الدعم الفني',
          click: () => { win?.webContents.send('menu-action', 'support'); }
        },
        {
          label: 'حول البرنامج',
          click: () => { win?.webContents.send('menu-action', 'about'); }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(menuTemplate as any);
  Menu.setApplicationMenu(menu);

  // Start API server if configured as main and active
  getDb().then(async (db) => {
    const settings = await db.get('SELECT local_server_active, local_server_role, local_server_port, server_mode, cloud_tunnel_active FROM company_settings LIMIT 1');
    if (settings?.server_mode === 'offline' && settings?.local_server_role === 'main' && settings?.local_server_active === 1) {
      import('./apiServer').then(({ startApiServer, startCloudTunnel }) => {
        const port = parseInt(settings.local_server_port || '3000', 10);
        startApiServer(port);
        if (settings.cloud_tunnel_active === 1) {
          startCloudTunnel(port).then(url => {
            db.run('UPDATE company_settings SET cloud_tunnel_url = ?', url);
          });
        }
      });
    }
  });
})
