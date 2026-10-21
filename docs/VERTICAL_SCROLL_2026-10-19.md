# 上下卷轴修正交付

仅修改 ScrollBackdrop.tsx、scroll-backdrop.css 及相关测试。正文、导航几何、App状态、服务端和媒体资源保持原样。此版本替代此前的左右轴杆表现。

## 动画

- 上下两根横轴，初始在内容视口中心靠拢，露出约16px窄纸面；1.8秒缓动分离。只裁切装饰纸面，正文仅透明度渐显，保持文档流。
- 首次加载/刷新挂载时播放。组件在共享根部，站内切页不重新挂载，因此不重播；不读写存储。
- wheel、touchstart、pointerdown、keydown期间加速到220ms平滑完成，均为被动监听，无preventDefault或输入覆盖层。
- 滚动时上轴卷边由18px增至23px，下轴由23px减至18px，纸纹向上移动；向上滚动反向。停止后无循环。开场与滚动分别管理，衔接同一装饰层。
- 手机轴杆8px，底轴避开底部导航与安全区；减少动态效果时直接完整展开且关闭位移；打印隐藏装饰。

## 验证

TypeScript及生产构建通过，47项前端测试通过。新增覆盖1.8秒开场、横向轴杆、切页不重播、输入不拦截与加速、新挂载重播、减少动态效果及其切换；保留原有搜索、谜题、媒体、收藏与社区测试。

实际浏览器：首次刷新捕获合卷与展开状态；切换好奇心中心、地图、社区不重播；开场时点击首页可正常跳转。双向滚动进度0→0.99482→0，上轴18→22.97→18px，下轴23→18.02→23px。701/1280/1440桌面和390手机无横向溢出，导航位置不变；手机底轴底边770px、底部导航顶边779px，保留9px间距（844px视口）。减少动态效果以模拟偏好的自动化测试和CSS规则验证，未更改操作系统设置。

## 交付文件

- previews/vertical-scroll-closed-desktop.jpg：刷新后的合卷状态，真实截图。
- previews/vertical-scroll-open-desktop.jpg：完整展开。
- previews/vertical-scroll-open-mobile.jpg：手机展开状态。
- previews/vertical-scroll-opening-and-scroll.mp4：实际页面逐帧截图按采集时间合成，包含首次展开与上下滚动，无新增音轨。

备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-上下卷轴修改前-20261019/，包括一致性数据库快照。部署仅同步专属组件、样式、测试、文档、预览及dist，不覆盖community-data。

运行方式不变：双击“启动演示.command”，http://127.0.0.1:4173/#home。
