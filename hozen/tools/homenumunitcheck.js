// ホームのお知らせ：数字と単位（台・件・面）が行で別れない（Range の top が同じ）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const host=document.createElement('div');host.id='nuT';host.style.cssText='width:200px';
  host.innerHTML='<div class="al warn" style="width:200px">'+alNu(esc('今月まだ数字を入れていない非常用発電機 1台：G-1'))+'</div>';document.body.appendChild(host);
  const u=host.querySelector('.nu');if(!u)return {none:1};const rg=document.createRange();rg.selectNodeContents(u);const t=[...rg.getClientRects()].map(x=>Math.round(x.top));return {n:new Set(t).size,txt:u.textContent}});
 if(r.none)bad.push('数字と単位の塊が無い');else if(r.n!==1||r.txt!=='1台')bad.push('数字と単位が割れる '+JSON.stringify(r));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
