# 整卡悬停后续复核 · 2026-10-20

已针对桌面交付服务 http://127.0.0.1:4173/#map 补充实际浏览器复核。本次未修改运行代码、数据库或浏览器保存数据。

## 实际浏览器结果
- 手机390×844：10张卡片均在同一行，宽250px，全部transform:none；未显示自动滚动控制。正文clientWidth/scrollWidth均374，无横向溢出。
- 手机宽度下原生横向滚动成功，列表scrollLeft从0变为253.5。
- 桌面自然视口1280×720：悬停整卡transform matrix(1.035,0,0,1.035,0,0)，图片自身transform:none。
- 悬停时连续两次scrollLeft均4686.5，暂停正常；移出后hover:false、所有卡片非单位缩放数量为0，scrollLeft继续变化，自动恢复正常。
- 键盘focus-visible:true，整卡缩放，金棕2px焦点轮廓、offset -2px；焦点停留时scrollLeft连续两次4453.5。
- 末端卡片边界x896.24..1186.04、y364.02..453.03，列表边界x92.64..1187.36、y355.52..461.52，四边均完整落在窗口内。
- 手动拖动200px：scrollLeft 4750→4950，楼层仍为总览，未触发误选。
- 普通点击第09项：正常选择4F《义勇军进行曲》首版唱片。
- 4F三项内容不足一行：scrollWidth/clientWidth均1095，无辅助副本，无自动滚动控制；首卡焦点边界完整。

## 自动测试与样式检查
相关3项测试再次全部通过，覆盖20px/s步进、焦点暂停、循环归位、减少动态效果、拖动防误触及地图预览。
prefers-reduced-motion:reduce的实际CSS规则为button transform:none!important、transition:none；未通过更改系统设置或浏览器媒体模拟器进行实机模式切换。

## 交付
新增截图：whole-card-hover-verified.jpg、whole-card-keyboard-verified.jpg、whole-card-mobile-verified.jpg。
此前TypeScript及生产构建已通过，本次无运行源码修改，不重复构建。dist维持最新整卡悬停版本。
