// 月報・日報を A4 の印刷表示にして、狭い列（No・分類・周期・状態・日付）が1字ずつ折り返さない・はみ出さないことを確かめる。
// usage: node hozen/tools/printcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:794,height:1123}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 const now=new Date(),ym=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'),fy=now.getMonth()+1>=4?now.getFullYear():now.getFullYear()-1;
 const long='非常用発電機 無負荷運転および負荷運転試験（消防法・保安規程に基づく定期点検）';const items=[],tasks=[],marks={};
 for(let i=0;i<12;i++){items.push({id:'it'+i,name:long+i,cat:'電気',cycle:'毎月',who:'委託'});marks['it'+i]=Array(12).fill('○');tasks.push({id:'t'+i,date:ym+'-'+String(1+i).padStart(2,'0'),title:long+i,status:'完了',type:'点検'})}
 await p.addInitScript(([k,v])=>{if(sessionStorage.getItem('x'))return;sessionStorage.setItem('x','1');localStorage.clear();localStorage.setItem(k,v)},['hospElecSched_v1',JSON.stringify({settings:{name:'確認'},items,tasks,marks:{[fy]:marks}})]);
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);await p.emulateMedia({media:'print'});
 for(const [v,ex] of [['report',{}],['dailyRep',{day:ym+'-05'}]]){
  await p.evaluate(([v,ex])=>{const d=new Date();V.ry=d.getFullYear();V.rm=d.getMonth()+1;go(v,ex)},[v,ex]);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const bad=[];document.querySelectorAll('.rep th,.rep td.c,.rep td.cat').forEach(e=>{const t=(e.textContent||'').trim();if(t.length>=2&&t.length<=5&&!/\s/.test(t)&&e.childElementCount===0){const rg=document.createRange();rg.selectNodeContents(e);const tops=new Set([...rg.getClientRects()].map(x=>Math.round(x.top)));if(tops.size>1)bad.push(t)}});
   const W=document.documentElement.clientWidth;return {bad:[...new Set(bad)].slice(0,6),over:document.documentElement.scrollWidth>W}});
  if(r.bad.length)errs.push(v+' 狭い列が1字ずつ折り返す: '+r.bad.join(','));if(r.over)errs.push(v+' 横にはみ出す');
 }
 console.log(errs.length?'NG\n  '+errs.join('\n  '):'OK 印刷の見た目');await b.close();process.exit(errs.length?1:0)})();
