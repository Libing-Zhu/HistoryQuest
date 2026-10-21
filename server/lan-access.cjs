const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const qrcode = require('./vendor/qrcode-generator.cjs');
const privateIPv4 = ip => {
  const p = String(ip).split('.').map(Number);
  return p.length === 4 && p.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
    && (p[0] === 10 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168));
};
function candidates(interfaces = os.networkInterfaces()) {
  const excluded = /^(lo\d*|utun|tun|tap|ppp|wg|docker|veth|vmnet|vbox|virbr|awdl|llw|ap\d)|vpn|virtual|vEthernet|tailscale|zerotier|hyper-v|loopback/i;
  const seen = new Set();
  return Object.entries(interfaces).flatMap(([name, addresses]) => {
    if (excluded.test(name)) return [];
    return (addresses || []).filter(a => !a.internal && (a.family === 'IPv4' || a.family === 4) && privateIPv4(a.address) && !seen.has(a.address))
      .map(a => { seen.add(a.address); return { name, address: a.address }; });
  });
}
async function chooseAddress({ interfaces, selected = process.env.HISTORYQUEST_LAN_IP, input = process.stdin, output = process.stdout } = {}) {
  const choices = candidates(interfaces);
  if (selected) {
    if (!choices.some(c => c.address === selected)) throw new Error('指定IP不在当前有效实体局域网地址中：' + selected);
    return selected;
  }
  if (!choices.length) throw new Error('未找到可用的局域网IPv4地址。请连接Wi-Fi或有线局域网后重新启动；不使用VPN、回环或虚拟网卡地址。');
  if (choices.length === 1) return choices[0].address;
  const listing = choices.map((c, i) => `${i + 1}. ${c.name}: ${c.address}`).join('\n');
  output.write('检测到多个局域网地址，请选择手机所连接网络对应的一项：\n' + listing + '\n');
  if (!input.isTTY) throw new Error('无法自动确定网卡。请在终端交互启动，或设置HISTORYQUEST_LAN_IP为上面某个地址后重试。');
  const readline = require('node:readline/promises').createInterface({ input, output });
  try {
    const answer = (await readline.question('请输入编号（不默认选择）：')).trim();
    const index = Number(answer) - 1;
    if (!/^\d+$/.test(answer) || !choices[index]) throw new Error('没有选择有效网卡，请重新启动并选择。');
    return choices[index].address;
  } finally { readline.close(); }
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const label = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([label, data])));
  return Buffer.concat([length, label, data, checksum]);
}
function png(matrix, scale = 10, quiet = 4) {
  const count = matrix.getModuleCount(); const size = (count + quiet * 2) * scale;
  const raw = Buffer.alloc((size + 1) * size, 255);
  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / scale) - quiet, col = Math.floor(x / scale) - quiet;
      if (row >= 0 && col >= 0 && row < count && col < count && matrix.isDark(row, col)) raw[y * (size + 1) + 1 + x] = 0;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function writeQr(directory, address, port) {
  if (!privateIPv4(address) || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('二维码地址或端口无效。');
  const url = `http://${address}:${port}/`;
  const matrix = qrcode(0, 'M'); matrix.addData(url, 'Byte'); matrix.make();
  fs.mkdirSync(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const name = `HistoryQuest-局域网-${address}-${port}-${stamp}-${crypto.randomBytes(2).toString('hex')}`;
  const image = path.join(directory, name + '.png');
  const svg = path.join(directory, name + '.svg');
  const page = path.join(directory, name + '.html');
  fs.writeFileSync(image, png(matrix));
  fs.writeFileSync(svg, matrix.createSvgTag({ cellSize: 10, margin: 40, scalable: true }));
  fs.writeFileSync(page, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>寻迹上海 · 同一网络扫码访问</title><style>body{font:18px/1.7 system-ui,sans-serif;background:#e8e3da;color:#14283f;text-align:center;padding:24px}main{max-width:660px;margin:auto}img{max-width:100%;width:370px;height:auto}a{color:#652f2b;word-break:break-all}small{display:block}</style><main><h1>寻迹上海 · 手机扫码</h1><img src="${path.basename(image)}" alt="手机访问二维码"><p><a href="${url}">${url}</a></p><p>仅限同一Wi-Fi或局域网；请保持电脑服务运行。</p><p>不是互联网公开网址。IP、端口或网络变化后，请重新启动“启动手机访问”并使用新二维码。</p><small>生成于 ${new Date().toISOString()}（UTC）；扫码实际可达性仍取决于系统网络权限、防火墙和设备隔离设置。</small></main></html>`);
  const record = { url, address, port, image: path.basename(image), svg: path.basename(svg), page: path.basename(page), generatedAt: new Date().toISOString(), scope: 'same-local-network', valid: true };
  fs.writeFileSync(path.join(directory, '当前局域网入口.json'), JSON.stringify(record, null, 2));
  return { ...record, image, svg, page };
}
function invalidateQr(directory, reason) {
  const file = path.join(directory, '当前局域网入口.json');
  if (fs.existsSync(file)) {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, JSON.stringify({ ...record, valid: false, reason }, null, 2));
  }
}
module.exports = { privateIPv4, candidates, chooseAddress, writeQr, invalidateQr, png };
