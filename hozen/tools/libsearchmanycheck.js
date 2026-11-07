// 技術資料：200 件（本文 3000 字・長い題・空白なしの長い英数字）で、検索が 1 秒以内に出て、当たった所が <mark> で分かり、多いときは「先頭の20件」と言葉を足す案内が出て、
// 1 件だけの言葉はその資料だけが出るか。一覧（新しい順・名前順）も 200 件並ぶか。390px・文字「標準」「特大」ではみ出さない。記録は変えない（hz-v-lib-many）。
// usage: node hozen/tools/libsearchmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();const body='高圧受電設備の保守点検について。真空遮断器（VCB）の開閉回数と接点の消耗を確かめる。'.repeat(60);
  S.library=Array.from({length:200},(_,i)=>({id:'lb'+i,title:'保守点検の手引き 第'+i+'章 ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJ'+i,tags:'受変電 VCB 点検',text:body+(i===137?'ここだけの合言葉ユニコーン':''),file:'',at:''}));save()},fs);await p.waitForTimeout(300);await p.reload();await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.evaluate(()=>{applyFScale();V.libQ='';V.libSort='new'});
 const before=await p.evaluate(()=>JSON.stringify(S.library));
 await p.evaluate(()=>go('lib'));await p.waitForTimeout(250);
 let r=await p.evaluate(()=>({n:[...document.querySelectorAll('#app .item')].filter(x=>/保守点検の手引き/.test(x.textContent)).length,sw:document.documentElement.scrollWidth}));
 if(r.n!==200)bad.push(tag+'一覧に200件並ばない '+r.n);if(r.sw>392)bad.push(tag+'一覧がはみ出す '+r.sw);
 const ms=await p.evaluate(()=>{const t=performance.now();V.libQ='開閉回数';render();return performance.now()-t});await p.waitForTimeout(150);if(ms>1000)bad.push(tag+'検索が出るまで '+Math.round(ms)+'ms');
 r=await p.evaluate(()=>{const t=document.querySelector('#app').textContent;const it=[...document.querySelectorAll('#app .item')].filter(x=>x.querySelector('mark'));return {msg:/200件見つかりました（先頭の20件/.test(t),n:it.length,mk:it.length?it[0].querySelector('mark').textContent:'',sw:document.documentElement.scrollWidth}});
 if(!r.msg)bad.push(tag+'多いときの案内が無い');if(r.n!==20)bad.push(tag+'検索の件数 '+r.n);if(r.mk!=='開閉回数')bad.push(tag+'当たった所の印 '+r.mk);if(r.sw>392)bad.push(tag+'検索がはみ出す '+r.sw);
 await p.evaluate(()=>{V.libQ='ユニコーン';render()});await p.waitForTimeout(150);
 r=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>x.querySelector('mark')).map(x=>x.textContent));if(r.length!==1||!/第137章/.test(r[0]))bad.push(tag+'1 件だけの言葉で絞れない '+r.length);
 await p.evaluate(()=>{V.libQ='';V.libSort='name';render()});await p.waitForTimeout(150);
 r=await p.evaluate(()=>({n:[...document.querySelectorAll('#app .item')].filter(x=>/保守点検の手引き/.test(x.textContent)).length,first:(document.querySelector('#app .item .ti')||{textContent:''}).textContent}));if(r.n!==200)bad.push(tag+'名前順で200件並ばない '+r.n);if(!/第0章/.test(r.first))bad.push(tag+'名前順の先頭 '+r.first);
 const after=await p.evaluate(()=>JSON.stringify(S.library));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
