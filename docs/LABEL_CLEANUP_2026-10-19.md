# 首页、知识卡与地图文字精简（2026-10-19）

## 修改范围

首页删除HISTORYQUEST 2.0 / SHANGHAI、Every artifact opens a new question.、藏品档案 / 001对应组件节点。保留中文介绍、礼轿名称、1936年代、主按钮及高清照片功能；清理英文标语和眉题专属样式，缩短主标题上方间距。
好奇心中心10张列表卡片仅移除右上角Badge及多余的双列容器，保留分类、标题、摘要、展开与收藏。详情和其他场景的Badge与来源记录继续保留，data.ts的核验状态未改。
自由探索删除指定HTML介绍段和SVG总览底部说明；仅清理已无用途的east-intro p样式，diagram-footnote仍用于单层地图，因此保留共享样式；未更改地图坐标、几何形状、点位、楼层或交互。

## 验证

TypeScript、生产构建、39项前端测试及后端独立会话共享集成测试通过。新增回归检查首页三处指定文字、保留中文/藏品年代、全部10张卡片无列表Badge而详情Badge仍在，以及地图说明删除且楼层入口可用。
浏览器桌面核对：10张卡片，0个列表Badge；搜索礼轿得到1张，地点筛选得到两张，切回全部仍10张；收藏与展开线索正常。地图放大、重置、切3F、点击陈化成像入口通过。
390px手机布局核对首页、知识卡、地图，均无横向溢出；卡片数量仍10、列表徽标为0；控制台无错误。
85秒视频、完整礼轿导听、谜题取消/刷新、收藏笔记及共享社区回归通过。

## 数据与交付

更新时完全排除community-data目录，不覆盖、不删除数据库和媒体文件；未改服务端、社区代码或数据结构。原访问地址http://127.0.0.1:4173不变，启动脚本打开最新dist。
备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-界面精简前-20261019/，包括SQLite在线一致性快照和media文件夹。
截图：previews/home-clean-labels-desktop.png、hub-clean-badges-desktop.png、map-clean-captions-desktop.png；对应mobile截图同目录，地图完整页面见map-clean-captions-full.png。
