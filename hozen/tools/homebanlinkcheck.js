// ホームの盤の点検の帯：「⚡ 今月の盤の点検」「あと○面（全○面）」「次の盤へ ›」がそれぞれ行の途中で割れない（Range の top が1つ）。文字「標準」「大」「特大」・390px と 360px で横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const w of [390,360]){const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const fs of ['','l','xl']){
  const r=await p.evaluate(fs=>{if(fs)document.documentElement.setAttribute('data-fs',fs);else document.documentElement.removeAttribute('data-fs');
   const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1'),mk('p2','盤2','盤','f1'),mk('p3','盤3','盤','f1')];
   S.banChk={};S.banChk[TODAY.slice(0,7)]={p1:['済','済','済']};go('home');
   const e=document.querySelector('.homeban');if(!e)return {none:1};
   const parts=[...e.querySelectorAll('.hbk')].map(u=>{const rg=document.createRange();rg.selectNodeContents(u);return {t:u.textContent,n:new Set([...rg.getClientRects()].map(x=>Math.round(x.top))).size}});
   const br=e.getBoundingClientRect();return {parts,sw:document.documentElement.scrollWidth,right:br.right,vw:innerWidth}},fs);
  const tag=w+'px 文字'+(fs||'標準')+'：';
  if(r.none){bad.push(tag+'盤の帯が出ない');continue}
  if(r.parts.length!==3)bad.push(tag+'塊が3つでない '+JSON.stringify(r.parts));
  if(!fs)r.parts.forEach(x=>{if(x.n!==1)bad.push(tag+'「'+x.t+'」が割れる')});
  if(r.sw>w+2||r.right>w+1)bad.push(tag+'はみ出す '+JSON.stringify({sw:r.sw,right:r.right}));
 }
 bad.push(...errs);await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
