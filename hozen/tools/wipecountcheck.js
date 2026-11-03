// 全データ消去の確かめに、消える件数が出ることを確かめる（390px）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.tasks=[{id:'t1',title:'x',date:'2026-11-03'}];S.issues=[{id:'i1',date:'2026-11-01',title:'a',status:'完了'},{id:'i2',date:'2026-11-02',title:'b',status:'完了'}];save();go('set')});await p.waitForTimeout(300);
 await p.evaluate(()=>{wipe()});await p.waitForTimeout(400);
 const t=await p.evaluate(()=>document.body.innerText);
 if(!/消える件数：予定 1件/.test(t))bad.push('件数が出ない');if(!/異常案件 2件/.test(t))bad.push('異常案件の件数が違う');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 const cnt=await p.evaluate(()=>S.tasks.length);if(cnt!==1)bad.push('確かめだけで消えた');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
