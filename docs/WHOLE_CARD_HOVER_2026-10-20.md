# 整卡悬停 · 2026-10-20

仅修改src/highlight-carousel.css。
- 整张卡片hover/focus-visible缩放1.035，过渡0.4s ease，图片不再单独缩放。
- 卡片position:relative及悬停z-index保证层级，轨道isolation:isolate；上下padding增加至10px，水平padding保持6px。键盘焦点金棕轮廓位于卡片内侧，避免边缘裁切。
- 卡片宽高、12px间距、所有滚动/复制/点击/拖动逻辑均未修改。
- hover缩放限fine/hover设备；减少动态效果关闭卡片transform及transition。
- TypeScript、3项相关测试、生产构建通过。
- 实际桌面浏览器确认button transform为matrix(1.035,0,0,1.035,0,0)，img transform为none；offsetWidth仍为280，显示宽289.8，高89.01，周围卡片不移动。
- 悬停截图previews/whole-card-hover-desktop.jpg已保存。随后浏览器连接再次中断，未完成本次手机及移出恢复实际复核；恢复样式及手机/减少动态效果规则已检查。
- 备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-整卡悬停修改前-20261020。
- 未覆盖community-data数据库及媒体，未清空浏览器数据。

后续复核已补充，详见WHOLE_CARD_REVIEW_2026-10-20.md，含手机、悬停移出恢复、拖动、点击及焦点实测证据。
