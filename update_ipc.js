const fs = require('fs');
const os = require('os');
const path = require('path');

// 1. Update preload.ts
const preloadPath = 'd:/os/inventory-pro-app/electron/preload.ts';
let preloadContent = fs.readFileSync(preloadPath, 'utf8');
if (!preloadContent.includes('getLocalIps:')) {
  preloadContent = preloadContent.replace(
    /recalculateBalances: \(\) => ipcRenderer\.invoke\('settings:recalculateBalances'\),/g,
    `recalculateBalances: () => ipcRenderer.invoke('settings:recalculateBalances'),\n    getLocalIps: () => ipcRenderer.invoke('settings:getLocalIps'),`
  );
  fs.writeFileSync(preloadPath, preloadContent, 'utf8');
}

// 2. Update settings.ts IPC
const settingsIpcPath = 'd:/os/inventory-pro-app/electron/ipc/settings.ts';
let settingsIpcContent = fs.readFileSync(settingsIpcPath, 'utf8');
if (!settingsIpcContent.includes('settings:getLocalIps')) {
  const osImport = `import os from 'node:os';\n`;
  if (!settingsIpcContent.includes('import os from')) {
    settingsIpcContent = osImport + settingsIpcContent;
  }
  
  const getIpsHandler = `
  ipcMain.handle('settings:getLocalIps', async () => {
    try {
      const interfaces = os.networkInterfaces();
      const addresses = [];
      for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
          const address = interfaces[k][k2];
          if (address.family === 'IPv4' && !address.internal) {
            addresses.push({ name: k, ip: address.address });
          }
        }
      }
      return addresses;
    } catch (error) {
      console.error('Error fetching IPs:', error);
      return [];
    }
  });
`;
  settingsIpcContent = settingsIpcContent.replace(/export function initSettingsIpc\(\) \{/, `export function initSettingsIpc() {${getIpsHandler}`);
  fs.writeFileSync(settingsIpcPath, settingsIpcContent, 'utf8');
}
console.log('IPC setup complete.');
