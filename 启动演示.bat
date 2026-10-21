@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
pushd "%~dp0"
if errorlevel 1 goto directory_error
where node >nul 2>&1
if errorlevel 1 goto node_missing
node "server\launcher-platform.cjs" --check-runtime
if errorlevel 1 goto runtime_error
node "启动网页.cjs"
set "HQ_EXIT=%ERRORLEVEL%"
if not "%HQ_EXIT%"=="0" goto launch_error
popd
exit /b 0

:node_missing
echo 未找到 Node.js。请先安装 Node.js 24 或以上版本。
echo 官方下载地址：https://nodejs.org/
echo 安装后请关闭本窗口，再重新双击“启动演示.bat”。
goto failed

:runtime_error
echo Node.js 版本或 node:sqlite 检查未通过，请查看上面的具体错误。
echo 请从 https://nodejs.org/ 安装 Node.js 24 或以上版本。
goto failed

:launch_error
echo 启动未成功，退出代码为 %HQ_EXIT%。请查看上面的具体错误。
goto failed

:directory_error
echo 无法进入项目目录。请先将整个项目完整解压到可访问的位置。
pause
exit /b 1

:failed
pause
popd
exit /b 1
