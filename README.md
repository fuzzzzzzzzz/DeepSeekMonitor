# DeepSeek Monitor

**macOS 极简风格 · DeepSeek API 用量 & 余额监控桌面应用**

**macOS-inspired minimal dashboard for DeepSeek API usage & balance monitoring on Windows.**

---

## 功能 / Features

- 余额监控（总余额、本月消费）| Balance monitoring
- Token 用量（V4 Flash / V4 Pro）| Token usage by model
- 消耗趋势图表（折线图 + 堆叠柱状图）| Consumption trend charts
- 模型明细（请求数、缓存命中/未命中、输出 Token）| Per-model breakdown
- 成本分析（按模型和日期）| Cost analysis by model & date
- 自动定时刷新（1-120 分钟）| Auto-refresh
- 余额不足系统通知 | Low-balance notification
- 开机自启动 | Launch at startup
- 数据全本地存储，API Key 加密 | Fully local, encrypted storage
- 浅色 / 深色自动切换 | Light / Dark mode

## 技术栈 / Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop framework
- [Chart.js](https://www.chartjs.org/) — Charts
- [sql.js](https://sql.js.org/) — Local SQLite database

## 快速开始 / Quick Start

```bash
# 国内用户设置镜像
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

npm install
npm start
```

## 使用方法 / Usage

1. 点击右上角「登录」→ 在弹出窗口登录 DeepSeek 平台
2. Token 自动捕获，数据开始加载
3. 左侧导航切换页面：概览、用量、成本、模型、服务状态、警告、设置

> Click "Login" → sign in to DeepSeek Platform. Token captured automatically. Navigate via sidebar: Overview, Usage, Costs, Models, Status, Alerts, Settings.

## 致谢 / Credits

UI design inspired by [jasmine889966/DeepSeekMonitor](https://github.com/jasmine889966/DeepSeekMonitor)

## License

MIT
