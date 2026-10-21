const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {createCommunity}=require('../server/community.cjs');
test('two independent visitor sessions share durable text/media, while mutation and ownership checks hold',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'hq-community-test-'));
  let service,server,base;
  async function start(){
    service=createCommunity(directory,(req,res,file,type)=>{res.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(res);});
    server=http.createServer(async(req,res)=>{if(!await service.route(req,res,new URL(req.url,base))) {res.writeHead(404);res.end();}});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
  }
  async function stop(){await new Promise(r=>server.close(r));service.close();}
  await start();
  try {
    const visit=async()=>{const r=await fetch(base+'/api/community/session');assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);return cookie.split(';')[0];};
    const first=await visit(),second=await visit();assert.notEqual(first,second);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5X0AAAAASUVORK5CYII=','base64');
    const form=(text='独立访客可读取的测试分享',blob)=>{const f=new FormData();f.set('nickname','测试游客');f.set('topic','百子大礼轿');f.set('text',text);if(blob)f.append('media',blob,'test.png');return f;};
    const publish=(cookie,body,origin=base)=>fetch(base+'/api/community/posts',{method:'POST',headers:{cookie,origin},body});
    assert.equal((await publish('',form())).status,401);
    assert.equal((await publish(first,form(),'http://different.example')).status,403);
    assert.equal((await publish(first,form('',new Blob(['<svg/>'],{type:'image/png'})))).status,415);
    assert.equal((await publish(first,form('x'.repeat(2001)))).status,400);
    const result=await publish(first,form(undefined,new Blob([png],{type:'image/png'})));assert.equal(result.status,201);const post=await result.json();assert.equal(post.mine,true);assert.equal(post.owner,undefined);
    let listing=await (await fetch(base+'/api/community/posts',{headers:{cookie:second}})).json();assert.equal(listing.posts.length,1);assert.equal(listing.posts[0].mine,false);assert.equal(listing.posts[0].text,'独立访客可读取的测试分享');
    assert.deepEqual(Buffer.from(await (await fetch(base+listing.posts[0].media[0].url)).arrayBuffer()),png);
    const wrong=await fetch(base+'/api/community/posts/'+post.id,{method:'DELETE',headers:{cookie:second,origin:base}});assert.equal(wrong.status,403);
    // Storage and private owner sessions survive a real server restart.
    await stop();await start();
    listing=await (await fetch(base+'/api/community/posts',{headers:{cookie:first}})).json();assert.equal(listing.posts[0].mine,true);assert.equal(listing.posts[0].id,post.id);
    assert.deepEqual(Buffer.from(await (await fetch(base+listing.posts[0].media[0].url)).arrayBuffer()),png);
    // Cursor pagination is newest first, without duplicate rows.
    for(let n=0;n<10;n++)assert.equal((await publish(n%2?first:second,form('分页'+n))).status,201);
    const page=await (await fetch(base+'/api/community/posts',{headers:{cookie:first}})).json();assert.equal(page.posts.length,10);assert.ok(page.cursor);
    const next=await (await fetch(base+'/api/community/posts?cursor='+encodeURIComponent(page.cursor))).json();assert.equal(next.posts.length,1);assert.equal(new Set([...page.posts,...next.posts].map(p=>p.id)).size,11);
    const deleted=await fetch(base+'/api/community/posts/'+post.id,{method:'DELETE',headers:{cookie:first,origin:base}});assert.equal(deleted.status,200);
    assert.equal((await fetch(base+post.media[0].url)).status,404);
  } finally {await stop();fs.rmSync(directory,{recursive:true,force:true});}
});
