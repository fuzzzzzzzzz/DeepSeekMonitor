<details open>
<summary><strong>中文</strong></summary>

# DeepSeek Monitor

**macOS 极简风格 · DeepSeek API 用量 & 余额监控桌面应用（Windows）**

## 功能

- 余额监控（总余额、本月消费）
- Token 用量（V4 Flash / V4 Pro 分开展示）
- 消耗趋势图表（折线图 + 堆叠柱状图）
- 模型明细（请求数、缓存命中/未命中、输出 Token）
- 成本分析（按模型和日期）
- 自动定时刷新（1-120 分钟可调）
- 余额不足系统通知
- 开机自启动
- 数据全本地存储，API Key 加密
- 浅色 / 深色自动切换

## 技术栈

- [Electron](https://www.electronjs.org/) — 桌面框架
- [Chart.js](https://www.chartjs.org/) — 图表
- [sql.js](https://sql.js.org/) — 本地数据库

## 快速开始

```bash
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
npm start
```

## 使用

1. 点击右上角「登录」→ 弹出窗口登录 DeepSeek 平台
2. Token 自动捕获，数据加载
3. 左侧导航：概览、用量、成本、模型、服务状态、警告、设置

## 致谢

UI 参考 [jasmine889966/DeepSeekMonitor](https://github.com/jasmine889966/DeepSeekMonitor)

</details>

<details>
<summary><strong>English</strong></summary>

# DeepSeek Monitor

**macOS-inspired minimal dashboard for DeepSeek API usage & balance monitoring on Windows.**

## Features

- Balance monitoring (total balance, monthly cost)
- Token usage by model (V4 Flash / V4 Pro)
- Trend charts (line + stacked bar)
- Per-model breakdown (requests, cache hit/miss, response tokens)
- Cost analysis by model & date
- Auto-refresh (1–120 min configurable)
- Low-balance system notification
- Launch at system startup
- Fully local storage, encrypted API key
- Light / Dark mode (auto)

## Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop framework
- [Chart.js](https://www.chartjs.org/) — Charts
- [sql.js](https://sql.js.org/) — Local database

## Quick Start

```bash
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
npm start
```

## Usage

1. Click "Login" → sign in to DeepSeek Platform
2. Token captured automatically, data loads
3. Sidebar: Overview, Usage, Costs, Models, Status, Alerts, Settings

## Credits

UI inspired by [jasmine889966/DeepSeekMonitor](https://github.com/jasmine889966/DeepSeekMonitor)

</details>

---

## License

MIT
