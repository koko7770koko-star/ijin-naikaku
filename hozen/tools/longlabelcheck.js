// 長い点検項目名（切れ目の無い英数字の列）を登録しても、日常点検の入力が 320px で横にはみ出さない。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:320,height:700}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>go('day',{day:TODAY}));await p.waitForTimeout(400);
 const n=await p.evaluate(()=>{const L='VCB-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';let k=0;document.querySelectorAll('#app label.f').forEach(e=>{if(e.children.length===0){e.textContent=L;k++}});return k});
 if(!n)bad.push('項目名の欄が見つからない（確かめ直し）');
 await p.waitForTimeout(200);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>322)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
