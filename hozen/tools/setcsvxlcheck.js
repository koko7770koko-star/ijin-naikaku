// 設定（set）の CSV のボタン：文字「大」「特大」・360px で言葉の途中（「異常案/件」「修正履/歴」「設備台/帳」）で割れない・はみ出さない・高さ 44 以上。標準 390px も同じ。
// usage: node hozen/tools/setcsvxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const WORDS=['異常案件','修正履歴','設備台帳','修理履歴','予定','実績','日常点検'];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('set')},fs);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(x=>x.offsetParent&&/^CSV：/.test(x.textContent.trim())).map(x=>{
   const tn=[...x.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());const s=tn.textContent;const tops=[];
   for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(tn,i);rg.setEnd(tn,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);tops.push(q?Math.round(q.top):null)}
   const lines=[];let cur='',lt=null;for(let i=0;i<s.length;i++){if(tops[i]!==null&&lt!==null&&Math.abs(tops[i]-lt)>3){lines.push(cur);cur=''}cur+=s[i];if(tops[i]!==null)lt=tops[i]}lines.push(cur);
   const bx=x.getBoundingClientRect();return {t:s.trim(),lines,h:bx.height,right:bx.right}}));
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 if(r.length<5)errs.push(tag+'：CSV のボタンが足りない（'+r.length+'）');
 for(const x of r){for(let i=0;i+1<x.lines.length;i++){const a=x.lines[i].trim(),bb=x.lines[i+1].trim();for(const wd of WORDS)for(let k=1;k<wd.length;k++)if(a.endsWith(wd.slice(0,k))&&bb.startsWith(wd.slice(k)))errs.push(tag+'：「'+x.t+'」が「'+wd.slice(0,k)+'/'+wd.slice(k)+'」と割れる')}
  if(x.h<44)errs.push(tag+'：「'+x.t+'」の高さ '+x.h);if(x.right>w+0.5)errs.push(tag+'：「'+x.t+'」がはみ出す')}
 await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
