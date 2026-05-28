// ============================================
// App State & Rendering
// ============================================

const App = {
  data: null, // { summary, usage, costs, time }

  async init() {
    const cached = await window.deepseekAPI.getCachedData();
    console.log('App.init: cached data =', cached ? 'YES' : 'NO');
    if (cached) {
      console.log('  summary:', cached.summary);
      console.log('  usage days:', cached.usage?.dailyTotals?.length);
      console.log('  costs days:', cached.costs?.dailyTotals?.length);
      this.data = cached; this.renderAll();
    }
    const loginStatus = await window.deepseekAPI.getLoginStatus();
    console.log('App.init: logged in =', loginStatus.isLoggedIn);
    if (!loginStatus.isLoggedIn) {
      this.showLoginPrompt();
    }
  },

  async refresh() {
    const btn = document.getElementById('btn-refresh');
    if (btn) btn.style.animation = 'spin 0.6s linear';
    try {
      this.data = await window.deepseekAPI.refreshData();
      if (this.data) {
        this.renderAll();
        updateStatus('已连接', formatTime(this.data.time), '✅');
      }
    } catch (err) {
      updateStatus('刷新失败', err.message, '⚠️');
    } finally {
      if (btn) btn.style.animation = '';
    }
  },

  showLoginPrompt() {
    updateStatus('等待登录', '请点击登录按钮以连接 DeepSeek 平台', '⏳');
    for (const id of ['m-balance','m-monthly-cost','m-today-cost','m-today-tokens','m-requests','m-total-tokens']) {
      document.getElementById(id).textContent = '--';
    }
  },

  renderAll() {
    if (!this.data) { console.log('renderAll: no data'); return; }
    try {
      const { summary, usage, costs } = this.data;
      console.log('renderAll: rendering overview...');
      this.renderOverview(summary, usage, costs);
      console.log('renderAll: rendering usage...');
      this.renderUsage(usage);
      console.log('renderAll: rendering costs...');
      this.renderCosts(costs);
      console.log('renderAll: rendering models...');
      this.renderModels(usage, costs);
      updateStatus('已连接', `${formatMoney(summary.balance)} · 月消费 ${formatMoney(summary.monthlyCost)}`, '✅');
      console.log('renderAll: done');
    } catch(e) {
      updateStatus('渲染错误', e.message, '⚠️');
      console.error('renderAll error:', e.message, e.stack);
    }
  },

  // ---- Overview ----
  renderOverview(summary, usage, costs) {
    document.getElementById('m-balance').textContent = formatMoney(summary.balance);
    document.getElementById('m-monthly-cost').textContent = formatMoney(summary.monthlyCost);
    document.getElementById('m-total-tokens').textContent = formatCompact(summary.monthlyTokens);
    document.getElementById('m-requests').textContent = formatCompact(summary.currentToken);

    // Today's data from dailyTotals
    const today = new Date().toISOString().slice(0, 10);
    const todayUsage = usage.dailyTotals.find(d => d.date === today);
    const todayCost = costs.dailyTotals.find(d => d.date === today);

    let todayTokens = 0, todayCostVal = 0;
    if (todayUsage) todayUsage.models.forEach(m => m.metrics.forEach(u => { todayTokens += u.amount; }));
    if (todayCost) todayCost.models.forEach(m => m.metrics.forEach(u => { todayCostVal += u.amount; }));

    document.getElementById('m-today-tokens').textContent = formatCompact(todayTokens);
    document.getElementById('m-today-cost').textContent = formatMoney(todayCostVal);

    // Trends
    if (costs.dailyTotals.length) renderCostTrend(costs.dailyTotals);
    if (usage.dailyTotals.length) renderTokenTrend(usage.dailyTotals);
  },

  // ---- Usage ----
  renderUsage(usage) {
    if (!usage.dailyTotals.length) return;
    renderRequestsTrend(usage.dailyTotals);
    renderDailyTokens(usage.dailyTotals);
    renderModelTable('table-requests', usage.modelTotals, ['request']);
    renderModelTable('table-tokens', usage.modelTotals, ['promptCacheHitToken', 'promptCacheMissToken', 'responseToken']);
  },

  // ---- Costs ----
  renderCosts(costs) {
    if (!costs.dailyTotals.length) return;
    renderDailyCost(costs.dailyTotals);
    renderCostTable('table-costs', costs);
  },

  // ---- Models ----
  renderModels(usage, costs) {
    const container = document.getElementById('models-container');
    if (!usage.modelTotals.length) {
      container.innerHTML = '<div class="empty-hint">暂无模型数据</div>';
      return;
    }
    container.innerHTML = usage.modelTotals.map(modelUsage => {
      const costModel = costs.modelTotals.find(c => c.model === modelUsage.model);
      const totalCost = costModel ? costModel.metrics.reduce((s, u) => s + u.amount, 0) : 0;
      const chips = buildModelChips(modelUsage, totalCost);
      return `
        <div class="glass model-card">
          <div class="model-card-header">
            <span class="model-card-name">${getModelIcon(modelUsage.model)} ${getModelName(modelUsage.model)}</span>
            <span class="model-card-cost">${formatMoney(totalCost)}</span>
          </div>
          <div class="model-chip-grid">${chips}</div>
        </div>`;
    }).join('');
  },
};

// ---- Helpers ----

function buildModelChips(modelUsage, totalCost) {
  const metrics = {};
  modelUsage.metrics.forEach(u => { metrics[u.type] = u.amount; });

  const items = [
    { key: 'request', label: 'API 请求', icon: '📡', color: 'c-cyan', val: metrics.request },
    { key: 'promptCacheHitToken', label: '缓存命中', icon: '✅', color: 'c-green', val: metrics.promptCacheHitToken },
    { key: 'promptCacheMissToken', label: '缓存未命中', icon: '❌', color: 'c-orange', val: metrics.promptCacheMissToken },
    { key: 'responseToken', label: '输出 Token', icon: '💬', color: 'c-blue', val: metrics.responseToken },
    { key: 'total', label: '总 Token', icon: '🧮', color: 'c-indigo', val: (metrics.promptCacheHitToken||0) + (metrics.promptCacheMissToken||0) + (metrics.responseToken||0) },
    { key: 'cost', label: '消费', icon: '💴', color: 'c-orange', val: totalCost, money: true },
  ];

  return items.map(i => `
    <div class="model-chip">
      <div class="model-chip-icon ${i.color}">${i.icon}</div>
      <div class="model-chip-info">
        <span class="model-chip-label">${i.label}</span>
        <span class="model-chip-value">${i.money ? formatMoney(i.val || 0) : formatCompact(i.val || 0)}</span>
      </div>
    </div>
  `).join('');
}

function renderModelTable(tableId, modelTotals, columns) {
  const el = document.getElementById(tableId);
  console.log('renderModelTable:', tableId, 'el:', !!el, 'models:', modelTotals?.length);
  if (!el) { console.warn('Element not found:', tableId); return; }
  if (!modelTotals?.length) { console.warn('No models for:', tableId); return; }
  const colLabels = {
    request: '请求数', promptCacheHitToken: '缓存命中', promptCacheMissToken: '缓存未命中', responseToken: '输出',
  };
  const allCols = ['model', ...columns];
  let html = '<table class="metric-table"><thead><tr>';
  allCols.forEach(c => {
    html += `<th>${c === 'model' ? '模型' : colLabels[c] || c}</th>`;
  });
  html += '</tr></thead><tbody>';
  modelTotals.forEach(m => {
    html += '<tr>';
    html += `<td>${getModelIcon(m.model)} ${getModelName(m.model)}</td>`;
    columns.forEach(c => {
      const val = m.metrics.filter(u => u.type === c).reduce((s, u) => s + u.amount, 0);
      html += `<td>${c === 'promptCacheHitToken' || c === 'promptCacheMissToken' || c === 'responseToken' ? formatCompactFull(val) : formatCompact(val)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderCostTable(tableId, costs) {
  const el = document.getElementById(tableId);
  if (!el) return;
  let html = '<table class="metric-table"><thead><tr><th>模型</th><th>缓存命中</th><th>缓存未命中</th><th>输出</th><th>总计</th></tr></thead><tbody>';
  costs.modelTotals.forEach(m => {
    const hit = sumMetric(m, 'promptCacheHitToken');
    const miss = sumMetric(m, 'promptCacheMissToken');
    const resp = sumMetric(m, 'responseToken');
    const total = hit + miss + resp;
    html += `<tr><td>${getModelIcon(m.model)} ${getModelName(m.model)}</td><td>${formatMoney(hit)}</td><td>${formatMoney(miss)}</td><td>${formatMoney(resp)}</td><td style="font-weight:600">${formatMoney(total)}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function sumMetric(model, type) {
  return model.metrics.filter(u => u.type === type).reduce((s, u) => s + u.amount, 0);
}

function getModelName(model) {
  if (model.includes('flash')) return 'V4 Flash';
  if (model.includes('pro') || model.includes('reasoner')) return 'V4 Pro';
  return model;
}
function getModelIcon(model) {
  if (model.includes('flash')) return '⚡';
  if (model.includes('pro') || model.includes('reasoner')) return '💎';
  return '🤖';
}

function updateStatus(title, detail, icon) {
  const t = document.getElementById('status-title');
  const d = document.getElementById('status-detail');
  const i = document.getElementById('status-icon');
  if (t) t.textContent = title;
  if (d) d.textContent = detail;
  if (i) i.textContent = icon;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function showToast(msg, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Spin animation
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
