// 月報・年報の「印刷／PDF」「共有」の上の説明文：390px（文字「標準」「大」）で幅いっぱいに出て 3 行以内・ボタンは 44px 以上・横はみ出しなし（hz-v-rep-hint）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const fs of ['m','l']){for(const tab of ['月報','年報']){
  await p.evaluate(fs=>{S.settings=S.settings||{};S.settings.fscale=fs;try{applyFscale&&applyFscale()}catch(e){}go('report')},fs);await p.waitForTimeout(300);
  if(tab==='年報'){const t=await p.$('text=年報');if(t){await t.click();await p.waitForTimeout(300)}}
  const r=await p.evaluate(()=>{const sp=[...document.querySelectorAll('#app span')].find(e=>/内容はすべて自動で入ります/.test(e.textContent));if(!sp)return null;const lh=parseFloat(getComputedStyle(sp).lineHeight)||parseFloat(getComputedStyle(sp).fontSize)*1.3;const row=sp.parentElement;const bs=[...row.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height);return{w:sp.getBoundingClientRect().width,rw:row.getBoundingClientRect().width,lines:Math.round(sp.getBoundingClientRect().height/lh),bs,sw:document.documentElement.scrollWidth}});
  const k=`文字${fs}・${tab}`;if(!r){bad.push(k+'：説明文が見つからない');continue}
  if(r.w<r.rw*0.9)bad.push(k+`：説明文が狭い（${Math.round(r.w)}/${Math.round(r.rw)}px）`);
  if(r.lines>3)bad.push(k+`：説明文が ${r.lines} 行に折れる`);
  if(r.bs.some(h=>h<44))bad.push(k+'：ボタンが 44px 未満');
  if(r.sw>392)bad.push(k+'：横にはみ出す');
 }}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
