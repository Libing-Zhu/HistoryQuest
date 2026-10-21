# 公共导航精简（2026-10-19）

## 修改

顶部深蓝色细条来自museum-theme.css中公共header的4px border-top，现从源样式删除。桌面header由108px调整为104px，手机由89px调整为85px，去掉的4px不保留占位，原内容区高度不变。
从App共享header删除整个project-link按钮，包含IFB405TC、ArrowUpRight图标和跳转事件；删除基础、主题、手机及打印中的专属样式，因此竖线和空容器均不再存在。共用箭头图标与go函数仍用于其他入口，继续保留。
导航现为品牌与四个主导航链接两组，flex两端对齐。顶部米白背景、底部1px细线、品牌、四个导航和手机底部导航/安全间距保留。
项目说明内容和#project路由保留，首页“查看项目与证据边界”入口也保留。

## 验证

TypeScript、生产构建、41项前端测试及后端独立会话共享集成测试通过。相关导航回归更新为各路由均无IFB405TC按钮、品牌和手机导航仍在。
浏览器桌面与390px手机分别检查首页、好奇心中心、自由探索、文物观察、故事、游客社区、项目说明：所有header borderTopWidth为0px，无project-link，无横向溢出；手机底部导航仍存在。项目说明页可直接打开。桌面header104px、手机85px，底部分隔线均1px；控制台无错误。
搜索、谜题提交/取消/刷新、视频与音频、收藏笔记及共享社区回归测试通过。没有改动这些功能代码。

## 交付与数据

双击启动演示.command，地址仍为http://127.0.0.1:4173。dist已重新生成。
部署同步完全排除community-data，数据库与媒体不删除、不覆盖。服务端、存储格式与音频资产均未改动。服务在同步后重启以提供最新构建，原地址和数据库沿用。
修改前备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-导航精简前-20261019/，含SQLite在线一致性快照和原媒体。
截图：previews/header-clean-desktop.png、previews/header-clean-mobile.png。
