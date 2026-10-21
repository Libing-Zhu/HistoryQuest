# 古典卷轴背景交付说明

## 范围

仅在 main.tsx 挂载独立的 ScrollBackdrop；新增 ScrollBackdrop.tsx、scroll-backdrop.css 与纸面图片。App.tsx、原有组件、页面顺序、状态、媒体和服务端逻辑未改。顶部导航位置保持原样，仅将导航背景表面协调为浅陶粉。

## 参考与实现

- 实际检查参考视频 0、4、10、23、35、45 秒画面：横向连续长卷、两侧轴饰与连续纸面。参考原视频长46.63秒，未将它用作背景视频，也未修改原文件。
- 图片原始1320×2176，平均色约RGB(180,146,127)。将原图复制为 public/media/scroll/terracotta-paper.jpg（约727KB），用低透明纹理与暖陶粉、浅赭渐变保留质感并减轻阅读干扰。
- 按网页原生纵向滚动进度同步纸面延展、纸纹位移、侧卷边展开和轴面高光。滚动反向时原路收拢；停止滚动没有循环动画。仅装饰层变换，无额外滚动高度。
- 被动监听与单个 requestAnimationFrame 合并更新，不使用 React 状态驱动滚动。ResizeObserver 更新动态内容高度，hashchange/pageshow/resize更新进度，卸载清理监听与观察器。
- aria-hidden、pointer-events:none；装饰在隔离的负层级，不挡正文或交互。手机轴饰缩小且避开底部导航。减少动态效果时JS进度固定0、CSS关闭变换；保留静态纸面。

## 验证

- TypeScript检查和生产构建通过。
- 44项前端测试通过，包括新增的滚动方向、事件合并、内容高度、短页面/路由更新、卸载清理、减少动态效果测试。
- 服务端双独立会话共享、媒体持久化和删除权限测试通过（使用测试服务，不操作实际社区数据）。
- 实际浏览器验证搜索输入前后10→10、提交“礼轿”后1张；检查地图、社区、切页进度归零。
- 上下滚动16步记录进度0→0.99482→0，停止后进度保持不变。
- 701、1024、1280、1440、1920桌面宽度及390手机无横向溢出；导航与品牌不重叠。390手机品牌x=23.3984，底部导航65px，未变。
- 浏览器无错误或警告；原有全部public资源逐文件对比保持一致。
- 减少动态效果通过模拟系统偏好的自动化测试及CSS静态规则验证；本次未修改用户操作系统偏好。

## 交付

previews/scroll-desktop-home.png、scroll-mobile-home.png、scroll-desktop-hub.png、scroll-desktop-map.png、scroll-desktop-community.png。
previews/scroll-up-down-demo.mp4 为真实页面上下滚动的逐帧截图演示，约11秒，无音轨；没有修改网页正文或参考视频。

修改前完整备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-卷轴背景修改前-20261019/（含一致性数据库备份）。

双击“启动演示.command”，访问 http://127.0.0.1:4173/#home。共享访问范围与此前相同，未公开端口或上线。
