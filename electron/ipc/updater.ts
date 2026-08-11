import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';

export function initUpdaterIpc() {
  // Config
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // IPC handlers
  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result) {
        // Dev mode or skipped check. Emit not-available to stop the UI loading spinner.
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          windows[0].webContents.send('updater:not-available');
        }
      }
      return result;
    } catch (error: any) {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.send('updater:error', error.message || 'Error checking for updates');
      }
      return null;
    }
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // AutoUpdater events
  autoUpdater.on('update-available', (info) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('updater:available', info?.version);
    }
  });

  autoUpdater.on('update-not-available', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('updater:not-available');
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('updater:progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('updater:downloaded');
    }
  });

  autoUpdater.on('error', (err) => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('updater:error', err == null ? "unknown" : (err.stack || err).toString());
    }
  });
}
