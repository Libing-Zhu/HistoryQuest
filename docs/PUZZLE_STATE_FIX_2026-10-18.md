# 谜题状态与离馆入口修复（2026-10-18）

## 原因与实现

原组件使用原生radio，仅onChange赋值，不能再次点击取消；选择状态及解释初始值来自持久化answer，反馈也直接读取该字段，导致改选后仍显示上次正确反馈、刷新后回填旧答案。

现Puzzle独立维护choice、submittedAnswer、explanationOpen三个临时状态，初始均未选/未提交/收起。新挂载和刷新不从持久化历史答案恢复。
选项改为原生button（aria-pressed），保留圆形指示与原有整行样式；全行仅一个点击处理，点击文字、圆点和空白均一次切换；Enter/空格可操作，最多选中一项，再点取消。改选/取消立即清除submittedAnswer。
只有点击“查看解释”且存在选择才记录真实历史提交；未选查看、改选、取消及刷新均不写puzzle_answer事件。解释独立展开，始终只有一份解释和原有音频。
Progress.answers保留为历史最近提交记录，不再传给Puzzle或控制当前反馈。未重置存储、迁移/删除收藏笔记或修改IndexedDB。各文物复用同一Puzzle组件。
首页末尾按钮改为“进入游客社区”，实际go("saved")；其他好奇心中心入口不变。

## 验证

TypeScript、生产构建及37项测试通过。回归覆盖圆点/文字/整行切换、键盘Enter/空格、B正确后改选清反馈、A/C错误重试、未选择直接查看不计提交、历史答案不回填和新挂载后状态清空、收藏笔记保留及游客社区跳转。
浏览器实际检查：B提交后切C无旧反馈；C提交显示对应反馈；再按空格取消后无反馈；再次提交B并真实刷新，0项选中、解释收起；解释播放器始终只有一份。
390px响应式布局无横向溢出，点击两次A取消；首页新按钮可进入#saved，标题为游客社区；控制台无错误。
原有视频、音频互斥、收藏、笔记及社区持久化测试通过。手机验证为浏览器尺寸检查，未声称真实手机硬件兼容认证。

## 交付

运行：双击启动演示.command，保持终端运行，或服务运行时访问 http://127.0.0.1:4173/#home 。dist已重建。固定原访问地址保证既有浏览器数据继续可用。
修改前备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-谜题状态修复前-20261018/。
截图：previews/puzzle-switch-clears-feedback.png、previews/puzzle-reset-mobile.png、previews/community-entry-mobile.png。
