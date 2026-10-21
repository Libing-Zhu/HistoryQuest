# HistoryQuest · 寻迹上海

上海历史博物馆课程项目：通过地图、文物故事、观察解谜、关联历史知识、语音导览和游客社区探索城市记忆。

- 源码仓库：https://github.com/Libing-Zhu/HistoryQuest
- **公开网站：尚未部署与验证。请勿将仓库地址当作网站入口。**

## 技术与入口

React 19、TypeScript、Vite 6、Tailwind CSS 4、Lucide 图标。入口为 `index.html` → `src/main.tsx`。`pnpm build` 生成 `dist/`。`public/media/` 包含所有图片、MP3、MP4、字幕；Vite 保留相对资源路径。页面采用 `#home`、`#story/chair` 等 hash 路由，刷新时无需服务器 rewrite。

共享社区依赖 Node.js 24 的 `node:sqlite` 和持久磁盘，不能仅用 GitHub Pages 部署。收藏、笔记和探索进度保存在各访客浏览器中。

## 本地运行

安装 Node.js 24 或更高版本、pnpm 11.25.0：

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

打开终端显示的地址（通常为 `http://127.0.0.1:4173/#home`）。完整社区服务由启动脚本同时提供。开发时可另开终端执行 `pnpm dev`，Vite 会将社区 API 代理到 4173 端口。

```sh
pnpm test
pnpm test:server
```

## 生产部署（保留完整社区）

`render.yaml` 已准备 Node Web Service 和 1GB 持久磁盘配置。**此配置为付费方案，未经账户所有者确认不得开通。** 服务端和网页使用相同 HTTPS 域名，避免跨站 Cookie 与 API 来源校验问题。

云端环境：

- `HISTORYQUEST_CLOUD=1`：监听 `0.0.0.0`，关闭本地浏览器自动打开。
- `PORT`：由托管平台提供。
- `HISTORYQUEST_DATA_DIR=/var/data/historyquest`：必须位于持久磁盘中。
- `HISTORYQUEST_PUBLIC_ORIGIN=https://实际域名`：Render 可从 `RENDER_EXTERNAL_URL` 自动读取；其他平台需显式设置。

构建：`corepack enable && pnpm install --frozen-lockfile && pnpm build`

启动：`node 启动网页.cjs`

健康检查：`/api/community/health`。

已有访客数据库、会话和上传文件不会公开到 GitHub。首次线上部署创建空社区；如需迁移旧数据，应通过托管平台的安全文件传输单独处理。

## GitHub Pages

纯静态发布能显示内容，但无法提供共享发帖与上传。按项目所有者要求，当前保留全部功能，不发布一个社区失效的静态版本。待完整 HTTPS 网站验证后，可将 GitHub Pages 设置为跳转入口；课堂展示应使用验证过的完整网站地址。

## 更新网站

修改 `src/` 中内容、样式和交互，或更新 `public/media/` 中资源；运行构建及测试后提交并推送 `main`。GitHub Actions 自动验证；连接 Render 后，使用通过检查的提交自动部署。不要删除持久磁盘，否则社区帖子和上传可能丢失。部署后用无登录浏览器检查首页、故事、视频和社区。

## 内容与原始说明

原始设计、故事、媒体和互动均保留。原始交付说明存于 `docs/ORIGINAL_README.md`；其他设计和来源记录见 `docs/`。历史内容中原有的“待核实”说明保持原样。
