# 技术方案规格

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 28+ |
| 前端渲染 | 原生 HTML + CSS + Vanilla JS | - |
| 图表库 | Chart.js | 4.x |
| 本地数据库 | better-sqlite3 | 最新 |
| HTTP 请求 | Node.js fetch (built-in) | - |
| 系统托盘 | Electron Tray API | - |
| 开机自启 | electron-auto-launch | 5.x |
| 桌面通知 | Electron Notification API | - |
| 加密模块 | Node.js crypto (AES-256-GCM) | - |
| 打包工具 | electron-builder | 最新 |

## 项目结构

```
deepseekmonitor/
├── CLAUDE.md               # AI 助手指引
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本（IPC 桥接）
├── package.json            # 项目配置 & 依赖
├── docs/                   # 开发规范文档
│   ├── requirements.md     # 功能需求
│   ├── tech-spec.md        # 技术方案
│   ├── design-spec.md      # 设计规范
│   └── implementation-steps.md
├── dev-logs/               # 开发日志（按日）
├── backend/
│   ├── api.js              # DeepSeek API 调用
│   ├── db.js               # SQLite 数据库
│   ├── cache.js            # 缓存管理
│   ├── crypto.js           # 加密/解密
│   ├── scheduler.js        # 定时刷新
│   └── csv.js              # CSV 处理
├── src/
│   ├── index.html          # 主页面
│   ├── style.css           # 漫画风格样式
│   ├── app.js              # 前端主逻辑
│   ├── renderer.js         # 页面路由 & 事件
│   └── charts.js           # Chart.js 图表
└── assets/
    └── icon.png            # 应用图标
```

## 数据库设计

### daily_usage 表
```sql
CREATE TABLE daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,           -- 'YYYY-MM-DD'
  model TEXT NOT NULL,          -- 'v4-flash' | 'v4-pro'
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  UNIQUE(date, model)
);
```

### balance_snapshot 表
```sql
CREATE TABLE balance_snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_balance REAL,
  granted_balance REAL,
  topped_up_balance REAL,
  fetched_at TEXT DEFAULT (datetime('now'))
);
```

### settings 表
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## API 接口

### 查余额
- **Method**: GET
- **URL**: `https://api.deepseek.com/user/balance`
- **Headers**: `Authorization: Bearer <API_KEY>`

### 查用量
- **Method**: GET
- **URL**: `https://api.deepseek.com/v1/usage`
- **Headers**: `Authorization: Bearer <API_KEY>`
