# Windows启动支持 · 2026-10-20

## 新增
- 启动演示.bat：UTF-8无BOM、CRLF；chcp 65001；pushd脚本目录支持跨盘符及UNC；关闭延迟展开以保留!字符；检测node存在和24+/node:sqlite；失败保留窗口及真实错误。无需管理员、npm依赖安装或重新构建。
- server/launcher-platform.cjs：共用运行时检查；Windows通过rundll32.exe URL协议处理器打开默认浏览器，execFile分离参数、不经过shell；失败提示手动地址。Mac使用原open命令。
- 使用说明.txt：Windows/Mac步骤、Node前提、备用命令、本机范围、数据及共享边界。
- server-tests/launcher.test.cjs：启动及兼容性测试。

## 服务端修改
启动网页.cjs仅修改启动及重复启动识别：健康检查同时核对构建、项目真实目录及数据目录指纹（不返回实际路径）。归一化已有祖先目录，避免首次创建数据目录前后及/var符号链接差异。端口监听成功后才打开数据库，冲突时不创建/修改另一份数据。
保持127.0.0.1监听，不开放端口、不配置防火墙、不发布网站。
Mac启动演示.command字节未改，原有备用Node搜索保持。无新增本机路径、密钥或开发配置。

## 验证
- Node语法检查通过。
- Node服务测试5项全部通过：版本不满足和SQLite不可用的模拟检查；Windows浏览器命令分离参数/失败提示；批处理编码、标签、引用及错误分支静态检查；Mac实际Node子进程启动/同目录复用/另一目录同构建拒绝复用/不同数据目录拒绝复用/不同构建拒绝复用/其他程序占端口/非法端口/缺dist/特殊字符路径/移动目录/API/媒体Range读取；独立访客共享及删除权限/持久化测试。
- Mac实际执行启动演示.command，正常服务并重复启动复用；HTTP前端和社区API正常。
- 当前Mac环境无可用默认浏览器关联，open返回-10661；程序正确输出手动URL，服务未退出。未修改系统默认浏览器。
- 无Windows环境，未验证Windows实机双击、cmd编码和默认浏览器。上述自动测试及代码检查不能视为Windows实机验证。
- src/dist/public与修改前备份逐字节一致；未重新构建前端；community-data不覆盖、不清空浏览器保存内容。

## 运行
Windows先安装Node.js 24或以上版本，完整解压后双击启动演示.bat。
Mac仍双击启动演示.command。
备用：node 启动网页.cjs。
默认本机地址：http://127.0.0.1:4173/。
备份：/Users/yukkks/Documents/Codex/2026-09-19/fan/backups/HistoryQuest-Windows支持修改前-20261020。
