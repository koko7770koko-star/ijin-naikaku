// 幅360pxの小さいスマホ：全画面（昼・夜間）で、画面の外へはみ出す部品（表やスクロール枠の中を除く）が無い。特に診断の4つの切り替え（健全度・推奨・故障分析・測定記録）が全部収まり、各ボタンが44px以上。
// 画面の状態だけ（保存の形は変えない）。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const night of [false,true]){const ctx=await b.newContext({viewport:{width:360,height:740}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForTimeout(1200);if(night)await p.evaluate(()=>setNight('on'));
  const views=await p.evaluate(()=>Object.keys(VIEWS));
  for(const v of views){await p.evaluate(v=>{go(v,{day:TODAY})},v);await p.waitForTimeout(200);
   const r=await p.evaluate(()=>{const iw=innerWidth;const wide=[...document.querySelectorAll('#app *')].filter(e=>{const r=e.getBoundingClientRect();return (r.right>iw+1||r.left<-1)&&r.width>0&&!e.closest('.tbw,.repscroll,table,.scroll,[style*="overflow"]')}).slice(0,3).map(e=>e.tagName+'.'+e.className+':'+Math.round(e.getBoundingClientRect().right));return {sw:document.documentElement.scrollWidth,iw,wide}});
   if(r.sw>r.iw+1||r.wide.length)bad.push((night?'夜間 ':'')+v+'：はみ出す sw='+r.sw+' '+r.wide.join('|'))}
  // 診断の切り替え
  await p.evaluate(()=>go('diag'));await p.waitForTimeout(250);
  const t=await p.evaluate(()=>[...document.querySelectorAll('#app .seg.tabs button')].map(e=>{const r=e.getBoundingClientRect();return {l:r.left,r:r.right,h:r.height,t:e.textContent}}));
  if(t.length!==4||t.some(x=>x.l<-0.5||x.r>360.5||x.h<44))bad.push((night?'夜間 ':'')+'診断の切り替えが収まらない '+JSON.stringify(t));
  errs.forEach(e=>bad.push(e));await ctx.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
