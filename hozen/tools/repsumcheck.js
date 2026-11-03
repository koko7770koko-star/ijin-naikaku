// 月報の先頭に「今月の要約」（点検の済み件数・異常の件数・発電機）が1段で出る。保存の形は変えない
// usage: node hozen/tools/repsumcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const keys0=await p.evaluate(()=>Object.keys(S).sort().join());
 await p.evaluate(()=>{V.rmode='m';go('report')});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const t=document.querySelector('.rsum');return {has:!!t,txt:t?t.innerText:'',first:!!t&&t.compareDocumentPosition(document.querySelector('.rep .sec'))&4,w:document.documentElement.scrollWidth}});
 if(!r.has)errs.push('要約が出ない');else{if(!/今月の要約/.test(r.txt)||!/日常点検/.test(r.txt)||!/異常・指摘/.test(r.txt))errs.push('要約の中身が足りない '+r.txt);if(!r.first)errs.push('要約が「1. 実施概要」より下にある')}
 if(r.w>392)errs.push('横にはみ出す '+r.w);
 await p.evaluate(()=>{const e={id:'g1',kind:'発電機',name:'G1',status:'稼働'};(S.equipment=S.equipment||[]).push(e);go('report')});await p.waitForTimeout(300);
 if(!await p.evaluate(()=>/発電機の運転点検/.test(document.querySelector('.rsum').innerText)))errs.push('発電機の行が出ない');
 await p.emulateMedia({media:'print'});await p.setViewportSize({width:794,height:1123});
 if(await p.evaluate(()=>{const t=document.querySelector('.rsum');return !t||t.getBoundingClientRect().right>innerWidth+1}))errs.push('印刷で要約が収まらない');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
