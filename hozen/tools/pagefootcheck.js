// 印刷の各ページの下：@page の余白枠に「施設名　画面名　ページ／全体」（counter(page)/counter(pages)）が入る／シフト表では入れない／
// 施設名が無くても壊れない／引用符を含む施設名でも CSS が壊れない。画面の見た目・保存の形は変えない。
// usage: node hozen/tools/pagefootcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const css=()=>p.evaluate(()=>document.getElementById('pageStyle').textContent);
 await p.evaluate(()=>{S.settings.name='○○総合病院';save();go('report')});await p.waitForTimeout(300);
 let t=await css();if(!t.includes('counter(page)')||!t.includes('counter(pages)')||!t.includes('○○総合病院')||!t.includes('月報・年報'))bad.push('月報の余白枠 '+t);if(!t.includes('size:A4 portrait'))bad.push('縦のまま');
 await p.evaluate(()=>go('year'));await p.waitForTimeout(300);t=await css();if(!t.includes('size:A4 landscape')||!t.includes('counter(page)'))bad.push('年間計画（横）'+t);
 await p.evaluate(()=>{S.settings.name='';save();go('report')});await p.waitForTimeout(300);t=await css();if(!t.includes('counter(page)')||t.includes('undefined'))bad.push('施設名なし '+t);
 await p.evaluate(()=>{S.settings.name='危険"名前\\\n';save();go('report')});await p.waitForTimeout(300);t=await css();
 const ok=await p.evaluate(()=>{const st=document.getElementById('pageStyle');return st.sheet&&st.sheet.cssRules.length>0});if(!ok)bad.push('引用符入りで CSS が読めない');
 const n=(t.match(/"/g)||[]).length;if(n%2)bad.push('引用符の数が合わない '+n);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
