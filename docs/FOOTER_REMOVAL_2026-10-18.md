# 全站公共页脚删除（2026-10-18）

## 修改

- 从App共享布局删除整个footer及品牌、标语、课程项目说明入口、年份与原型声明，不是CSS隐藏。
- 删除styles.css中footer、footer-brand、手机与打印专属规则；删除museum-theme.css中的页脚背景与边线规则。
- 保留顶部品牌、IFB405TC入口、项目说明页、其他出处与必要说明，以及手机底部导航。
- 存储失败提示从原页脚移至main末尾，仅失败时出现，避免删除页脚后失去异常提示。
- 桌面main底部留白24px；手机预留65px导航高度、24px呼吸间距及safe-area-inset-bottom，没有模拟页脚占位。
- 首页最后一个内容模块仍为“离开博物馆，探索才刚刚开始。”。

## 验证

TypeScript检查、生产构建、34项测试通过。新增回归覆盖所有路由无页脚、保留顶部入口和手机导航，以及存储异常提示不丢失。
现有视频、音频互斥、收藏、笔记、谜题、社区测试均通过。
浏览器分别检查首页、地图、文物观察、故事、好奇心中心、游客社区、项目说明，桌面与390px手机布局均无footer与横向溢出，手机导航存在且main留足89px安全间距（本次视口safe-area为0）。控制台无错误。

截图：previews/home-no-footer-desktop.png、previews/home-no-footer-mobile.png。
修改前备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-删除页脚前-20261018/。

## 运行

dist已重新生成。双击“启动演示.command”，或在服务运行时访问 http://127.0.0.1:4173/#home 。重复启动继续复用相同构建的服务，收藏笔记使用的浏览器地址保持不变。
