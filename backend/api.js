// DeepSeek 平台内部 API 客户端
// 参照: jasmine889966/DeepSeekMonitor
const { getSetting } = require('./db');
const { decrypt } = require('./crypto');

const BASE = 'https://platform.deepseek.com';

function getSession() {
  const tokenEnc = getSetting('ds_token', '');
  const cookieEnc = getSetting('ds_cookie', '');
  if (!tokenEnc) return null;
  return {
    token: decrypt(tokenEnc),
    cookie: decrypt(cookieEnc),
  };
}

function headers(session) {
  return {
    'Accept': '*/*',
    'Authorization': `Bearer ${session.token}`,
    'Cookie': session.cookie,
    'x-app-version': '1.0.0',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1',
    'Referer': 'https://platform.deepseek.com/usage',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };
}

async function apiCall(path, session) {
  const url = BASE + path;
  const res = await fetch(url, { headers: headers(session) });
  if (res.status === 401 || res.status === 403) throw new Error('登录已过期，请重新登录');
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || 'API 返回错误');
  const biz = json.data;
  if (!biz || (biz.biz_code && biz.biz_code !== 0)) throw new Error(biz?.biz_msg || '业务错误');
  return biz.biz_data || biz;
}

// ---- Public API ----

async function fetchSummary() {
  const s = getSession();
  if (!s) throw new Error('未登录，请先登录 DeepSeek 平台');
  const raw = await apiCall('/api/v0/users/get_user_summary', s);
  const normal = raw.normal_wallets?.[0];
  const bonus = raw.bonus_wallets?.[0];
  const monthlyCost = raw.monthly_costs?.[0];
  // summary API 返回值可能是直接字符串或 { value: ... } 包装
  const val = (v) => (v && typeof v === 'object' && v.value != null) ? v.value : v;
  return {
    balance: parseFloat(val(normal?.balance) || 0),
    bonusBalance: parseFloat(val(bonus?.balance) || 0),
    currency: normal?.currency || monthlyCost?.currency || 'CNY',
    estimatedTokens: parseInt(val(raw.total_available_token_estimation) || 0, 10),
    monthlyCost: parseFloat(val(monthlyCost?.amount) || 0),
    monthlyTokens: parseInt(val(raw.monthly_token_usage) || val(raw.monthly_usage) || 0, 10),
    currentToken: parseInt(val(raw.current_token) || 0, 10),
  };
}

async function fetchUsage(month, year) {
  const s = getSession();
  if (!s) throw new Error('未登录');
  const now = new Date();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();
  const raw = await apiCall(`/api/v0/usage/amount?month=${m}&year=${y}`, s);
  return {
    month: m, year: y,
    modelTotals: mapModels(raw.total),
    dailyTotals: mapDays(raw.days),
  };
}

async function fetchCosts(month, year) {
  const s = getSession();
  if (!s) throw new Error('未登录');
  const now = new Date();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();
  const rawList = await apiCall(`/api/v0/usage/cost?month=${m}&year=${y}`, s);
  const raw = Array.isArray(rawList) ? rawList[0] : rawList;
  return {
    month: m, year: y,
    currency: raw.currency || 'CNY',
    modelTotals: mapModels(raw.total),
    dailyTotals: mapDays(raw.days),
  };
}

async function refreshAllData() {
  const s = getSession();
  if (!s) return null;
  const now = new Date();
  const [summary, usage, costs] = await Promise.all([
    fetchSummary(),
    fetchUsage(now.getMonth() + 1, now.getFullYear()),
    fetchCosts(now.getMonth() + 1, now.getFullYear()),
  ]);
  return { summary, usage, costs, time: new Date().toISOString() };
}

// ---- Helpers ----

function mapModels(dtos) {
  if (!dtos) return [];
  // 过滤掉合并条目（如 "deepseek-chat & deepseek-reasoner"）
  return dtos
    .filter(d => d.model && !d.model.includes('&'))
    .map(d => ({
      model: d.model,
      metrics: (d.usage || []).map(u => ({
        type: normalizeType(u.type),
        amount: parseFloat(u.amount?.value ?? u.amount ?? 0),
      })),
    }));
}

// API 返回大写 SNAKE_CASE，前端用 camelCase —— 统一转换
function normalizeType(type) {
  if (!type) return '';
  // 已经是 camelCase（小写开头）就直接返回
  if (/^[a-z]/.test(type)) return type;
  // UPPER_SNAKE_CASE → camelCase
  return type.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapDays(dtos) {
  if (!dtos) return [];
  return dtos.map(d => ({
    date: d.date,
    models: mapModels(d.data),
  }));
}

module.exports = { fetchSummary, fetchUsage, fetchCosts, refreshAllData, getSession };
