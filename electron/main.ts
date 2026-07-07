import { app, BrowserWindow } from 'electron'
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('disable-http-cache')
import path from 'node:path'
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
    autoHideMenuBar: true,
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
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
  createWindow()
  
  // Initialize all IPC handlers
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
  initAutoBackup()
  initTelegramBot()
  initUpdaterIpc()
})
