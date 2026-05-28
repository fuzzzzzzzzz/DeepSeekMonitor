const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deepseekAPI', {
  getCachedData: () => ipcRenderer.invoke('get-cached-data'),
  refreshData: () => ipcRenderer.invoke('refresh-data'),
  openPlatformLogin: () => ipcRenderer.invoke('open-platform-login'),
  getLoginStatus: () => ipcRenderer.invoke('get-login-status'),
  importCSV: () => ipcRenderer.invoke('import-csv'),
  exportCSV: () => ipcRenderer.invoke('export-csv'),
  getSetting: (key, defaultValue) => ipcRenderer.invoke('get-setting', key, defaultValue),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getApiKeyMasked: () => ipcRenderer.invoke('get-api-key-masked'),

  onDataRefreshed: (cb) => ipcRenderer.on('data-refreshed', (_e, d) => cb(d)),
  onRefreshError: (cb) => ipcRenderer.on('refresh-error', (_e, m) => cb(m)),
  onLoginSuccess: (cb) => ipcRenderer.on('login-success', (_e, d) => cb(d)),
});
