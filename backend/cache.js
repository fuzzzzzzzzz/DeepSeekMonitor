const { insertBalance, getLatestBalance, getDailyUsageGrouped, setSetting, getSetting } = require('./db');

// 缓存完整的监控快照（JSON in settings table）
const SNAPSHOT_KEY = 'cached_snapshot';

function saveSnapshot(data) {
  if (!data) return;
  // 保存余额历史
  if (data.summary) {
    insertBalance(data.summary.balance, data.summary.bonusBalance, 0);
  }
  // 缓存完整快照到 settings
  setSetting(SNAPSHOT_KEY, JSON.stringify(data));
}

function getSnapshot() {
  const raw = getSetting(SNAPSHOT_KEY, '');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// 兼容旧代码
function loadCachedData() {
  const snap = getSnapshot();
  const balance = getLatestBalance();
  const usage7d = getDailyUsageGrouped(7);
  return { balance, usage7d, snapshot: snap };
}

function saveBalanceData(balanceData) {
  if (!balanceData) return;
  insertBalance(balanceData.total_balance || 0, balanceData.granted_balance || 0, balanceData.topped_up_balance || 0);
}

function saveUsageData(usageData) {
  // No-op: CSV import uses upsertDailyUsage directly
}

module.exports = { saveSnapshot, getSnapshot, loadCachedData, saveBalanceData, saveUsageData };
