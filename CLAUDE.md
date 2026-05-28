# DeepSeek Monitor — AI 助手指引

## 项目概述
为 Windows 用户打造漫画风格的 DeepSeek API 余额 & Token 用量监控桌面应用。
技术栈：Electron + 原生 HTML/CSS/JS + Chart.js + better-sqlite3

## 标准文件路径

| 文档 | 路径 | 用途 |
|------|------|------|
| 功能需求 | [docs/requirements.md](docs/requirements.md) | 完整功能清单和需求描述 |
| 技术方案 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈、项目结构、数据库设计、API 接口 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | UI 配色、漫画风格元素、页面布局、字体层级 |
| 实施步骤 | [docs/implementation-steps.md](docs/implementation-steps.md) | 分阶段执行计划，勾选进度 |
| 开发日志 | [dev-logs/](dev-logs/) | 按日期记录每日完成和待办事项 |

## 工作说明

### 每次开发前
1. 阅读 `docs/implementation-steps.md` 了解当前进度
2. 阅读 `docs/design-spec.md` 确认 UI 风格要求
3. 检查 `dev-logs/` 最新日志，了解上下文

### 每次开发后
1. 更新 `docs/implementation-steps.md` 勾选完成项
2. 在 `dev-logs/YYYY-MM-DD.md` 记录完成事项和待办事项
3. 保持日志简洁，只记录关键进展

### 代码规范
- 所有新代码使用 UTF-8 编码
- JavaScript 使用 ES6+ 语法
- 后端模块放在 `backend/`，前端文件放在 `src/`
- 每个文件单一职责，保持简洁

### 安全红线
- API Key 必须 AES-256-GCM 加密存储
- 绝不将用户数据上传到任何外部服务器
- 所有网络请求仅发送到 `api.deepseek.com`

### 执行原则
- 一个一个模块稳定推进，不追求一次性写完
- 每完成一个文件就验证语法正确性
- 用户是非技术背景，所有交互界面的文字使用中文
