// 夜勤シフト表の「予定変更」「シフト表の勤務の選び窓」「月ごとの勤務時間の合計」：文字「特大」「大」・360px で、職員 8 人（夜勤・日勤・有給を混ぜた月）が
// ①ページが横にはみ出さない ②ボタン・選びが 44px 以上で文字が切れない ③合計の「24h／夜3・日5・有1」が途中で割れない ④窓の中がはみ出さない（hz-l-shift-swap）
// kinmuhyo_v1 の形は変えない。名前は「職員1」の形だけ。usage: node hozen/tools/shiftxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
const WAIT=()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const CHK=()=>{const o=[];const root=document.querySelector('#shiftApp')||document.body;
 if(document.documentElement.scrollWidth>innerWidth+1)o.push('ページが横にはみ出す '+document.documentElement.scrollWidth);
 root.querySelectorAll('button,select,input:not([type=checkbox]):not([type=radio])').forEach(e=>{if(!e.offsetParent||e.closest('table.sh thead'))return;const q=e.getBoundingClientRect();if(!q.height)return;const lb=(e.textContent||e.value||e.id||'').trim().slice(0,12);
  if((e.tagName==='BUTTON'||e.tagName==='SELECT')&&q.height<43.5)o.push('44px 未満 '+Math.round(q.height)+'px 「'+lb+'」');
  if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+1)o.push('ボタンの文字が切れる 「'+lb+'」');
  if(q.right>innerWidth+1&&!e.closest('.tblwrap,[style*="overflow-x"]'))o.push('画面の外へ 「'+lb+'」');
  if(e.tagName==='SELECT'){const sp=document.createElement('span');sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+getComputedStyle(e).font;sp.textContent=e.options[e.selectedIndex]?e.options[e.selectedIndex].text:'';document.body.appendChild(sp);const w=sp.getBoundingClientRect().width;sp.remove();if(w+34>q.width)o.push('選びの文字が切れる（'+Math.round(w)+'px・箱 '+Math.round(q.width)+'px）「'+sp.textContent.slice(0,12)+'」')}});
 root.querySelectorAll('#aggCard tfoot td, #aggCard tbody td:not(.dc)').forEach(td=>{const h=td.getBoundingClientRect().height;const sp=td.querySelector('span');if(sp&&sp.getClientRects().length>1)o.push('合計の「夜・日・有」が割れる '+sp.textContent)});
 return [...new Set(o)]};
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(WAIT);
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
  await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
  await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('kinmuhyo_v1')||'null');if(!o)return;
   o.members=[...Array(8)].map((_,i)=>({name:'職員'+(i+1),type:i<6?'夜勤':'日勤'}));
   const d=new Date();const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
   o.changes=[...Array(12)].map((_,i)=>({name:'職員'+(1+i%8),date:ym+'-'+String(1+i).padStart(2,'0'),val:['有給','A日夜勤','希望休','B日夜勤'][i%4]}));
   localStorage.setItem('kinmuhyo_v1',JSON.stringify(o))});
  await p.reload();await p.waitForFunction(WAIT);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
  const tag='360px・'+({xl:'特大',l:'大'})[fs]+'・';
  const pages=await p.evaluate(()=>[...document.querySelectorAll('#tabs button[data-p]')].map(x=>x.dataset.p));
  for(const pg of pages){await p.click('#tabs button[data-p="'+pg+'"]');await p.waitForTimeout(400);(await p.evaluate(CHK)).forEach(x=>errs.push(tag+'タブ '+pg+'・'+x))}
  await p.click('#tabs button[data-p="'+pages[0]+'"]');await p.waitForTimeout(300);
  const has=await p.evaluate(()=>!!document.querySelector('#shTable td.cell'));if(!has)errs.push(tag+'シフト表のマスが見つからない');
  if(has){await p.click('#shTable td.cell');await p.waitForTimeout(400);
   const r=await p.evaluate(()=>{const o=[];const box=document.querySelector('#pop .box');if(!box)return ['窓が出ない'];
    const bb=box.getBoundingClientRect();if(bb.right>innerWidth+1||bb.left<-1)o.push('窓が画面の外へ');
    box.querySelectorAll('button').forEach(e=>{if(!e.offsetParent)return;const q=e.getBoundingClientRect();if(q.height<43.5)o.push('窓のボタンが 44px 未満 '+Math.round(q.height)+'px 「'+e.textContent.trim().slice(0,10)+'」');if(e.scrollWidth>e.clientWidth+1)o.push('窓のボタンの文字が切れる 「'+e.textContent.trim().slice(0,10)+'」');if(q.right>bb.right+1)o.push('窓の外へ 「'+e.textContent.trim().slice(0,10)+'」')});return [...new Set(o)]});
   r.forEach(x=>errs.push(tag+x))}
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
