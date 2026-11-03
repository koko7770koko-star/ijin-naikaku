// 日報：点検の項目が多くても 320〜360px でページが横にはみ出さない（表だけが横に流れる）・印刷は変わらない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const W of [320,360,390]){const c=await b.newContext({viewport:{width:W,height:700}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{go('dailyRep',{day:TODAY})});await p.waitForTimeout(300);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>W+1)bad.push(W+'px でページが横にはみ出す '+sw);
 bad.push(...errs);await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
