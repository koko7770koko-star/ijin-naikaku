// AI支援：答えが長い（3000 字・表や箇条書き・長い英数字の列・URL 風の文字入り）とき、390px・文字「標準」「特大」で横にはみ出さず、
// 答えの欄から文字が出ず、「コピー」で全文が取れる（通信は止めて、ダミーのキーとダミーの答えで確かめる。hz-v-ai-long-answer）
// usage: node hozen/tools/ailongcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[],errs=[];
const LONG=(()=>{let s='## 点検結果のまとめ\n\n| 項目 | 測定値 | 判定 | 備考 |\n|---|---|---|---|\n';
 for(let i=1;i<=12;i++)s+='| 絶縁抵抗'+i+' | '+(100+i)+'MΩ | 良 | 前回との差は小さい |\n';
 s+='\n- 盤内の発熱：異常なし\n- 端子および碍子：緩み・汚れなし\n  - 補足：高圧受電盤の端子は増し締め済み\n\n型番の例：ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\n参照：https://example.invalid/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n\n';
 while(s.length<3000)s+='受変電設備の年次点検では、停電の範囲と時間を事前に関係者へ知らせ、検電と接地を確かめてから作業に入る。';
 return s.slice(0,3000)+'【おわり】'})();
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){
 const c=await b.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();let sent=0;const tag='390px・'+(fs==='xl'?'特大':'標準')+'・';
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();if(/anthropic/.test(u)){sent++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:[{type:'text',text:LONG}]})})}r.abort()});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(f=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key');S.settings.fscale=f;save();applyFScale()},fs);
 await p.evaluate(()=>aiDraft('試験','テスト本文','使う',t=>{window.__used=t}));await p.waitForTimeout(200);await p.click('text=この内容を送る');await p.waitForSelector('#ai_text',{timeout:5000});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const e=document.querySelector('#ai_text');const v=e.value!=null&&e.tagName!=='DIV'?e.value:e.innerText;
  const m=document.querySelector('#modal')||document.querySelector('.modal');const over=[...(m?m.querySelectorAll('*'):[])].filter(x=>{const q=x.getBoundingClientRect();return q.width&&q.right>innerWidth+1}).map(x=>x.tagName+'.'+x.className).slice(0,3);
  return{len:v.length,end:v.includes('【おわり】'),sw:document.documentElement.scrollWidth,ew:e.scrollWidth>e.clientWidth+1,over}});
 if(!r.end)bad.push(tag+'答えが最後まで出ない（'+r.len+' 字）');
 if(r.sw>392)bad.push(tag+'横にはみ出す '+r.sw);if(r.ew)bad.push(tag+'答えの欄から文字が横に出る');if(r.over.length)bad.push(tag+'窓から出る部品 '+r.over.join(' '));
 await p.click('#ai_copy');await p.waitForTimeout(300);
 const cb=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>'ERR'));if(cb!==LONG)bad.push(tag+'コピーで全文が取れない（'+cb.length+' 字／'+LONG.length+' 字）');
 if(!sent)bad.push(tag+'通信の確認が働いていない');
 await c.close()}
 console.log([...new Set([...errs,...bad])].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
