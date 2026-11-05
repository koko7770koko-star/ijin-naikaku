// メニュー（menu）の札の題と、AI支援（ai）の一覧の題と、測定のひな形（mtpl）の題（hz-xl-review-10）：文字「大」「特大」・360px で言葉の途中で割れない（「カレンダ/ー」「非常用発電/機」「読み/取り」のような割れが無い）。
// 折れてよいのは「・」「）」「、」の後、「（」の前、<wbr> の所だけ。標準・390px ははみ出さないことだけ見る。hz-xl-review-9
// usage: node hozen/tools/menuaixlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 for(const v of ['menu','ai','mtpl']){
  await p.evaluate(([f,v])=>{S.settings.fscale=f;save();applyFScale();go(v)},[fs,v]);await p.waitForTimeout(300);
  const r=await p.evaluate(([v,strict])=>{const out=[];const OK_AFTER='・）)、',OK_BEFORE='（(・';
   // 題の文字のノード（.mtile .mt の中、.mitem の div の .aibadge より前）
   const titles=v==='menu'?[...document.querySelectorAll('.mtile .mt')].map(e=>({e,nodes:[...e.childNodes].filter(n=>n.nodeType===3)})):[...document.querySelectorAll(v==='ai'?'.mitem>div':'.mtti')].map(e=>{const nodes=[];for(const n of e.childNodes){if(n.nodeType===1&&n.tagName!=='WBR')break;if(n.nodeType===3)nodes.push(n)}return {e,nodes}});
   if(!titles.length)out.push(v+'：題が見つからない');
   for(const {e,nodes} of titles){if(!e.offsetParent)continue;const bx=e.getBoundingClientRect();if(bx.right>document.documentElement.clientWidth+1)out.push(v+'：「'+e.textContent.trim().slice(0,20)+'」がはみ出す');
    if(!strict)continue;
    for(const n of nodes){const t=n.textContent;let prev=null;for(let i=0;i<t.length;i++){if(!t[i].trim()){prev=null;continue}const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);const q=rg.getClientRects()[0];if(!q)continue;const top=Math.round(q.top);
      if(prev&&top>prev.top+2){const a=t[i-1],c=t[i];if(!OK_AFTER.includes(a)&&!OK_BEFORE.includes(c))out.push(v+'：「'+nodes.map(x=>x.textContent).join('').trim()+'」が「'+t.slice(0,i)+'/'+t.slice(i)+'」と割れる')}
      prev={top}}}}
   return out},[v,!!fs]);
  for(const x of r)errs.push(tag+'・'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
