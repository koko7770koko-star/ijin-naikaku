// 年間計画：月のマスが 390px で 44x44px 以上・ページが横にはみ出さない（表だけ横に流れる）
// usage: node hozen/tools/yearcellcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const fy=fyNow();S.items=[{id:'i1',cat:'受変電',name:'高圧受電盤 年次点検',cycle:'年1回',who:'委託'}];S.marks[fy]=S.marks[fy]||{};S.marks[fy].i1=['','','','','','','','','','','',''];save();go('year')});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,sz:[...document.querySelectorAll('table.yr td.mk')].map(e=>{const r=e.getBoundingClientRect();return Math.min(r.width,r.height)}),cur:!!document.querySelector('table.yr th.now,table.yr .now,table.yr th[class*=cur]')||document.querySelectorAll('table.yr th').length>0}));
 if(!r.sz.length)errs.push('マスが無い');else if(Math.min(...r.sz)<43.5)errs.push('マスが小さい '+Math.min(...r.sz));
 if(r.sw>392)errs.push('横にはみ出す '+r.sw);
 const k0=await p.evaluate(()=>JSON.stringify(S.marks));await p.click('table.yr td.mk');await p.waitForTimeout(200);
 if(await p.evaluate(()=>JSON.stringify(S.marks))===k0)errs.push('タップで印が変わらない');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
