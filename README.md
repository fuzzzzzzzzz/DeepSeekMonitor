# DeepSeek Monitor

<p align="center">
  <img src="assets/icon.png" width="128" alt="DeepSeek Monitor">
</p>

<p align="center">
  <strong>macOS 极简风格 · DeepSeek API 用量 & 余额监控桌面应用</strong>
</p>

<p align="center">
  <strong>macOS‑inspired minimal dashboard for DeepSeek API usage & balance monitoring on Windows.</strong>
</p>

---

## 功能 / Features

| 功能 | Feature |
|------|---------|
| 余额监控（总余额、本月消费） | Balance monitoring (total balance, monthly cost) |
| Token 用量（V4 Flash / V4 Pro） | Token usage by model (V4 Flash / V4 Pro) |
| 消耗趋势图表（折线图 + 堆叠柱状图） | Consumption trends (line + stacked bar charts) |
| 模型明细（请求数、缓存命中/未命中、输出 Token） | Per‑model breakdown (requests, cache hit/miss, response tokens) |
| 成本分析（按模型和日期） | Cost analysis by model & date |
| 自动定时刷新 | Auto‑refresh (1–120 min interval) |
| 余额不足系统通知 | Low‑balance system notification |
| 开机自启动 | Launch at system startup |
| 数据全本地存储，API Key 加密 | Fully local storage, API key encryption |
| 浅色 / 深色自动切换 | Light / Dark mode (auto) |

---

## 截图 / Screenshots

> 概览 · 用量 · 成本 · 模型

---

## 技术栈 / Tech Stack

| 技术 | Technology |
|------|------------|
| [Electron](https://www.electronjs.org/) | Desktop framework |
| [Chart.js](https://www.chartjs.org/) | Charts |
| [sql.js](https://sql.js.org/) | Local SQLite database |

---

## 快速开始 / Quick Start

```bash
# 国内用户设置镜像
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# 安装依赖
npm install

# 启动
npm start
```

---

## 使用方法 / Usage

1. 点击右上角「登录」→ 在弹出窗口登录 [DeepSeek 平台](https://platform.deepseek.com)
2. Token 自动捕获，数据开始加载
3. 左侧导航切换页面：概览、用量、成本、模型、服务状态、警告、设置
4. 在设置中配置刷新间隔、余额警告阈值、开机自启

> 1. Click "Login" → sign in to [DeepSeek Platform](https://platform.deepseek.com) in the pop‑up window
> 2. Token is captured automatically; data loads immediately
> 3. Navigate via sidebar: Overview, Usage, Costs, Models, Status, Alerts, Settings
> 4. Configure refresh interval, balance alert threshold, and auto‑launch in Settings

---

## 致谢 / Credits

UI design inspired by [jasmine889966/DeepSeekMonitor](https://github.com/jasmine889966/DeepSeekMonitor)

---

## License

MIT
