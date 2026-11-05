// 入力の窓（作業指示書など）のチェックの行（.chkl）：文字「大」「特大」・360px で、長い説明（「重要作業（作業開始の前に…）」）が窓の右に切れない（はみ出さない）。標準・390px も。hz-xl-review-13
// usage: node hozen/tools/modalchklxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 for(const fn of ['editWork()','editIssue()','editEquip()']){
  await p.evaluate(([f,fn])=>{S.settings.fscale=f;save();applyFScale();try{closeModal(true)}catch(e){};eval(fn)},[fs,fn]);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const m=document.querySelector('#modal');if(!m)return ['窓が開かない'];return [...m.querySelectorAll('.chkl')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+1).map(e=>'「'+e.textContent.trim().slice(0,24)+'」が切れる '+e.scrollWidth+'>'+e.clientWidth)});
  if(fn==='editWork()'){const n=await p.evaluate(()=>!!document.querySelector('#modal #wk_imp'));if(!n)errs.push(tag+'・'+fn+'：重要作業の行が見つからない')}
  for(const x of r)errs.push(tag+'・'+fn+'：'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
