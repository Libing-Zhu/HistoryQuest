const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const TOPICS = ["百子大礼轿", "匠艺与婚俗", "上海城市记忆", "参观体验"];
const MB = 1024 * 1024;
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function createCommunity(directory, serveFile) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const mediaDirectory = path.join(directory, "media");
  fs.mkdirSync(mediaDirectory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path.join(directory, "community.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, owner TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY, owner TEXT NOT NULL, nickname TEXT NOT NULL, topic TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS posts_order ON posts(at DESC,id DESC);
    CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY, post TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, name TEXT NOT NULL, kind TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL);
  `);
  const fail = (status, message) =>
    Object.assign(new Error(message), { status });
  function send(res, status, data) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  }
  function session(req) {
    const token = /(?:^|;\s*)hq_visitor=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie || "",
    )?.[1];
    return (
      token &&
      db
        .prepare("SELECT owner FROM sessions WHERE token=? AND expires>?")
        .get(hash(token), Date.now())
    );
  }
  function post(row, owner) {
    return {
      ...row,
      owner: undefined,
      mine: row.owner === owner,
      media: db
        .prepare(
          "SELECT id,name,kind,type FROM media WHERE post=? ORDER BY rowid",
        )
        .all(row.id)
        .map((m) => ({ ...m, url: "/api/community/media/" + m.id })),
    };
  }
  const requests = new Map();
  async function route(req, res, url) {
    if (!url.pathname.startsWith("/api/community/")) return false;
    try {
      if (req.method === "GET" && url.pathname === "/api/community/session") {
        let identity = session(req);
        if (!identity) {
          db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
          const token = crypto.randomBytes(32).toString("hex");
          identity = { owner: crypto.randomUUID() };
          db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
            hash(token),
            identity.owner,
            Date.now() + 30 * 86400000,
          );
          res.setHeader(
            "Set-Cookie",
            `hq_visitor=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${req.socket.encrypted || process.env.HISTORYQUEST_PUBLIC_ORIGIN?.startsWith("https://") ? "; Secure" : ""}`,
          );
        }
        send(res, 200, { id: identity.owner });
        return true;
      }
      const identity = session(req);
      if (["POST", "DELETE"].includes(req.method)) {
        const expected =
          process.env.HISTORYQUEST_PUBLIC_ORIGIN ||
          (req.socket.encrypted ? "https://" : "http://") + req.headers.host;
        if (req.headers.origin !== expected)
          throw fail(403, "请求来源不符，请从本站页面操作。");
        if (!identity) throw fail(401, "发布身份已失效，请刷新页面重试。");
      }
      if (req.method === "GET" && url.pathname === "/api/community/posts") {
        let before = Number.MAX_SAFE_INTEGER,
          id = "~";
        if (url.searchParams.has("cursor")) {
          try {
            const cursor = JSON.parse(
              Buffer.from(
                url.searchParams.get("cursor"),
                "base64url",
              ).toString(),
            );
            before = cursor.at;
            id = cursor.id;
          } catch {
            throw fail(400, "分页参数无效。");
          }
          if (
            !Number.isSafeInteger(before) ||
            typeof id !== "string" ||
            id.length > 64
          )
            throw fail(400, "分页参数无效。");
        }
        const rows = db
          .prepare(
            "SELECT * FROM posts WHERE at<? OR (at=? AND id<?) ORDER BY at DESC,id DESC LIMIT 11",
          )
          .all(before, before, id);
        const items = rows.slice(0, 10),
          last = items.at(-1);
        send(res, 200, {
          posts: items.map((p) => post(p, identity?.owner)),
          cursor:
            rows.length > 10
              ? Buffer.from(
                  JSON.stringify({ at: last.at, id: last.id }),
                ).toString("base64url")
              : null,
        });
        return true;
      }
      const mediaMatch = /^\/api\/community\/media\/([a-f0-9-]{36})$/.exec(
        url.pathname,
      );
      if (mediaMatch && ["GET", "HEAD"].includes(req.method)) {
        const media = db
          .prepare("SELECT * FROM media WHERE id=?")
          .get(mediaMatch[1]);
        if (!media) throw fail(404, "附件不存在。");
        serveFile(req, res, path.join(mediaDirectory, media.id), media.type);
        return true;
      }
      if (req.method === "POST" && url.pathname === "/api/community/posts") {
        const now = Date.now();
        for (const [key, value] of requests)
          if (now - value.start > 60000) requests.delete(key);
        const limit = requests.get(identity.owner) || { start: now, count: 0 };
        if (++limit.count > 10) throw fail(429, "发布过于频繁，请稍后再试。");
        requests.set(identity.owner, limit);
        if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
          throw fail(415, "请使用发布表单上传。");
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 68 * MB) throw fail(413, "附件总大小超过限制。");
          chunks.push(chunk);
        }
        let form;
        try {
          form = await new Request("http://localhost/upload", {
            method: "POST",
            headers: { "content-type": req.headers["content-type"] },
            body: Buffer.concat(chunks),
          }).formData();
        } catch {
          throw fail(400, "附件上传不完整，请重试。");
        }
        const nickname = form.get("nickname"),
          topic = form.get("topic"),
          text = form.get("text");
        if (![nickname, topic, text].every((x) => typeof x === "string"))
          throw fail(400, "分享字段无效。");
        if (
          nickname.trim().length > 24 ||
          text.trim().length > 2000 ||
          !TOPICS.includes(topic)
        )
          throw fail(400, "请检查昵称、主题与文字长度。");
        const files = form.getAll("media");
        if (files.length > 4 || (!text.trim() && !files.length))
          throw fail(400, "请填写分享内容，或添加照片、视频。");
        const media = [];
        let images = 0,
          videos = 0;
        for (const file of files) {
          if (typeof file === "string" || !file.size)
            throw fail(400, "附件为空或无效。");
          const type = file.type,
            kind = type.startsWith("image/") ? "image" : "video";
          if (
            (kind === "image" ? ++images > 3 : ++videos > 1) ||
            file.size > (kind === "image" ? 12 : 30) * MB
          )
            throw fail(413, "每条最多3张12MB照片和1个30MB视频。");
          const bytes = Buffer.from(await file.arrayBuffer());
          const valid =
            type === "image/jpeg"
              ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
              : type === "image/png"
                ? bytes
                    .subarray(0, 8)
                    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                : type === "image/webp"
                  ? bytes.toString("ascii", 0, 4) === "RIFF" &&
                    bytes.toString("ascii", 8, 12) === "WEBP"
                  : type === "video/mp4"
                    ? bytes.toString("ascii", 4, 8) === "ftyp"
                    : type === "video/webm"
                      ? bytes
                          .subarray(0, 4)
                          .equals(Buffer.from([26, 69, 223, 163]))
                      : false;
          if (!valid) throw fail(415, "附件内容与支持的格式不符。");
          media.push({
            id: crypto.randomUUID(),
            name: path.basename(file.name).slice(0, 160) || "游客附件",
            kind,
            type,
            size: file.size,
            bytes,
          });
        }
        const total = db
          .prepare("SELECT coalesce(sum(size),0) AS size FROM media")
          .get().size;
        if (total + media.reduce((sum, m) => sum + m.size, 0) > 2 * 1024 * MB)
          throw fail(507, "共享存储空间已满，请联系维护人员。");
        if (db.prepare("SELECT count(*) AS n FROM posts").get().n >= 10000)
          throw fail(507, "分享数量已达上限，请联系维护人员。");
        const row = {
          id: crypto.randomUUID(),
          owner: identity.owner,
          nickname: nickname.trim() || "匿名游客",
          topic,
          text: text.trim(),
          at: now,
        };
        try {
          db.exec("BEGIN");
          db.prepare("INSERT INTO posts VALUES(?,?,?,?,?,?)").run(
            row.id,
            row.owner,
            row.nickname,
            row.topic,
            row.text,
            row.at,
          );
          for (const m of media) {
            fs.writeFileSync(path.join(mediaDirectory, m.id), m.bytes, {
              flag: "wx",
              mode: 0o600,
            });
            db.prepare("INSERT INTO media VALUES(?,?,?,?,?,?)").run(
              m.id,
              row.id,
              m.name,
              m.kind,
              m.type,
              m.size,
            );
          }
          db.exec("COMMIT");
        } catch (error) {
          try {
            db.exec("ROLLBACK");
          } catch {}
          for (const m of media)
            fs.rmSync(path.join(mediaDirectory, m.id), { force: true });
          throw error;
        }
        send(res, 201, post(row, identity.owner));
        return true;
      }
      const deletion = /^\/api\/community\/posts\/([a-f0-9-]{36})$/.exec(
        url.pathname,
      );
      if (req.method === "DELETE" && deletion) {
        const row = db
          .prepare("SELECT * FROM posts WHERE id=?")
          .get(deletion[1]);
        if (!row) throw fail(404, "分享不存在。");
        if (row.owner !== identity.owner)
          throw fail(403, "只能删除自己发布的分享。");
        const media = db
          .prepare("SELECT id FROM media WHERE post=?")
          .all(row.id);
        db.prepare("DELETE FROM posts WHERE id=?").run(row.id);
        for (const m of media)
          fs.rmSync(path.join(mediaDirectory, m.id), { force: true });
        send(res, 200, { deleted: true });
        return true;
      }
      throw fail(404, "接口不存在。");
    } catch (error) {
      if (!res.headersSent)
        send(res, error.status || 500, {
          error: error.status
            ? error.message
            : "共享服务暂时无法保存，请保留草稿后重试。",
        });
      else res.destroy();
    }
    return true;
  }
  return { route, close: () => db.close() };
}
module.exports = { createCommunity };
