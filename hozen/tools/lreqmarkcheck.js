// 文字「大」「特大」：日常点検の必須の印 * が行の頭に1字だけ落ちない（hz-l-review）。
// usage: node hozen/tools/lreqmarkcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[390,'l'],[360,'l'],[360,'xl'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('day',{day:TODAY})},fs);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('.chk .l').forEach(l=>{if(!l.offsetParent)return;const sp=l.querySelector('span');if(!sp)return;const a=sp.getBoundingClientRect();const rg=document.createRange();rg.selectNodeContents(l);const rs=[...rg.getClientRects()];
  const prev=l.firstChild;const t=document.createRange();t.setStart(prev,Math.max(0,prev.textContent.length-1));t.setEnd(prev,prev.textContent.length);const q=t.getBoundingClientRect();if(a.top>q.bottom-2)o.push(l.textContent)});return {n:document.querySelectorAll('.chk .l span').length,o}});
 if(!r.n)errs.push(w+fs+'：必須の印が見つからない');
 for(const x of r.o)errs.push(w+'px・'+(fs||'標準')+'：「'+x+'」の * が1字だけ次の行に落ちる');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
