// 年間計画を 390px・360px（文字 標準・大・特大）で開いたとき、今月の列が見えていて、左の項目名（sticky）に隠れない（hz-v-annual-now-scroll）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const w of [390,360])for(const fs of ['','l','xl'])for(const mon of ['2026-04-10','2026-11-07','2027-03-20']){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.addInitScript(d=>{const R=Date,t=new R(d+'T09:00:00').getTime();Date=class extends R{constructor(...a){super(...(a.length?a:[t]))}static now(){return t}}},mon);
  await p.addInitScript(v=>{localStorage.clear();localStorage.setItem('hospElecSched_v1',v)},JSON.stringify({settings:{name:'確認'},items:[{id:'it1',name:'受変電設備 月次点検（長い名前の確認用）',cat:'その他',cycle:'毎月'},{id:'it2',name:'非常用発電機 無負荷運転',cat:'その他',cycle:'毎月'}],marks:{}}));
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
  await p.evaluate(fs=>{if(fs)document.documentElement.dataset.fs=fs;V.fy=fyOf(now.getFullYear(),now.getMonth()+1);go('year')},fs);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const w=document.querySelector('.tbw'),c=w&&w.querySelector('th.cur');if(!w||!c)return {none:1};
   const wr=w.getBoundingClientRect(),cr=c.getBoundingClientRect();const st=[...w.querySelectorAll('tr:first-child th')].find(x=>getComputedStyle(x).position==='sticky');const sr=st?st.getBoundingClientRect():{right:wr.left};
   return {cl:Math.round(cr.left),cr:Math.round(cr.right),wl:Math.round(wr.left),wr:Math.round(wr.right),sr:Math.round(sr.right),sl:w.scrollLeft,txt:c.textContent.trim()}});
  const tag=`${w}px ${fs||'標準'} ${mon}`;
  if(r.none)bad.push(tag+'：今月の列（th.cur）が無い');
  else{if(r.cl<r.sr-1)bad.push(`${tag}：今月の列（${r.txt}）が左の項目名に隠れる（列 ${r.cl}〜${r.cr}、項目名の右 ${r.sr}）`);if(r.cr>r.wr+1)bad.push(`${tag}：今月の列（${r.txt}）が右にはみ出して見えない（列 ${r.cl}〜${r.cr}、枠の右 ${r.wr}）`);}
  console.log(tag,JSON.stringify(r));await c.close();}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
