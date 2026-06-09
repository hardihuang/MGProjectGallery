# MG 设计课 · 项目画册

MG 优秀学生项目作品展示网站。数据直接从飞书多维表格读取，**新增项目自动同步**。

## 架构

两种部署方式，任选其一：

### 方案 A：GitHub Pages + GitHub Action（推荐，最简单）

1. 在仓库 Settings → Secrets 添加：
   - `FEISHU_APP_ID` = `cli_aaadd33fbb3bdbb3`
   - `FEISHU_APP_SECRET` = `TzoWAqEjHfddLbAS6ZqYLfTu18CkScNa`
2. 在仓库 Settings → Pages 开启 GitHub Pages，分支选 `gh-pages`
3. GitHub Action 会自动每 6 小时从飞书同步数据
4. 也可手动触发：Actions → Refresh Project Data → Run workflow

**数据流向：** 飞书 → GitHub Action → `projects.json` → GitHub Pages 展示

### 方案 B：Cloudflare Pages + Worker（实时同步）

1. Fork/Clone 到 Cloudflare Pages
2. 在 Cloudflare Dashboard 设置环境变量：
   - `FEISHU_APP_ID`
   - `FEISHU_APP_SECRET`
3. 页面修改 `index.html` 中的 `API_BASE` 指向 Worker 地址
4. 每次刷新都从飞书实时读取，数据完全实时

## 字段结构

| 飞书字段 | 说明 |
|---------|------|
| 项目名称 | 项目标题 |
| 项目作者 | 学生姓名 |
| 指导导师 | 导师姓名 |
| 简介 | 项目描述 |
| 链接 | 飞书文档链接 |
| 封面图 | 项目封面图片 |

## 本地预览

```bash
cd mg-portfolio-demo
node server.js
# 打开 http://localhost:3456
```

## 技术栈

- 纯 HTML + CSS + JavaScript（无框架依赖）
- PWA 支持（iPad 添加到主屏幕）
- 飞书 Open API
- Cloudflare Workers（可选）
