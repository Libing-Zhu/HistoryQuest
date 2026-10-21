# 谜题解释、首页说明条与卡片交互修复

## 问题原因与修改

1. 原“查看解释”按钮设置了disabled={choice === undefined}，所以未选答案时主动禁用。现增加独立的explanationOpen状态；无选择时只展开正确答案和原解释，不调用onAnswer、不写作答事件。选答后仍提交所选值并显示反馈，可以重试。原题、答案B、puzzleVersion=3及历史数据均未改变。
2. 删除首页hero-foot三阶段说明及其连线、容器和全部专属CSS；缩短主要按钮下方间距。其他页面的观察、解谜、阅读与提问入口保留。
3. 礼轿卡片的专属样式使用transform:none!important覆盖公共悬停效果。现仅去掉这个transform覆盖，保留contain、居中、真实色彩和响应式资源。三卡统一使用1.035倍、0.4秒缩放；只缩放图片，容器overflow:hidden，年代标签、箭头和卡片不变。

## 无障碍及设备适配

解释使用原生按钮，带aria-expanded、aria-controls；单一解释区域带名称和礼貌播报。未作答时不显示错误反馈；原解释音频复用，不增加音轨或重复播放器。

悬停效果限定hover:hover且pointer:fine；键盘focus-visible提供缩放与焦点轮廓。缩放规则均要求prefers-reduced-motion:no-preference，系统减少动态时不缩放；原有全站减少动态规则继续禁用过渡。触屏不依赖悬停，点击直接进入文物页。详情与高清弹窗未应用卡片缩放。

## 验证

- TypeScript、生产构建与31项测试通过。
- 新测试使用Enter直接看解释，验证无答案、无puzzle_answer事件、无错误反馈；使用空格提交C，再改B，只有一个解释区域。
- 原有答错重试、跳过、收藏与笔记持久化等测试继续通过。
- 桌面真实指针停留三张卡片，均测得matrix(1.035,0,0,1.035,0,0)；移开恢复none。卡片尺寸均保持354.796875×300，overflow为hidden。
- 390px检查：由首页卡片进入详情、Enter直接展开，选中答案数0、解释区域1、scrollWidth=innerWidth=390。真实浏览器再次验证C错误反馈及改B正确反馈。
- 高清弹窗可打开与Esc关闭；所查页面控制台无错误。

截图：previews/home-no-phase-strip.png、home-chair-hover.png、puzzle-direct-explanation.png、puzzle-direct-mobile.png。

dist已重新构建。原启动方式及http://127.0.0.1:4173地址保留。修改前完整备份位于工作目录backups/HistoryQuest-交互修复前-20261018。未发布线上版本。
