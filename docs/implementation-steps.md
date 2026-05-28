# 实施步骤

## 阶段划分

### 阶段 1：项目骨架（当前）
- [x] 初始化 package.json
- [x] 安装依赖（electron, better-sqlite3, chart.js, electron-auto-launch, electron-builder）
- [x] 创建文档规范（docs/）
- [ ] 创建后端模块（backend/）
- [ ] 创建 Electron 主进程（main.js + preload.js）
- [ ] 创建前端基础框架（HTML + CSS + JS）
- [ ] 首次启动验证

### 阶段 2：核心功能
- [ ] API 数据获取联调
- [ ] SQLite 数据库读写
- [ ] 缓存加载逻辑
- [ ] 漫画风格 UI 完善
- [ ] 图表渲染

### 阶段 3：高级功能
- [ ] 自动刷新调度
- [ ] 系统托盘 + 开机自启
- [ ] 余额不足告警
- [ ] CSV 导入导出

### 阶段 4：收尾
- [ ] 打包 .exe 安装文件
- [ ] Windows 实机测试
- [ ] 问题修复

## 执行原则
1. 每完成一个模块，立即测试验证
2. 不要一口吃成胖子——一个文件一个文件来
3. 后端模块之间相互独立，可并行开发
4. 前端依赖后端 IPC 接口，需在 preload.js 定义好后同步进行
