// AI の画面（ai）をつながらない・キー無しの状態で、文字「大」「特大」・360px で撮って測る（hz-l-ai-screen）：
// ①.mitem の行が 44px 未満・横にはみ出す ②.aibadge が言葉の途中で割れる・はみ出す ③説明（.ds）が切れる
// usage: node hozen/tools/aiscreenxlcheck.js [--shot dir]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
const shot=process.argv.includes('--shot')?process.argv[process.argv.indexOf('--shot')+1]:null;
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('ai')},fs);await p.waitForTimeout(400);
 if(shot)await p.screenshot({path:shot+'/ai-'+w+'-'+(fs||'n')+'.png',fullPage:true});
 const r=await p.evaluate(()=>{const out=[];const W=document.documentElement.clientWidth;
  if(document.documentElement.scrollWidth>W+1)out.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
  const items=[...document.querySelectorAll('#app .mitem')];if(!items.length)out.push('.mitem が無い');
  for(const e of items){const bx=e.getBoundingClientRect();const nm=(e.querySelector('div')||e).textContent.trim().slice(0,16);
   if(bx.height<44)out.push('行が44px未満「'+nm+'」'+Math.round(bx.height));
   if(bx.right>W+1||bx.left<-1)out.push('行がはみ出す「'+nm+'」');
   for(const d of e.querySelectorAll('.aibadge')){const q=d.getBoundingClientRect();if(q.right>W+1)out.push('札がはみ出す「'+d.textContent.trim()+'」');
    const lh=parseFloat(getComputedStyle(d).lineHeight)||0;const rs=d.getClientRects();
    // 札の中の言葉の途中の割れ：行ごとの文字の並びを見る
    const n=[...d.childNodes].find(x=>x.nodeType===3);if(n){const t=n.textContent;let prevTop=null;for(let i=0;i<t.length;i++){if(!t[i].trim()){prevTop=null;continue}const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+1);const q2=rg.getClientRects()[0];if(!q2)continue;const top=Math.round(q2.top);
      if(prevTop!==null&&top>prevTop+2){const a=t[i-1];if(!'・）)、（( '.includes(a)&&!'（('.includes(t[i]))out.push('札が言葉の途中で割れる「'+t.slice(0,i)+'/'+t.slice(i)+'」')}prevTop=top}}}
   for(const d of e.querySelectorAll('.ds')){const q=d.getBoundingClientRect();if(q.right>W+1||d.scrollWidth>d.clientWidth+1)out.push('説明が切れる「'+d.textContent.trim().slice(0,12)+'」')}}
  return out});
 for(const x of r)errs.push(tag+'・'+x);await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
