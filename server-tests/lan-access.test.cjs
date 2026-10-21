const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { privateIPv4, candidates, chooseAddress, writeQr, invalidateQr } = require('../server/lan-access.cjs');
const a = address => ({ address, family: 'IPv4', internal: false });
test('only physical private IPv4 addresses are proposed; VPN/virtual/loopback/public entries are excluded', () => {
  const list = candidates({ lo0: [{ ...a('127.0.0.1'), internal: true }], en0: [a('172.20.10.2')], en1: [a('192.168.1.8')], utun4: [a('198.18.0.1'), a('10.8.0.2')], 'vEthernet (WSL)': [a('172.29.0.1')], tun0: [a('10.1.1.1')], other: [a('8.8.8.8')] });
  assert.deepEqual(list.map(c => c.address), ['172.20.10.2', '192.168.1.8']);
  for (const ip of ['127.0.0.1','169.254.1.1','198.18.0.1','8.8.8.8','0.0.0.0','192.168.1.999']) assert.equal(privateIPv4(ip), false);
});
test('single candidate works, multiple candidates require explicit choice, and unavailable selections fail', async () => {
  const interfaces = { en0: [a('192.168.1.8')], en1: [a('10.0.0.5')] };
  await assert.rejects(chooseAddress({ interfaces, input: { isTTY: false }, output: { write() {} } }), /无法自动确定/);
  assert.equal(await chooseAddress({ interfaces, selected: '10.0.0.5' }), '10.0.0.5');
  await assert.rejects(chooseAddress({ interfaces, selected: '127.0.0.1' }), /不在当前/);
  await assert.rejects(chooseAddress({ interfaces: {} }), /未找到/);
  assert.equal(await chooseAddress({ interfaces: { en0: [a('192.168.1.8')] } }), '192.168.1.8');
});
test('QR files are new per invocation, preserve quiet white background and can be marked stale without altering old images', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hq-qr-'));
  try {
    const first = writeQr(directory, '192.168.1.8', 4173), second = writeQr(directory, '192.168.1.9', 4174);
    assert.notEqual(first.image, second.image); assert.ok(fs.existsSync(first.image));
    assert.equal(second.url, 'http://192.168.1.9:4174/');
    assert.deepEqual([...fs.readFileSync(second.image).subarray(0, 8)], [137,80,78,71,13,10,26,10]);
    assert.match(fs.readFileSync(second.page, 'utf8'), /保持电脑服务运行/);
    const png = fs.readFileSync(second.image); invalidateQr(directory, 'network changed');
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, '当前局域网入口.json'))).valid, false);
    assert.deepEqual(fs.readFileSync(second.image), png);
    assert.throws(() => writeQr(directory, '127.0.0.1', 4173), /地址或端口无效/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
