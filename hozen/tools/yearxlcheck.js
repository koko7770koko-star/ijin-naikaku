// 年間計画（year）：文字「特大」「大」・360px で、点検予定 20 件（長い名前・◯と●と延）が ①ページが横にはみ出さない
// ②絞り込み・ボタンが 44px 以上で文字が切れない ③月の見出し・「済/予」の数が途中で割れない ④◯●のマスが 44px 以上（hz-l-year）
// usage: node hozen/tools/yearxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  await p.evaluate(f=>{S.settings.fscale=f;const fy=V.fy;
   S.items=[...Array(20)].map((_,i)=>({id:'it'+i,name:i===1?'非常用発電機ABCDEFGHIJ-1234567890-XYZ 無負荷運転':'点検項目'+(i+1),cat:S.settings.cats[i%2]||'受変電',cycle:'毎月',base:fy+'-04-10',who:'自主'}));
   S.marks={[fy]:Object.fromEntries(S.items.map((it,i)=>[it.id,[...Array(12)].map((_,k)=>(k+i)%3===0?'済':(k+i)%3===1?'○':'延')]))};
   save();applyFScale();go('year')},fs);
  await p.waitForSelector('table.yr');
  const r=await p.evaluate(()=>{const o=[];
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
   document.querySelectorAll('#app .card button.btn, #app .card select').forEach(e=>{const q=e.getBoundingClientRect();if(!q.height)return;if(q.height<43.5)o.push('44px 未満 '+Math.round(q.height)+'px '+(e.textContent||'').slice(0,12));if(e.scrollWidth>e.clientWidth+1)o.push('文字が切れる '+(e.textContent||'').slice(0,12))});
   document.querySelectorAll('table.yr th .yrmh').forEach(e=>{if(e.getBoundingClientRect().height>80||e.scrollWidth>e.clientWidth+1)o.push('月の見出しが割れる/切れる '+e.textContent)});
   document.querySelectorAll('#yrFlt select').forEach(e=>{const sp=document.createElement('span');const cs=getComputedStyle(e);sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+cs.font;sp.textContent=e.options[e.selectedIndex].text;document.body.appendChild(sp);const w=sp.getBoundingClientRect().width;sp.remove();if(w+34>e.getBoundingClientRect().width)o.push('分類の選びの文字が切れる（文字 '+Math.round(w)+'px・箱 '+Math.round(e.getBoundingClientRect().width)+'px）')});
   document.querySelectorAll('table.yr td.mk').forEach(e=>{const q=e.getBoundingClientRect();if(q.width<43||q.height<43)o.push('マスが小さい '+Math.round(q.width)+'x'+Math.round(q.height))});
   document.querySelectorAll('table.yr tr:not(.cat) td:last-child').forEach(sl=>{const n=document.createRange();n.selectNodeContents(sl);if(n.getClientRects().length>1)o.push('済/予の数が割れる '+sl.textContent)});
   return [...new Set(o)]});
  r.forEach(x=>errs.push('360px・'+({xl:'特大',l:'大'})[fs]+'・'+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
