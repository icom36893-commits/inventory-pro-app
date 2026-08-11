"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  invoices: {
    getAll: (filters) => electron.ipcRenderer.invoke("invoices:getAll", filters),
    create: (data) => electron.ipcRenderer.invoke("invoices:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("invoices:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("invoices:delete", id),
    getOne: (id) => electron.ipcRenderer.invoke("invoices:getOne", id),
    getUniqueBuyers: () => electron.ipcRenderer.invoke("invoices:getUniqueBuyers"),
    getLastPrice: (productId, partyId, type) => electron.ipcRenderer.invoke("invoices:getLastPrice", productId, partyId, type)
  },
  permissions: {
    getAll: () => electron.ipcRenderer.invoke("permissions:getAll"),
    update: (role, permissions) => electron.ipcRenderer.invoke("permissions:update", role, permissions)
  },
  products: {
    getAll: (params) => electron.ipcRenderer.invoke("products:getAll", params),
    search: (query) => electron.ipcRenderer.invoke("products:search", query),
    create: (data) => electron.ipcRenderer.invoke("products:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("products:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("products:delete", id),
    restoreFromInitial: (id) => electron.ipcRenderer.invoke("products:restoreFromInitial", id),
    getMovements: (id) => electron.ipcRenderer.invoke("products:getMovements", id)
  },
  parties: {
    getAll: (type) => electron.ipcRenderer.invoke("parties:getAll", type),
    create: (data) => electron.ipcRenderer.invoke("parties:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("parties:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("parties:delete", id),
    getTransactions: (partyId) => electron.ipcRenderer.invoke("parties:getTransactions", partyId)
  },
  treasury: {
    getTransactions: (filters) => electron.ipcRenderer.invoke("treasury:getTransactions", filters),
    createTransaction: (data) => electron.ipcRenderer.invoke("treasury:createTransaction", data),
    updateTransaction: (id, data) => electron.ipcRenderer.invoke("treasury:updateTransaction", id, data),
    deleteTransaction: (id) => electron.ipcRenderer.invoke("treasury:deleteTransaction", id),
    getBalance: (fundId) => electron.ipcRenderer.invoke("treasury:getBalance", fundId)
  },
  funds: {
    getAll: () => electron.ipcRenderer.invoke("funds:getAll"),
    create: (data) => electron.ipcRenderer.invoke("funds:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("funds:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("funds:delete", id)
  },
  statements: {
    get: (accountType, accountId, currency, fromDate, toDate) => electron.ipcRenderer.invoke("statement:get", accountType, accountId, currency, fromDate, toDate)
  },
  journals: {
    getAll: () => electron.ipcRenderer.invoke("journal:getAll"),
    getOne: (id) => electron.ipcRenderer.invoke("journal:getOne", id),
    create: (data, userId) => electron.ipcRenderer.invoke("journal:create", data, userId),
    update: (id, data, userId) => electron.ipcRenderer.invoke("journal:update", id, data, userId),
    delete: (id) => electron.ipcRenderer.invoke("journal:delete", id)
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (data) => electron.ipcRenderer.invoke("settings:update", data),
    exportBackup: () => electron.ipcRenderer.invoke("settings:exportBackup"),
    importBackup: () => electron.ipcRenderer.invoke("settings:importBackup"),
    selectDirectory: () => electron.ipcRenderer.invoke("settings:selectDirectory"),
    saveBase64File: (data) => electron.ipcRenderer.invoke("settings:saveBase64File", data),
    printToPDF: (data) => electron.ipcRenderer.invoke("settings:printToPDF", data),
    installLocalUpdate: () => electron.ipcRenderer.invoke("settings:installLocalUpdate"),
    closeFiscalYear: () => electron.ipcRenderer.invoke("settings:closeFiscalYear"),
    setAutoStart: (enabled) => electron.ipcRenderer.invoke("settings:setAutoStart", enabled),
    getAutoStart: () => electron.ipcRenderer.invoke("settings:getAutoStart"),
    recalculateBalances: () => electron.ipcRenderer.invoke("settings:recalculateBalances"),
    getLocalIps: () => electron.ipcRenderer.invoke("settings:getLocalIps"),
    startCloudTunnel: (port) => electron.ipcRenderer.invoke("settings:startCloudTunnel", port),
    stopCloudTunnel: () => electron.ipcRenderer.invoke("settings:stopCloudTunnel")
  },
  users: {
    login: (credentials) => electron.ipcRenderer.invoke("users:login", credentials),
    getAll: () => electron.ipcRenderer.invoke("users:getAll"),
    create: (data) => electron.ipcRenderer.invoke("users:create", data),
    update: (data) => electron.ipcRenderer.invoke("users:update", data),
    delete: (id) => electron.ipcRenderer.invoke("users:delete", id),
    updateStatus: (id, isActive) => electron.ipcRenderer.invoke("users:updateStatus", id, isActive)
  },
  stocktake: {
    getAll: () => electron.ipcRenderer.invoke("stocktake:getAll"),
    getById: (id) => electron.ipcRenderer.invoke("stocktake:getById", id),
    saveDraft: (data) => electron.ipcRenderer.invoke("stocktake:saveDraft", data),
    apply: (id) => electron.ipcRenderer.invoke("stocktake:apply", id),
    delete: (id) => electron.ipcRenderer.invoke("stocktake:delete", id)
  },
  dashboard: {
    getStats: () => electron.ipcRenderer.invoke("dashboard:getStats"),
    getCharts: () => electron.ipcRenderer.invoke("dashboard:getCharts")
  },
  reports: {
    getIncomeStatement: (filters) => electron.ipcRenderer.invoke("reports:getIncomeStatement", filters),
    getSales: (filters) => electron.ipcRenderer.invoke("reports:getSales", filters),
    getPurchases: (filters) => electron.ipcRenderer.invoke("reports:getPurchases", filters),
    getPurchasePrices: (filters) => electron.ipcRenderer.invoke("reports:getPurchasePrices", filters),
    getInventoryMovement: (filters) => electron.ipcRenderer.invoke("reports:getInventoryMovement", filters),
    getBalances: (filters) => electron.ipcRenderer.invoke("reports:getBalances", filters),
    getBalanceSheet: () => electron.ipcRenderer.invoke("reports:getBalanceSheet")
  },
  notifications: {
    getAll: () => electron.ipcRenderer.invoke("notifications:getAll"),
    markAsRead: (id) => electron.ipcRenderer.invoke("notifications:markAsRead", id),
    markAllAsRead: () => electron.ipcRenderer.invoke("notifications:markAllAsRead"),
    clearAll: () => electron.ipcRenderer.invoke("notifications:clearAll"),
    checkLowStock: () => electron.ipcRenderer.invoke("notifications:checkLowStock"),
    add: (data) => electron.ipcRenderer.invoke("notifications:add", data)
  },
  basicData: {
    getCategories: () => electron.ipcRenderer.invoke("basicData:getCategories"),
    createCategory: (data) => electron.ipcRenderer.invoke("basicData:createCategory", data),
    deleteCategory: (id) => electron.ipcRenderer.invoke("basicData:deleteCategory", id),
    getUnits: () => electron.ipcRenderer.invoke("basicData:getUnits"),
    createUnit: (data) => electron.ipcRenderer.invoke("basicData:createUnit", data),
    deleteUnit: (id) => electron.ipcRenderer.invoke("basicData:deleteUnit", id),
    getWarehouses: () => electron.ipcRenderer.invoke("basicData:getWarehouses"),
    createWarehouse: (data) => electron.ipcRenderer.invoke("basicData:createWarehouse", data),
    deleteWarehouse: (id) => electron.ipcRenderer.invoke("basicData:deleteWarehouse", id),
    getTreasuryCategories: () => electron.ipcRenderer.invoke("basicData:getTreasuryCategories"),
    createTreasuryCategory: (data) => electron.ipcRenderer.invoke("basicData:createTreasuryCategory", data),
    deleteTreasuryCategory: (id) => electron.ipcRenderer.invoke("basicData:deleteTreasuryCategory", id),
    getFundCategories: () => electron.ipcRenderer.invoke("basicData:getFundCategories"),
    createFundCategory: (data) => electron.ipcRenderer.invoke("basicData:createFundCategory", data),
    deleteFundCategory: (id) => electron.ipcRenderer.invoke("basicData:deleteFundCategory", id)
  },
  license: {
    verify: (serialKey) => electron.ipcRenderer.invoke("license:verify", serialKey)
  },
  updater: {
    checkForUpdates: () => electron.ipcRenderer.invoke("updater:check"),
    installUpdate: () => electron.ipcRenderer.invoke("updater:install"),
    onUpdateAvailable: (callback) => {
      electron.ipcRenderer.removeAllListeners("updater:available");
      electron.ipcRenderer.on("updater:available", (_event, version) => callback(version));
    },
    onUpdateNotAvailable: (callback) => {
      electron.ipcRenderer.removeAllListeners("updater:not-available");
      electron.ipcRenderer.on("updater:not-available", callback);
    },
    onUpdateProgress: (callback) => {
      electron.ipcRenderer.removeAllListeners("updater:progress");
      electron.ipcRenderer.on("updater:progress", (_event, progress) => callback(progress));
    },
    onUpdateDownloaded: (callback) => {
      electron.ipcRenderer.removeAllListeners("updater:downloaded");
      electron.ipcRenderer.on("updater:downloaded", callback);
    },
    onError: (callback) => {
      electron.ipcRenderer.removeAllListeners("updater:error");
      electron.ipcRenderer.on("updater:error", (_event, error) => callback(error));
    }
  },
  equipment: {
    getAll: () => electron.ipcRenderer.invoke("equipment:getAll"),
    create: (data) => electron.ipcRenderer.invoke("equipment:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("equipment:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("equipment:delete", id),
    getLoans: () => electron.ipcRenderer.invoke("equipment:getLoans"),
    loan: (data) => electron.ipcRenderer.invoke("equipment:loan", data),
    return: (loanId, data) => electron.ipcRenderer.invoke("equipment:return", loanId, data)
  },
  onBackupSuccess: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  },
  onMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  },
  onMenuAction: (callback) => {
    electron.ipcRenderer.removeAllListeners("menu-action");
    electron.ipcRenderer.on("menu-action", (_event, action) => callback(action));
  }
});
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
