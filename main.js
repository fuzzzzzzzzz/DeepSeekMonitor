const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const { initDatabase, getSetting, setSetting } = require('./backend/db');
const { refreshAllData } = require('./backend/api');
const { loadCachedData, saveSnapshot, getSnapshot } = require('./backend/cache');
const { start, stop, setWindow } = require('./backend/scheduler');
const { importCSV, exportCSV } = require('./backend/csv');
const { encrypt, decrypt } = require('./backend/crypto');
const { openLoginWindow, getLoginStatus } = require('./backend/platform');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180, height: 760, minWidth: 1080, minHeight: 720,
    frame: true, resizable: true,
    autoHideMenuBar: true,
    title: 'DeepSeek Monitor',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  setWindow(mainWindow);
  mainWindow.on('close', (event) => {
    if (!isQuitting) { event.preventDefault(); mainWindow.hide(); }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow.show() },
    { label: '手动刷新', click: () => triggerRefresh() },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.setToolTip('DeepSeek Monitor');
  tray.on('double-click', () => mainWindow.show());
}

async function triggerRefresh() {
  try {
    const data = await refreshAllData();
    if (data) {
      saveSnapshot(data);
      const cached = getSnapshot();
      if (mainWindow) {
        mainWindow.webContents.send('data-refreshed', { ...cached, time: new Date().toISOString() });
      }
      checkAlerts(data.summary);
    }
  } catch (err) {
    if (mainWindow) mainWindow.webContents.send('refresh-error', err.message);
  }
}

function checkAlerts(summary) {
  if (!summary) return;
  const alertEnabled = getSetting('alert_enabled', 'false');
  if (alertEnabled !== 'true') return;
  const threshold = parseFloat(getSetting('alert_threshold', '10'));
  if (summary.balance < threshold) {
    const lastAlert = getSetting('last_alert_balance', '999999');
    if (parseFloat(lastAlert) >= threshold) {
      setSetting('last_alert_balance', String(summary.balance));
      new Notification({
        title: 'DeepSeek 余额不足',
        body: `当前余额 ¥${summary.balance.toFixed(2)}，低于 ¥${threshold.toFixed(2)}`,
        urgency: 'critical',
      }).show();
    }
  } else {
    setSetting('last_alert_balance', String(summary.balance));
  }
}

// ---- IPC ----

ipcMain.handle('get-cached-data', () => getSnapshot());

ipcMain.handle('refresh-data', async () => {
  const data = await refreshAllData();
  if (data) saveSnapshot(data);
  return getSnapshot();
});

ipcMain.handle('open-platform-login', () => {
  openLoginWindow((info) => {
    if (mainWindow) {
      mainWindow.webContents.send('login-success', info);
      triggerRefresh();
    }
  });
  return { success: true };
});

ipcMain.handle('get-login-status', () => getLoginStatus());

ipcMain.handle('import-csv', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'CSV/ZIP', extensions: ['csv', 'zip'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return { success: false, message: '已取消' };
  const count = importCSV(result.filePaths[0]);
  setSetting('last_import_time', new Date().toISOString());
  return { success: true, count, path: result.filePaths[0] };
});

ipcMain.handle('export-csv', async () => {
  const { usage7d } = loadCachedData();
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `deepseek-usage-${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (result.canceled || !result.filePath) return { success: false, message: '已取消' };
  const { getDailyUsage } = require('./backend/db');
  exportCSV(result.filePath, getDailyUsage(365));
  return { success: true, path: result.filePath };
});

ipcMain.handle('get-setting', (_e, key, defaultValue) => getSetting(key, defaultValue));
ipcMain.handle('set-setting', (_e, key, value) => {
  if (key === 'api_key_raw') setSetting('api_key_encrypted', encrypt(value));
  if (key === 'refresh_interval') {
    const m = parseInt(value, 10);
    m > 0 ? start(m, triggerRefresh) : stop();
  }
  if (key === 'alert_threshold') setSetting('last_alert_balance', '999999');
  return setSetting(key, value);
});

ipcMain.handle('get-api-key-masked', () => {
  const enc = getSetting('api_key_encrypted', '');
  if (!enc) return '';
  const dec = decrypt(enc);
  return dec && dec.length > 6 ? dec.slice(0, 4) + '****' + dec.slice(-4) : '****';
});

// ---- Lifecycle ----

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
  createTray();

  // 开机自启
  if (getSetting('auto_launch', 'false') === 'true') {
    try {
      const AutoLaunch = require('electron-auto-launch');
      new AutoLaunch({ name: 'DeepSeek Monitor' }).enable().catch(() => {});
    } catch {}
  }

  // 定时刷新
  const interval = parseInt(getSetting('refresh_interval', '10'), 10);
  if (interval > 0) start(interval, triggerRefresh);

  // 如果已登录，启动时刷新一次
  if (getLoginStatus().isLoggedIn) setTimeout(triggerRefresh, 1500);
});

app.on('before-quit', () => { isQuitting = true; stop(); });
