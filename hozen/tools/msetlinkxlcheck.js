// 保全の設定（mset）の下の「測定のひな形・管理値」「人員・資格」のボタン：文字「大」「特大」・360px で文字が1行に収まる（「ひ/な形」「資/格」と割れない）。標準・390px も1行。
// usage: node hozen/tools/msetlinkxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('mset')},fs);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(x=>/go\('(mtpl|staff)'\)/.test(x.getAttribute('onclick')||'')&&x.offsetParent).map(x=>{const rg=document.createRange();rg.selectNodeContents(x);const tops=new Set([...rg.getClientRects()].filter(q=>q.width>0).map(q=>Math.round(q.top)));const bx=x.getBoundingClientRect();return {t:x.textContent.trim(),lines:tops.size,h:bx.height,right:bx.right}}));
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 if(r.length!==2)errs.push(tag+'：ボタンが2つ見つからない（'+r.length+'）');
 for(const x of r){if(x.lines>1)errs.push(tag+'：「'+x.t+'」が '+x.lines+' 行に割れる');if(x.h<44)errs.push(tag+'：「'+x.t+'」の高さ '+x.h+' < 44');if(x.right>w)errs.push(tag+'：「'+x.t+'」がはみ出す')}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
