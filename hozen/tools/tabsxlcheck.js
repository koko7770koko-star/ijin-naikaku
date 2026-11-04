// 文字「大」「特大」・幅 360px／390px で、全画面の上のタブ（.seg.tabs）が右端で切れない（どのボタンも画面幅とタブの枠の中）・
// ボタンは 44px 以上・ページは横にはみ出さない。標準の文字の見た目は変えない（直しは html[data-fs=l|xl] の時だけ）。記録は変えない。（hz-tabs-xl）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];const std={};
 for(const [w,fs] of [[390,''],[360,'l'],[360,'xl'],[390,'xl']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);await p.waitForTimeout(200);
  const vs=await p.evaluate(()=>Object.keys(VIEWS).filter(v=>!['printDoc','qr'].includes(v)));let n=0;
  for(const v of vs){await p.evaluate(v=>{try{go(v,{day:TODAY})}catch(e){}},v);await p.waitForTimeout(150);
   const r=await p.evaluate(()=>{const W=innerWidth;/* getBoundingClientRect は拡大の後の画面の px */
    return {sw:document.documentElement.scrollWidth,bars:[...document.querySelectorAll('#app .seg.tabs:not(.istep)')].filter(e=>e.offsetParent).map(e=>{const br=e.getBoundingClientRect();
     return {txt:[...e.children].map(x=>x.textContent.trim()).join('/'),over:e.scrollWidth>e.clientWidth+1,cut:[...e.children].filter(x=>{const r=x.getBoundingClientRect();return r.right>Math.min(W,br.right)+1||r.left<br.left-1}).map(x=>x.textContent.trim()),
      lowH:[...e.children].filter(x=>x.getBoundingClientRect().height<44-.5).map(x=>x.textContent.trim()),ws:[...e.children].map(x=>Math.round(x.getBoundingClientRect().width))}})}});
   if(r.sw>w+2)bad.push(`${w}px ${fs||'標準'} ${v}：ページがはみ出す ${r.sw}`);
   for(const t of r.bars){n++;const k=v+':'+t.txt;
    if(t.over||t.cut.length)bad.push(`${w}px ${fs||'標準'} ${v}：タブが切れる「${t.cut.join('・')||t.txt}」`);
    if(t.lowH.length)bad.push(`${w}px ${fs||'標準'} ${v}：タブが 44px 未満「${t.lowH.join('・')}」`);
    if(!fs)std[k]=t.ws.join(',');}
  }
  if(!n)bad.push(`${w}px ${fs||'標準'}：タブが1つも無い`);await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
