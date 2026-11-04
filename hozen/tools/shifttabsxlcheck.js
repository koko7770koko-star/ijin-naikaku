// 夜勤シフト表の上のタブ（シフト表・予定変更・メンバー・提出用・設定）：文字「大」「特大」・360px と標準 390px で、文字が切れない（はみ出さない）・押せる大きさ（hz-xl-review-6）。
// usage: node hozen/tools/shifttabsxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
  await p.evaluate(()=>go('shift'));await p.waitForTimeout(300);
  const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
  const r=await p.evaluate(()=>{const out=[];const L=[...document.querySelectorAll('#shiftApp .tabs button')].filter(x=>x.offsetParent);
   for(const x of L){const t=x.textContent.trim();const bx=x.getBoundingClientRect();
    if(x.scrollWidth>x.clientWidth+1)out.push('「'+t+'」の文字が切れる（'+x.scrollWidth+'>'+x.clientWidth+'）');
    if(bx.right>innerWidth+0.5||bx.left<-0.5)out.push('「'+t+'」が画面の外へ');
    if(document.documentElement.dataset.fs&&bx.height<44)out.push('「'+t+'」の高さ '+Math.round(bx.height)+'px（44 未満）')}
   return {n:L.length,out}});
  if(r.n!==5)errs.push(tag+'：タブが '+r.n+' 個（5 のはず）');
  for(const x of r.out)errs.push(tag+'：'+x);
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
