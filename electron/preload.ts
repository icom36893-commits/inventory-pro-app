import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  invoices: {
    getAll: (filters: any) => ipcRenderer.invoke('invoices:getAll', filters),
    create: (data: any) => ipcRenderer.invoke('invoices:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('invoices:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('invoices:delete', id),
    getOne: (id: number) => ipcRenderer.invoke('invoices:getOne', id),
    getUniqueBuyers: () => ipcRenderer.invoke('invoices:getUniqueBuyers'),
    getLastPrice: (productId: number, partyId: number, type: string) => ipcRenderer.invoke('invoices:getLastPrice', productId, partyId, type),
  },
  permissions: {
    getAll: () => ipcRenderer.invoke('permissions:getAll'),
    update: (role: string, permissions: string[]) => ipcRenderer.invoke('permissions:update', role, permissions),
  },
  products: {
    getAll: (params?: any) => ipcRenderer.invoke('products:getAll', params),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('products:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    restoreFromInitial: (id: number) => ipcRenderer.invoke('products:restoreFromInitial', id),
    getMovements: (id: number) => ipcRenderer.invoke('products:getMovements', id),
  },
  parties: {
    getAll: (type: string) => ipcRenderer.invoke('parties:getAll', type),
    create: (data: any) => ipcRenderer.invoke('parties:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('parties:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('parties:delete', id),
    getTransactions: (partyId: number) => ipcRenderer.invoke('parties:getTransactions', partyId),
  },
  treasury: {
    getTransactions: (filters: any) => ipcRenderer.invoke('treasury:getTransactions', filters),
    createTransaction: (data: any) => ipcRenderer.invoke('treasury:createTransaction', data),
    updateTransaction: (id: number, data: any) => ipcRenderer.invoke('treasury:updateTransaction', id, data),
    deleteTransaction: (id: number) => ipcRenderer.invoke('treasury:deleteTransaction', id),
    getBalance: (fundId?: number) => ipcRenderer.invoke('treasury:getBalance', fundId),
  },
  funds: {
    getAll: () => ipcRenderer.invoke('funds:getAll'),
    create: (data: any) => ipcRenderer.invoke('funds:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('funds:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('funds:delete', id),
  },
  statements: {
    get: (accountType: 'party' | 'fund', accountId: number, currency: 'IQD' | 'USD', fromDate?: string, toDate?: string) => 
      ipcRenderer.invoke('statement:get', accountType, accountId, currency, fromDate, toDate),
  },
  journals: {
    getAll: () => ipcRenderer.invoke('journal:getAll'),
    getOne: (id: number) => ipcRenderer.invoke('journal:getOne', id),
    create: (data: any, userId: number) => ipcRenderer.invoke('journal:create', data, userId),
    update: (id: number, data: any, userId: number) => ipcRenderer.invoke('journal:update', id, data, userId),
    delete: (id: number) => ipcRenderer.invoke('journal:delete', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data: any) => ipcRenderer.invoke('settings:update', data),
    exportBackup: () => ipcRenderer.invoke('settings:exportBackup'),
    importBackup: () => ipcRenderer.invoke('settings:importBackup'),
    selectDirectory: () => ipcRenderer.invoke('settings:selectDirectory'),
    saveBase64File: (data: any) => ipcRenderer.invoke('settings:saveBase64File', data),
    printToPDF: (data: any) => ipcRenderer.invoke('settings:printToPDF', data),
    installLocalUpdate: () => ipcRenderer.invoke('settings:installLocalUpdate'),
    closeFiscalYear: () => ipcRenderer.invoke('settings:closeFiscalYear'),
    setAutoStart: (enabled: boolean) => ipcRenderer.invoke('settings:setAutoStart', enabled),
    getAutoStart: () => ipcRenderer.invoke('settings:getAutoStart'),
    recalculateBalances: () => ipcRenderer.invoke('settings:recalculateBalances'),
    getLocalIps: () => ipcRenderer.invoke('settings:getLocalIps'),
    startCloudTunnel: (port: number) => ipcRenderer.invoke('settings:startCloudTunnel', port),
    stopCloudTunnel: () => ipcRenderer.invoke('settings:stopCloudTunnel'),
  },
  users: {
    login: (credentials: any) => ipcRenderer.invoke('users:login', credentials),
    getAll: () => ipcRenderer.invoke('users:getAll'),
    create: (data: any) => ipcRenderer.invoke('users:create', data),
    update: (data: any) => ipcRenderer.invoke('users:update', data),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
    updateStatus: (id: number, isActive: boolean) => ipcRenderer.invoke('users:updateStatus', id, isActive),
  },
  stocktake: {
    getAll: () => ipcRenderer.invoke('stocktake:getAll'),
    getById: (id: number) => ipcRenderer.invoke('stocktake:getById', id),
    saveDraft: (data: any) => ipcRenderer.invoke('stocktake:saveDraft', data),
    apply: (id: number) => ipcRenderer.invoke('stocktake:apply', id),
    delete: (id: number) => ipcRenderer.invoke('stocktake:delete', id)
  },
  dashboard: {
    getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    getCharts: () => ipcRenderer.invoke('dashboard:getCharts'),
  },
  reports: {
    getIncomeStatement: (filters: any) => ipcRenderer.invoke('reports:getIncomeStatement', filters),
    getSales: (filters: any) => ipcRenderer.invoke('reports:getSales', filters),
    getPurchases: (filters: any) => ipcRenderer.invoke('reports:getPurchases', filters),
    getPurchasePrices: (filters: any) => ipcRenderer.invoke('reports:getPurchasePrices', filters),
    getInventoryMovement: (filters: any) => ipcRenderer.invoke('reports:getInventoryMovement', filters),
    getBalances: (filters: any) => ipcRenderer.invoke('reports:getBalances', filters),
    getBalanceSheet: () => ipcRenderer.invoke('reports:getBalanceSheet'),
  },
  notifications: {
    getAll: () => ipcRenderer.invoke('notifications:getAll'),
    markAsRead: (id: number) => ipcRenderer.invoke('notifications:markAsRead', id),
    markAllAsRead: () => ipcRenderer.invoke('notifications:markAllAsRead'),
    clearAll: () => ipcRenderer.invoke('notifications:clearAll'),
    checkLowStock: () => ipcRenderer.invoke('notifications:checkLowStock'),
    add: (data: { text: string, type: string }) => ipcRenderer.invoke('notifications:add', data),
  },
  basicData: {
    getCategories: () => ipcRenderer.invoke('basicData:getCategories'),
    createCategory: (data: any) => ipcRenderer.invoke('basicData:createCategory', data),
    deleteCategory: (id: number) => ipcRenderer.invoke('basicData:deleteCategory', id),
    getUnits: () => ipcRenderer.invoke('basicData:getUnits'),
    createUnit: (data: any) => ipcRenderer.invoke('basicData:createUnit', data),
    deleteUnit: (id: number) => ipcRenderer.invoke('basicData:deleteUnit', id),
    getWarehouses: () => ipcRenderer.invoke('basicData:getWarehouses'),
    createWarehouse: (data: any) => ipcRenderer.invoke('basicData:createWarehouse', data),
    deleteWarehouse: (id: number) => ipcRenderer.invoke('basicData:deleteWarehouse', id),
    getTreasuryCategories: () => ipcRenderer.invoke('basicData:getTreasuryCategories'),
    createTreasuryCategory: (data: any) => ipcRenderer.invoke('basicData:createTreasuryCategory', data),
    deleteTreasuryCategory: (id: number) => ipcRenderer.invoke('basicData:deleteTreasuryCategory', id),
    getFundCategories: () => ipcRenderer.invoke('basicData:getFundCategories'),
    createFundCategory: (data: any) => ipcRenderer.invoke('basicData:createFundCategory', data),
    deleteFundCategory: (id: number) => ipcRenderer.invoke('basicData:deleteFundCategory', id),
  },
  license: {
    verify: (serialKey: string) => ipcRenderer.invoke('license:verify', serialKey)
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback: (version: string) => void) => {
      ipcRenderer.removeAllListeners('updater:available');
      ipcRenderer.on('updater:available', (_event, version) => callback(version));
    },
    onUpdateNotAvailable: (callback: () => void) => {
      ipcRenderer.removeAllListeners('updater:not-available');
      ipcRenderer.on('updater:not-available', callback);
    },
    onUpdateProgress: (callback: (progress: any) => void) => {
      ipcRenderer.removeAllListeners('updater:progress');
      ipcRenderer.on('updater:progress', (_event, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.removeAllListeners('updater:downloaded');
      ipcRenderer.on('updater:downloaded', callback);
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.removeAllListeners('updater:error');
      ipcRenderer.on('updater:error', (_event, error) => callback(error));
    },
  },
  equipment: {
    getAll: () => ipcRenderer.invoke('equipment:getAll'),
    create: (data: any) => ipcRenderer.invoke('equipment:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('equipment:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('equipment:delete', id),
    getLoans: () => ipcRenderer.invoke('equipment:getLoans'),
    loan: (data: any) => ipcRenderer.invoke('equipment:loan', data),
    return: (loanId: number, data: any) => ipcRenderer.invoke('equipment:return', loanId, data),
  },
  onBackupSuccess: (callback: (data: any) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },
  onMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.removeAllListeners('menu-action');
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  }
})

// Keep the old ipcRenderer for backward compatibility with the boilerplate if needed
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
