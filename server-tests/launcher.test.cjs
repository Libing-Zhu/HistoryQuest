const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { checkRuntime, browserCommand, openBrowser } = require('../server/launcher-platform.cjs');

test('runtime check rejects old Node and unavailable SQLite with actionable messages', () => {
  assert.throws(() => checkRuntime('23.9.0', () => {}), /Node.js 24/);
  assert.throws(() => checkRuntime('24.1.0', () => { throw new Error('disabled'); }), /node:sqlite.*disabled/);
  assert.doesNotThrow(() => checkRuntime('24.1.0', name => assert.equal(name, 'node:sqlite')));
});
test('browser launch uses separate arguments, handles failure, and can be disabled', () => {
  const url = 'http://127.0.0.1:4173/#home';
  assert.deepEqual(browserCommand('win32', url), ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]);
  assert.deepEqual(browserCommand('darwin', url), ['open', [url]]);
  let calls = 0, warning = '';
  openBrowser(url, { platform: 'win32', noOpen: '', execFile(command, args, options, callback) {
    calls++; assert.equal(command, 'rundll32.exe'); assert.equal(args[1], url); assert.equal(options.shell, undefined);
    callback(new Error('no browser'));
  }, warn: message => warning = message });
  assert.equal(calls, 1); assert.match(warning, /请手动访问/);
  openBrowser(url, { noOpen: '1', execFile() { assert.fail('must not launch'); } });
});
test('Windows batch has UTF-8 CRLF, portable quoted paths, runtime guards and readable failure exits', () => {
  const bytes = fs.readFileSync(path.join(__dirname, '../启动演示.bat'));
  const bat = bytes.toString('utf8');
  assert.ok(!bytes.subarray(0, 3).equals(Buffer.from([239, 187, 191])));
  assert.equal(bat.replaceAll('\r\n', '').includes('\n'), false);
  for (const pattern of [/DisableDelayedExpansion/, /chcp 65001/, /pushd "%~dp0"/, /where node/, /goto node_missing/, /goto runtime_error/, /node "启动网页.cjs"/, /:launch_error/, /pause/, /https:\/\/nodejs.org\//]) assert.match(bat, pattern);
  assert.doesNotMatch(bat, /\/Users\/|curl |powershell|npm install/i);
});
const source = path.resolve(__dirname, '..');
function fixture(parent, name) {
  const dir = path.join(parent, name); fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(source, '启动网页.cjs'), path.join(dir, '启动网页.cjs'));
  fs.cpSync(path.join(source, 'server'), path.join(dir, 'server'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist/index.html'), '<!doctype html><title>寻迹上海</title>');
  fs.writeFileSync(path.join(dir, 'dist/文物 图片.png'), Buffer.from([137,80,78,71,13,10,26,10]));
  return dir;
}
async function freePort() {
  const s = http.createServer(); await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  const port = s.address().port; await new Promise(resolve => s.close(resolve)); return port;
}
function launch(dir, port, extra = {}, args = []) {
  const child = spawn(process.execPath, [path.join(dir, '启动网页.cjs'), ...args], {
    cwd: os.tmpdir(), env: { ...process.env, HISTORYQUEST_PORT: String(port), HISTORYQUEST_NO_OPEN: '1', HISTORYQUEST_DATA_DIR: path.join(dir, '共享 数据 & !'), ...extra },
  });
  let output = '';
  child.stdout.on('data', chunk => output += chunk); child.stderr.on('data', chunk => output += chunk);
  const exited = once(child, 'exit').then(([code]) => ({ code, output }));
  return { child, exited, output: () => output };
}
async function ready(port, proc) {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    try { const response = await fetch(`http://127.0.0.1:${port}/api/community/health`); if (response.ok) return await response.json(); } catch {}
    if (proc.child.exitCode !== null) throw new Error(proc.output());
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('startup timeout: ' + proc.output());
}
async function stop(proc) { if (proc && proc.child.exitCode === null) proc.child.kill('SIGTERM'); if (proc) await proc.exited; }

test('real local launcher supports moved special-character directories, exact-instance reuse, API/media and occupied ports', { timeout: 30000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hq-launcher-'));
  let active, occupied;
  try {
    let dir = fixture(temp, '中文 项目 & ! (首份)');
    const other = fixture(temp, '中文 项目 & ! (另一份)');
    let port = await freePort(); active = launch(dir, port);
    const health = await ready(port, active);
    assert.equal(health.service, 'historyquest-shared-v1'); assert.match(health.instance, /^[a-f0-9]{64}$/);
    const base = `http://127.0.0.1:${port}`;
    assert.match(await (await fetch(base)).text(), /寻迹上海/);
    assert.equal((await fetch(base + '/' + encodeURIComponent('文物 图片.png'), { headers: { Range: 'bytes=0-3' } })).status, 206);
    assert.deepEqual((await (await fetch(base + '/api/community/posts')).json()).posts, []);
    assert.equal((await fetch(base + '/api/community/session')).status, 200);
    const repeated = await launch(dir, port).exited;
    assert.equal(repeated.code, 0, repeated.output); assert.match(repeated.output, /已在运行/);
    const alternateData = path.join(temp, '不同数据目录');
    assert.equal((await launch(dir, port, { HISTORYQUEST_DATA_DIR: alternateData }).exited).code, 1);
    assert.equal(fs.existsSync(alternateData), false);
    const wrongProject = await launch(other, port).exited;
    assert.equal(wrongProject.code, 1); assert.match(wrongProject.output, /其他项目目录/);
    assert.equal(fs.existsSync(path.join(other, '共享 数据 & !')), false);
    fs.writeFileSync(path.join(dir, 'dist/index.html'), '<title>new build</title>');
    assert.equal((await launch(dir, port).exited).code, 1);
    await stop(active); active = undefined;
    const moved = path.join(temp, '移动后的 项目 & ! (二)'); fs.renameSync(dir, moved); dir = moved;
    port = await freePort(); active = launch(dir, port); const movedHealth = await ready(port, active);
    assert.notEqual(movedHealth.instance, health.instance);
    assert.equal((await launch(dir, port).exited).code, 0);
    await stop(active); active = undefined;
    occupied = http.createServer((req, res) => { res.writeHead(200); res.end('not historyquest'); });
    await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
    const conflict = await launch(dir, occupied.address().port).exited;
    assert.equal(conflict.code, 1); assert.match(conflict.output, /端口被其他程序/);
    const invalid = await launch(dir, 70000).exited; assert.equal(invalid.code, 1); assert.match(invalid.output, /1—65535/);
    const missing = fixture(temp, '缺失 dist'); fs.rmSync(path.join(missing, 'dist'), { recursive: true });
    assert.equal((await launch(missing, await freePort()).exited).code, 1);
  } finally {
    await stop(active); if (occupied) await new Promise(resolve => occupied.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
test('LAN mode has a separate listener, renews its QR, and shares posts/media through its actual LAN origin', { timeout: 30000 }, async t => {
  const { candidates } = require('../server/lan-access.cjs');
  const address = candidates()[0]?.address;
  if (!address) { t.skip('No physical private IPv4 interface in this test environment'); return; }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hq-lan-launcher-'));
  let active, local;
  try {
    const dir = fixture(temp, '局域网 项目 & !'); const port = await freePort();
    active = launch(dir, port, { HISTORYQUEST_LAN_IP: address }, ['--lan']);
    const base = `http://${address}:${port}`;
    let health;
    for (let n = 0; n < 100; n++) {
      try { const response = await fetch(base + '/api/community/health'); if (response.ok) { health = await response.json(); break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(health?.mode, 'lan', active.output()); assert.equal(health.address, address);
    const directory = path.join(dir, '二维码与线上入口/局域网二维码');
    const before = JSON.parse(fs.readFileSync(path.join(directory, '当前局域网入口.json')));
    assert.equal(before.url, base + '/'); assert.ok(fs.existsSync(path.join(directory, before.image)));
    const repeated = await launch(dir, port, { HISTORYQUEST_LAN_IP: address }, ['--lan']).exited;
    assert.equal(repeated.code, 0, repeated.output);
    const after = JSON.parse(fs.readFileSync(path.join(directory, '当前局域网入口.json')));
    assert.notEqual(after.image, before.image); assert.ok(fs.existsSync(path.join(directory, before.image)));
    const visitor = async () => (await fetch(base + '/api/community/session')).headers.get('set-cookie').split(';')[0];
    const first = await visitor(), second = await visitor();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5X0AAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.set('text', '仅测试目录内的局域网分享'); form.set('nickname', '测试访客'); form.set('topic', '百子大礼轿'); form.append('media', new Blob([png], { type: 'image/png' }), 'test.png');
    const posted = await fetch(base + '/api/community/posts', { method: 'POST', headers: { cookie: first, origin: base }, body: form });
    assert.equal(posted.status, 201);
    const listing = await (await fetch(base + '/api/community/posts', { headers: { cookie: second } })).json();
    assert.equal(listing.posts[0].mine, false);
    assert.deepEqual(Buffer.from(await (await fetch(base + listing.posts[0].media[0].url)).arrayBuffer()), png);
    assert.equal((await fetch(base + '/api/community/posts/' + listing.posts[0].id, { method: 'DELETE', headers: { cookie: second, origin: base } })).status, 403);
    local = launch(dir, port); const localHealth = await ready(port, local);
    assert.equal(localHealth.mode, 'local'); assert.notEqual(localHealth.instance, health.instance);
    assert.equal((await launch(dir, port).exited).code, 0);
    assert.equal((await fetch(base + '/')).status, 200);
  } finally { await stop(active); await stop(local); fs.rmSync(temp, { recursive: true, force: true }); }
});


test('cloud mode uses provider PORT, HTTPS cookies and origin, and persists shared posts across restart', { timeout: 30000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hq-cloud-'));
  let active;
  try {
    const dir = fixture(temp, 'cloud');
    const port = await freePort();
    const origin = 'https://historyquest.example';
    const env = { HISTORYQUEST_CLOUD: '1', PORT: String(port), RENDER_EXTERNAL_URL: origin };
    active = launch(dir, 70000, env);
    const health = await ready(port, active);
    assert.equal(health.mode, 'cloud');
    assert.equal(health.address, '0.0.0.0');
    const base = `http://127.0.0.1:${port}`;
    const session = await fetch(base + '/api/community/session');
    const setCookie = session.headers.get('set-cookie');
    assert.match(setCookie, /; Secure/);
    assert.match(setCookie, /HttpOnly; SameSite=Lax/);
    const cookie = setCookie.split(';')[0];
    const form = new FormData();
    form.set('nickname', 'Cloud test');
    form.set('topic', '百子大礼轿');
    form.set('text', 'Persist this test post across restart');
    const denied = await fetch(base + '/api/community/posts', { method: 'POST', headers: { cookie, origin: 'https://other.example' }, body: form });
    assert.equal(denied.status, 403);
    const posted = await fetch(base + '/api/community/posts', { method: 'POST', headers: { cookie, origin }, body: form });
    assert.equal(posted.status, 201);
    const post = await posted.json();
    await stop(active);
    active = launch(dir, 70000, env);
    await ready(port, active);
    const listing = await (await fetch(base + '/api/community/posts', { headers: { cookie } })).json();
    assert.equal(listing.posts[0].id, post.id);
    assert.equal(listing.posts[0].mine, true);
    const file = await fetch(base + '/index.html', { headers: { range: 'bytes=0-9' } });
    assert.equal(file.status, 206);
    assert.equal((await file.arrayBuffer()).byteLength, 10);
  } finally {
    await stop(active);
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
