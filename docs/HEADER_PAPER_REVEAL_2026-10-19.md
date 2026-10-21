# 顶部品牌与导航融入卷轴纸面

## 范围

运行源码只改 ScrollBackdrop.tsx 与 scroll-backdrop.css；App.tsx、导航布局、正文内容、服务端、原有公共图片和音视频不变。

移除header独立背景和底部分隔线颜色，使用transparent直接透出原来的scroll-paper及其唯一纹理层；没有新贴图或近似色块。保留品牌与导航间竖线和选中下划线。

## 时序与访问

- 首次进入/刷新：合卷与约1800ms展开阶段，整个header保持不可见。
- 纸面完全展开后才开始单独250ms透明度渐显，不移动/缩放header。
- hidden及fading阶段使用inert与aria-hidden，前者还使用visibility:hidden；指针禁用，避免隐藏链接点击或Tab误入。
- 渐显结束恢复原有inert/aria属性及交互，站内切页不重播。刷新新挂载重新执行。
- 用户开始操作仍沿用220ms加速展开，之后执行导航渐显；减少动态效果时直接展开并显示导航，运行中切换也会立即恢复显示和交互。
- 卸载清理帧、监听、观察器与临时CSS变量，恢复header原属性。滚动期间不重渲染整页。

## 验证

TypeScript、52项前端测试和生产构建通过。新增测试覆盖展开后才渐显、250ms完成后解锁、切页不重播、减少动态效果及切换、卸载恢复。

实际浏览器：
- 开场header opacity=0、visibility=hidden、inert与aria-hidden存在；合卷截图中无品牌或导航。
- 连续两次Tab后焦点在MAIN，未进入隐藏header；点击隐藏导航位置未跳转，pointer-events为none。
- 显示后opacity=1，inert与aria-hidden移除；四个导航跳转及aria-current正常，切页状态始终ready，不重播。
- 计算样式header背景及底部分隔线均为rgba(0,0,0,0)，直接共享同一纸面。
- 内部滚动600px时header、main和上下轴杆完整矩形不变，外层scrollY=0。
- 701/1280/1440桌面及390手机无横向溢出；桌面header y38、main y148，手机header y24、main y116，轴杆及底部导航坐标均不变。
- 减少动态效果用模拟偏好的自动化测试与CSS规则验证，未修改用户操作系统偏好。

## 交付

previews/paper-header-closed.jpg
previews/paper-header-open-desktop.jpg
previews/paper-header-open-mobile.jpg
previews/paper-header-opening-demo.mp4（实际页面逐帧采集，截取完整展开及结束静态段，无新增音轨）。

备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-导航融入纸面修改前-20261019/（含一致性数据库快照）。部署不覆盖community-data。

运行方式不变：双击启动演示.command，http://127.0.0.1:4173/#home。
