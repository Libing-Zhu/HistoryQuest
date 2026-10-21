// Dependency-free local launcher for the prebuilt museum prototype.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { checkRuntime, openBrowser } = require("./server/launcher-platform.cjs");
try { checkRuntime(); }
catch (error) {
  console.error("启动失败：" + error.message + "\n请从 https://nodejs.org/ 安装 Node.js 24 或以上版本。");
  process.exit(1);
}
const cloudMode = process.env.HISTORYQUEST_CLOUD === "1";
const lanMode = !cloudMode && process.argv.includes("--lan");
const mode = cloudMode ? "cloud" : lanMode ? "lan" : "local";
let listenHost = cloudMode ? "0.0.0.0" : "127.0.0.1";
const qrDirectory = path.join(__dirname, "二维码与线上入口", "局域网二维码");
const lan = require("./server/lan-access.cjs");
const root = path.join(__dirname, "dist");
if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(
    "缺少dist/index.html，请保留完整交付文件夹或先运行npm run build。",
  );
  process.exit(1);
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt; charset=utf-8",
  ".ico": "image/x-icon",
};
const { createCommunity } = require("./server/community.cjs");
const build = require("node:crypto")
  .createHash("sha256")
  .update(fs.readFileSync(path.join(root, "index.html")))
  .digest("hex");
function serveFile(req, res, file, contentType) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const headers = {
      "Content-Type":
        contentType ||
        mime[path.extname(file).toLowerCase()] ||
        "application/octet-stream",
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    };
    let start = 0,
      end = stat.size - 1,
      status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        return res.end();
      }
      if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
      else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      }
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= stat.size
      ) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        return res.end();
      }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file, { start, end })
      .on("error", () => res.destroy())
      .pipe(res);
  });
}
if (cloudMode) {
  const origin = process.env.HISTORYQUEST_PUBLIC_ORIGIN ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  if (!origin || new URL(origin).protocol !== "https:") {
    throw new Error("Cloud mode requires an HTTPS HISTORYQUEST_PUBLIC_ORIGIN.");
  }
  if (!process.env.HISTORYQUEST_DATA_DIR) {
    throw new Error("Cloud mode requires HISTORYQUEST_DATA_DIR on a persistent disk.");
  }
  process.env.HISTORYQUEST_PUBLIC_ORIGIN = new URL(origin).origin;
  process.env.HISTORYQUEST_NO_OPEN = "1";
}
const dataDirectory = path.resolve(process.env.HISTORYQUEST_DATA_DIR || path.join(__dirname, "community-data"));
const canonical = (directory) => {
  let existing = path.resolve(directory);
  const tail = [];
  while (!fs.existsSync(existing)) {
    tail.unshift(path.basename(existing));
    existing = path.dirname(existing);
  }
  const resolved = path.join(fs.realpathSync(existing), ...tail);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};
// Hash paths rather than exposing filesystem locations in the health response.
let instance;
const instanceHash = () => require("node:crypto").createHash("sha256")
  .update(JSON.stringify([canonical(__dirname), canonical(dataDirectory), mode, listenHost]))
  .digest("hex");
let community;
const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, "http://" + req.headers.host);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  if (req.method === "GET" && url.pathname === "/api/community/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    return res.end(
      JSON.stringify({ service: "historyquest-shared-v1", build, instance, mode, address: listenHost }),
    );
  }
  if (await community.route(req, res, url)) return;
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const file = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  serveFile(req, res, file);
});
server.requestTimeout = 120000;
// Stable origin keeps IndexedDB posts and existing browser progress across restarts.
const port = Number(process.env.PORT || process.env.HISTORYQUEST_PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("HISTORYQUEST_PORT必须为1—65535之间的端口。");
  process.exit(1);
}
async function start() {
  if (lanMode) {
    console.log("手机访问模式：允许同一局域网设备访问，请保持电脑服务运行；不开放公网或修改防火墙。");
    listenHost = await lan.chooseAddress();
  }
  instance = instanceHash();
  server.listen(port, listenHost, () => {
  try { community = createCommunity(dataDirectory, serveFile); }
  catch (error) {
    console.error("启动失败：无法打开社区数据目录。" + error.message);
    server.close();
    process.exitCode = 1;
    return;
  }
  const url = `http://${listenHost}:${server.address().port}/#home`;
  if (lanMode) {
    try {
      const qr = lan.writeQr(qrDirectory, listenHost, port);
      console.log(`手机扫码地址：${qr.url}\n二维码PNG：${qr.image}\n展示页：${qr.page}\n仅同一Wi-Fi/局域网可用；换网或IP变化后重新启动生成。`);
    } catch (error) {
      console.error("二维码生成失败：" + error.message);
      server.close(() => community?.close()); process.exitCode = 1; return;
    }
    const watch = setInterval(() => {
      if (!lan.candidates().some(c => c.address === listenHost)) {
        clearInterval(watch);
        lan.invalidateQr(qrDirectory, "原局域网地址已变化，请重新启动手机访问并使用新二维码。");
        console.error("网络地址已变化：原二维码失效，请重新启动手机访问。");
        server.close(() => { community?.close(); process.exitCode = 1; });
      }
    }, 10000);
    watch.unref(); server.once("close", () => {
      clearInterval(watch);
      try { lan.invalidateQr(qrDirectory, "手机访问服务已停止，请重新启动并使用最新二维码。"); } catch (error) { console.error("二维码状态更新失败：" + error.message); }
    });
  }
  console.log(
    `\n寻迹上海已启动：${url}\n请保持窗口运行；关闭此窗口或按 Ctrl+C 会停止服务。\n若浏览器未自动打开，请手动访问以上地址。\n`,
  );
  openBrowser(url);
  });
}
server.on("error", (err) => {
  community?.close();
  if (err.code !== "EADDRINUSE") {
    console.error("启动失败：" + err.message);
    process.exitCode = 1;
    return;
  }
  // Reuse the existing server only when it serves this exact delivery build.
  const url = `http://${listenHost}:${port}/#home`;
  const request = http.get(
    `http://${listenHost}:${port}/api/community/health`,
    (response) => {
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > 1024 * 1024) response.destroy(new Error("响应过大"));
        else chunks.push(chunk);
      });
      response.on("error", occupied);
      response.on("end", () => {
        let running;
        try {
          running = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          return occupied();
        }
        if (
          response.statusCode !== 200 ||
          running.service !== "historyquest-shared-v1" ||
          running.build !== build ||
          running.instance !== instance ||
          running.mode !== mode
        )
          return occupied();
        if (lanMode) {
          try { const qr = lan.writeQr(qrDirectory, listenHost, port); console.log(`手机扫码地址：${qr.url}\n二维码PNG：${qr.image}\n展示页：${qr.page}`); }
          catch (error) { console.error("二维码生成失败：" + error.message); process.exitCode = 1; return; }
        }
        console.log(`寻迹上海已在运行，正在打开：${url}`);
        openBrowser(url);
      });
    },
  );
  request.setTimeout(3000, () => request.destroy(new Error("连接超时")));
  request.on("error", occupied);
  function occupied() {
    console.error(
      `${port}端口被其他程序、其他项目目录或不同版本占用。请关闭原启动窗口后重试。`,
    );
    process.exitCode = 1;
  }
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      community?.close();
      process.exit(0);
    }),
  );

start().catch(error => { console.error("启动失败：" + error.message); process.exitCode = 1; });
