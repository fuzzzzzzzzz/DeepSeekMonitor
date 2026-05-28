# DeepSeek Monitor

macOS 极简风格的 DeepSeek API 用量 & 余额监控桌面应用（Windows）。

## 功能

- **余额监控** — 实时显示账户余额、本月消费
- **Token 用量** — 按 V4 Flash / V4 Pro 分开展示 Token 消耗
- **消耗趋势** — 近 31 天用量和费用图表（折线图 + 堆叠柱状图）
- **模型明细** — 每个模型的 API 请求数、缓存命中/未命中、输出 Token
- **成本分析** — 按模型和日期的详细消费明细
- **自动刷新** — 可设置 1-120 分钟间隔自动拉取数据
- **余额警告** — 余额低于阈值时系统通知提醒
- **开机自启** — 支持注册开机自动启动
- **数据安全** — 所有数据仅存本地，API Key 加密存储

## 技术栈

Electron + Chart.js + SQLite (sql.js)

## 运行

```bash
npm install
npm start
```

> 首次启动需配置国内镜像加速 Electron 下载：`set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`

## 使用

1. 启动后点击右上角「登录」
2. 在弹出窗口登录 DeepSeek 平台（platform.deepseek.com）
3. Token 自动捕获，数据自动加载
4. 左侧导航切换查看：概览、用量、成本、模型、服务状态、警告、设置

## 致谢

UI 设计参考 [jasmine889966/DeepSeekMonitor](https://github.com/jasmine889966/DeepSeekMonitor)
