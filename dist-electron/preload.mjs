"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  invoices: {
    getAll: (filters) => electron.ipcRenderer.invoke("invoices:getAll", filters),
    create: (data) => electron.ipcRenderer.invoke("invoices:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("invoices:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("invoices:delete", id),
    getOne: (id) => electron.ipcRenderer.invoke("invoices:getOne", id)
  },
  products: {
    getAll: () => electron.ipcRenderer.invoke("products:getAll"),
    search: (query) => electron.ipcRenderer.invoke("products:search", query),
    create: (data) => electron.ipcRenderer.invoke("products:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("products:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("products:delete", id)
  },
  parties: {
    getAll: (type) => electron.ipcRenderer.invoke("parties:getAll", type),
    create: (data) => electron.ipcRenderer.invoke("parties:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("parties:update", id, data),
    getTransactions: (partyId) => electron.ipcRenderer.invoke("parties:getTransactions", partyId)
  },
  treasury: {
    getTransactions: (filters) => electron.ipcRenderer.invoke("treasury:getTransactions", filters),
    createTransaction: (data) => electron.ipcRenderer.invoke("treasury:createTransaction", data),
    getBalance: () => electron.ipcRenderer.invoke("treasury:getBalance")
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (data) => electron.ipcRenderer.invoke("settings:update", data)
  },
  onMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
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
