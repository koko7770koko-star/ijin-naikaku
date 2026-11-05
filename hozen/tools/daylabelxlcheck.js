// 日常点検の項目名：文字「特大」・360px で、項目名が細い列に押し込まれて 3 行に割れない（hz-xl-review-1）。項目名の幅が 200px 以上・2 行以内。
// usage: node hozen/tools/daylabelxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[390,'xl']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('day')},fs);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>[...document.querySelectorAll('#app .chk .l')].map(l=>{const bx=l.getBoundingClientRect(),lh=parseFloat(getComputedStyle(l).lineHeight)||parseFloat(getComputedStyle(l).fontSize)*1.4;return {t:l.textContent.trim(),w:bx.width,n:Math.round(bx.height/lh)}}));
  if(r.length<5)errs.push(w+'px：項目が足りない（'+r.length+'）');
  for(const x of r){if(x.w<200)errs.push(`${w}px・特大：「${x.t}」の列が細い（${Math.round(x.w)}px）`);if(x.n>2)errs.push(`${w}px・特大：「${x.t}」が ${x.n} 行に割れる`)}
  await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
