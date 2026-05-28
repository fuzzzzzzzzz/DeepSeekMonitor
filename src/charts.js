// ============================================
// Charts — Swift Charts 风格移植到 Chart.js
// ============================================

const CT = {
  green: '#34c759', orange: '#ff9f0a', pink: '#ff375f',
  blue: '#007aff', cyan: '#5ac8fa', indigo: '#5856d6',
  grid: 'rgba(128,128,128,0.12)', text: '#8e8e93',
};
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  CT.grid = 'rgba(255,255,255,0.1)'; CT.text = '#8e8e93';
}

Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(44,44,46,0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.12)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };

const charts = {};

function areaLineChart(canvasId, dailyTotals, color, valueKey, yFormatter) {
  if (charts[canvasId]) charts[canvasId].destroy();
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = dailyTotals.map(d => d.date.slice(5));
  const values = dailyTotals.map(d => {
    let sum = 0;
    d.models.forEach(m => m.metrics.forEach(u => {
      if (valueKey === 'all' || u.type === valueKey) sum += u.amount;
    }));
    return sum;
  });

  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color, backgroundColor: color + '20',
        borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
        pointHoverBackgroundColor: color, tension: 0.35, fill: true,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => yFormatter(c.raw) } },
      },
      scales: {
        x: { grid: { color: CT.grid }, ticks: { color: CT.text, font: { size: 10 }, maxTicksLimit: 8 }, border: { color: CT.grid } },
        y: { grid: { color: CT.grid }, ticks: { color: CT.text, font: { size: 10 }, callback: v => yFormatter(v) }, border: { color: CT.grid }, beginAtZero: true },
      },
    },
  });
}

function stackedBarChart(canvasId, dailyTotals, types, colorMap) {
  if (charts[canvasId]) charts[canvasId].destroy();
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = dailyTotals.map(d => d.date.slice(5));
  const datasets = types.map(t => ({
    label: t.label,
    data: dailyTotals.map(d => {
      let sum = 0;
      d.models.forEach(m => m.metrics.forEach(u => { if (u.type === t.key) sum += u.amount; }));
      return sum;
    }),
    backgroundColor: colorMap[t.key] || CT.blue,
    borderWidth: 0,
    borderRadius: 4,
    borderSkipped: false,
  }));

  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 16, font: { size: 11 }, color: CT.text } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatCompact(c.raw)}` } },
      },
      scales: {
        x: { stacked: true, grid: { color: CT.grid }, ticks: { color: CT.text, font: { size: 10 }, maxTicksLimit: 8 }, border: { color: CT.grid } },
        y: { stacked: true, grid: { color: CT.grid }, ticks: { color: CT.text, font: { size: 10 }, callback: v => formatCompact(v) }, border: { color: CT.grid }, beginAtZero: true },
      },
    },
  });
}

// ---- Formatters ----

function formatMoney(v) {
  if (v == null || isNaN(v)) return '--';
  const abs = Math.abs(v);
  const digits = abs < 1 ? 4 : 2;
  return '¥' + v.toFixed(digits);
}

function formatCompact(v) {
  if (v == null || isNaN(v)) return '--';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

function formatCompactFull(v) {
  if (v == null || isNaN(v)) return '--';
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

function formatDateShort(d) { return d ? d.slice(5) : ''; }

// ---- Preset chart renderers ----

function renderCostTrend(dailyTotals) {
  areaLineChart('chart-cost-trend', dailyTotals, CT.orange, 'all', formatMoney);
}

function renderTokenTrend(dailyTotals) {
  areaLineChart('chart-token-trend', dailyTotals, CT.blue, 'all', formatCompact);
}

function renderRequestsTrend(dailyTotals) {
  areaLineChart('chart-requests-trend', dailyTotals, CT.cyan, 'request', formatCompact);
}

function renderDailyTokens(dailyTotals) {
  const types = [
    { key: 'promptCacheHitToken', label: '缓存命中' },
    { key: 'promptCacheMissToken', label: '缓存未命中' },
    { key: 'responseToken', label: '输出' },
  ];
  const colors = { promptCacheHitToken: CT.green, promptCacheMissToken: CT.orange, responseToken: CT.blue };
  stackedBarChart('chart-daily-tokens', dailyTotals, types, colors);
}

function renderDailyCost(dailyTotals) {
  const types = [
    { key: 'promptCacheHitToken', label: '缓存命中' },
    { key: 'promptCacheMissToken', label: '缓存未命中' },
    { key: 'responseToken', label: '输出' },
  ];
  const colors = { promptCacheHitToken: CT.green, promptCacheMissToken: CT.orange, responseToken: CT.blue };
  stackedBarChart('chart-daily-cost', dailyTotals, types, colors);
}
