// ============================================
// Navigation, Events, Settings
// ============================================

// ---- Sidebar Navigation ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

function switchPage(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${name}"]`);
  if (nav) nav.classList.add('active');
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  // 切到对应页时重新渲染图表（修复隐藏页面 canvas 尺寸为 0 的问题）
  if (!App.data) return;
  setTimeout(() => {
    const { usage, costs } = App.data;
    switch (name) {
      case 'overview':
        if (costs.dailyTotals.length) renderCostTrend(costs.dailyTotals);
        if (usage.dailyTotals.length) renderTokenTrend(usage.dailyTotals);
        break;
      case 'usage':
        if (usage.dailyTotals.length) {
          renderRequestsTrend(usage.dailyTotals);
          renderDailyTokens(usage.dailyTotals);
        }
        break;
      case 'costs':
        if (costs.dailyTotals.length) renderDailyCost(costs.dailyTotals);
        break;
    }
  }, 100);
}

// ---- Refresh Button ----
document.getElementById('btn-refresh').addEventListener('click', () => App.refresh());

// ---- Login Button ----
document.getElementById('btn-login').addEventListener('click', async () => {
  try {
    await window.deepseekAPI.openPlatformLogin();
    showToast('正在打开登录窗口...', '');
  } catch (err) {
    showToast('打开失败：' + err.message, 'error');
  }
});

// ---- Login Success ----
window.deepseekAPI.onLoginSuccess((info) => {
  showToast('登录成功！Token: ' + info.token, 'success');
});

// ---- Data Refreshed ----
window.deepseekAPI.onDataRefreshed((data) => {
  App.data = data;
  App.renderAll();
});

// ---- Refresh Error ----
window.deepseekAPI.onRefreshError((msg) => {
  showToast(msg, 'error');
});

// ---- Settings: Refresh Stepper ----
let refreshMin = 10;
document.getElementById('stepper-down').addEventListener('click', async () => {
  if (refreshMin > 1) refreshMin--;
  document.getElementById('refresh-minutes').textContent = refreshMin;
  await window.deepseekAPI.setSetting('refresh_interval', String(refreshMin));
});
document.getElementById('stepper-up').addEventListener('click', async () => {
  if (refreshMin < 120) refreshMin++;
  document.getElementById('refresh-minutes').textContent = refreshMin;
  await window.deepseekAPI.setSetting('refresh_interval', String(refreshMin));
});

// ---- Settings: Alert Thresholds ----
document.getElementById('alert-threshold').addEventListener('change', async (e) => {
  await window.deepseekAPI.setSetting('alert_threshold', e.target.value);
});
document.getElementById('cost-threshold').addEventListener('change', async (e) => {
  await window.deepseekAPI.setSetting('cost_threshold', e.target.value);
});

// ---- Settings: Auto Launch ----
let autoLaunchOn = false;
document.getElementById('toggle-autolaunch').addEventListener('click', async () => {
  autoLaunchOn = !autoLaunchOn;
  const btn = document.getElementById('toggle-autolaunch');
  const label = document.getElementById('autolaunch-status');
  if (autoLaunchOn) { btn.classList.add('on'); label.textContent = '已开启'; }
  else { btn.classList.remove('on'); label.textContent = '关闭'; }
  await window.deepseekAPI.setSetting('auto_launch', autoLaunchOn ? 'true' : 'false');
});

// ---- Settings: Theme ----
let isDark = false;
document.getElementById('toggle-theme').addEventListener('click', async () => {
  isDark = !isDark;
  const btn = document.getElementById('toggle-theme');
  const label = document.getElementById('theme-status');
  if (isDark) { btn.classList.add('on'); label.textContent = '深色'; document.documentElement.setAttribute('data-theme', 'dark'); }
  else { btn.classList.remove('on'); label.textContent = '浅色'; document.documentElement.setAttribute('data-theme', 'light'); }
  await window.deepseekAPI.setSetting('theme', isDark ? 'dark' : 'light');
});

// ---- Settings: Logout ----
document.getElementById('btn-logout').addEventListener('click', async () => {
  await window.deepseekAPI.setSetting('ds_token', '');
  await window.deepseekAPI.setSetting('ds_cookie', '');
  App.data = null;
  App.showLoginPrompt();
  showToast('已清除登录信息', '');
});

// ---- Settings: Clear Alerts ----
document.getElementById('btn-clear-alerts').addEventListener('click', () => {
  document.getElementById('alerts-list').innerHTML = '';
  document.getElementById('alerts-empty').style.display = 'block';
});

// ---- Load Settings ----
async function loadSettings() {
  refreshMin = parseInt(await window.deepseekAPI.getSetting('refresh_interval', '10'), 10) || 10;
  document.getElementById('refresh-minutes').textContent = refreshMin;
  document.getElementById('alert-threshold').value = await window.deepseekAPI.getSetting('alert_threshold', '10');
  document.getElementById('cost-threshold').value = await window.deepseekAPI.getSetting('cost_threshold', '100');

  // Theme
  const savedTheme = await window.deepseekAPI.getSetting('theme', 'light');
  isDark = savedTheme === 'dark';
  document.getElementById('theme-status').textContent = isDark ? '深色' : '浅色';
  if (isDark) document.getElementById('toggle-theme').classList.add('on');
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  // Auto launch
  autoLaunchOn = (await window.deepseekAPI.getSetting('auto_launch', 'false')) === 'true';
  document.getElementById('autolaunch-status').textContent = autoLaunchOn ? '已开启' : '关闭';
  if (autoLaunchOn) document.getElementById('toggle-autolaunch').classList.add('on');

  // Token preview
  const status = await window.deepseekAPI.getLoginStatus();
  const preview = document.getElementById('token-preview');
  if (preview) preview.textContent = status.isLoggedIn ? '已登录' : '未登录';
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  App.init();
});
