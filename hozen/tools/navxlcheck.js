// 下のボタン #nav：文字の大きさ 標準/大/特大 × 幅 360/390px で、5つのボタンの文字が1行に収まり、押せる高さ44px以上
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const w of [360,390])for(const fs of ['','l','xl']){
  const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('home')},fs);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>[...document.querySelectorAll('#nav button')].map(x=>{const tops=new Set();const walk=n=>{n.childNodes.forEach(m=>{if(m.nodeType===3&&m.textContent.trim()){const rg=document.createRange();rg.selectNodeContents(m);[...rg.getClientRects()].forEach(q=>{if(q.width>0)tops.add(Math.round(q.top))})}else if(m.nodeType===1)walk(m)})};walk(x);const q=x.getBoundingClientRect();return {t:x.innerText.replace(/\s+/g,' ').trim(),h:q.height,cut:x.scrollWidth>x.clientWidth+1,lines:tops.size}}));
  const t=w+'px/'+(fs||'標準');
  if(r.length!==5)bad.push(t+'：ボタンが5つでない');
  for(const x of r){if(x.lines>2)bad.push(t+'：「'+x.t+'」が割れる');if(x.cut)bad.push(t+'：「'+x.t+'」が切れる');if(x.h<44*(fs==='xl'?1:1)-0.5)bad.push(t+'：「'+x.t+'」の高さ '+Math.round(x.h))}
  if(errs.length)bad.push(errs.join(';'));await c.close()}
 await b.close();console.log(bad.length?bad.join('\n'):'NO ERRORS');process.exit(bad.length?1:0)})();
