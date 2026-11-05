// 文字「大」「特大」・390/360px：カレンダーの今日の日の「今日」の札と祝の札が2行に割れない（hz-l-review-5）
// usage: node hozen/tools/caltodaylcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const [fsc,W] of [['l',390],['xl',390],['xl',360]]){
  const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();
  p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof MIRROR_READY!=='undefined'&&MIRROR_READY,null,{timeout:15000});
  await p.evaluate(fsc=>{S.settings.fscale=fsc;applyFScale();go('month')},fsc);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const o=[];const e=document.querySelector('.cal .tdl');if(!e)return['今日の札が無い'];
   const h=e.getBoundingClientRect().height,lh=parseFloat(getComputedStyle(e).fontSize)*2.2;if(h>lh)o.push('「今日」の札が割れる '+Math.round(h)+'px');
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('横にはみ出す');return o});
  r.forEach(x=>bad.push(`${fsc}・${W}px：${x}`));await ctx.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
