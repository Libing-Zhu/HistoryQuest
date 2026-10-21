// Built-in Node APIs only. Shared by direct launch and the Windows batch entry.
function checkRuntime(version = process.versions.node, load = require) {
  const major = Number(String(version).split(".")[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error("需要 Node.js 24 或以上版本；当前版本为 " + version + "。");
  }
  try { load("node:sqlite"); }
  catch (error) { throw new Error("当前 Node.js 无法使用 node:sqlite：" + error.message); }
}
function browserCommand(platform, url) {
  if (platform === "win32") return ["rundll32.exe", ["url.dll,FileProtocolHandler", url]];
  if (platform === "darwin") return ["open", [url]];
  return ["xdg-open", [url]];
}
function openBrowser(url, { platform = process.platform, execFile = require("node:child_process").execFile, noOpen = process.env.HISTORYQUEST_NO_OPEN, warn = console.error } = {}) {
  if (noOpen) return;
  const [command, args] = browserCommand(platform, url);
  execFile(command, args, { windowsHide: true }, (error) => {
    if (error) warn("浏览器未能自动打开，请手动访问：" + url + "\n" + error.message);
  });
}
module.exports = { checkRuntime, browserCommand, openBrowser };
if (require.main === module) {
  try { checkRuntime(); }
  catch (error) {
    console.error(error.message + "\n请从 https://nodejs.org/ 安装 Node.js 24 或以上版本。");
    process.exitCode = 1;
  }
}
