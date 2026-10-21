# 文物卡片字号与图片 · 2026-10-20

- 删除HighlightCarousel中序号节点、仅供其使用的overview参数与highlights值导入；原卡片与循环辅助副本都不再显示01—10。
- 地图SVG数字及坐标、mapHighlights数据、预览逻辑保持不变。
- 桌面：宽280px、高112px；名称14.5px，说明11.5px，图片60×70px、object-fit:contain。
- 手机：宽250px、高104px；名称13.5px，说明11px，图片50×60px。
- 原卡片宽度、12px间距、整卡1.035缩放与0.4s动画、滚动和拖动逻辑不变。只修改列表专属样式。
- TypeScript、29项相关回归测试、生产构建通过。
- 浏览器桌面1280×720：10个原卡片+20个辅助卡片均无序号，地图数字01—10仍完整；实际字号图片尺寸核对通过。悬停scrollLeft连续两次2920.5，拖动后3120.5且仍为楼层总览，移出恢复滚动并无残留缩放。
- 桌面末卡键盘focus-visible:true，放大边界位于列表四边内，普通点击正确打开入城纪律。
- 手机390×844：10项y坐标相同、高104px，main clientWidth/scrollWidth均374；横向滚动到253.5，长名称与图片无重叠。
- 截图：previews/card-type-desktop.jpg、previews/card-type-mobile.jpg。
- 备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-卡片字号修改前-20261020。
- public及server逐字节未变；未覆盖或删除community-data，未清理浏览器数据。
- 双击启动演示.command运行最新dist，本机http://127.0.0.1:4173/#home。
