// 日報の前日・翌日（‹ ›）の確認：日付の窓を開かずに移れる・月またぎ／年またぎ／うるう日で正しい・ボタン44px以上・記録は変わらない・390pxで横はみ出しなし。
// usage: node hozen/tools/dailyrepnavcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>JSON.stringify([S.daily,S.issues]));
 const cases=[['2026-03-01','prev','2026-02-28'],['2026-01-01','prev','2025-12-31'],['2028-03-01','prev','2028-02-29'],['2026-12-31','next','2027-01-01'],['2026-04-30','next','2026-05-01'],['2026-11-04','next','2026-11-05']];
 for(const [d,dir,exp] of cases){
  await p.evaluate(d=>go('dailyRep',{day:d}),d);await p.waitForTimeout(150);
  const r=await p.evaluate(dir=>{const bs=document.querySelectorAll('#app .mnav button');const e=bs[dir==='prev'?0:1];if(!e)return null;const h=e.getBoundingClientRect();e.click();return {w:h.width,h:h.height}},dir);
  if(!r){bad.push('‹ ›が無い '+d);continue}if(r.w<44||r.h<44)bad.push(`ボタンが44px未満 ${r.w}x${r.h}`);
  await p.waitForTimeout(100);const day=await p.evaluate(()=>V.day);if(day!==exp)bad.push(`${d} ${dir} → ${day}（${exp}のはず）`);}
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify([S.daily,S.issues]));if(after!==before)bad.push('移動で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
