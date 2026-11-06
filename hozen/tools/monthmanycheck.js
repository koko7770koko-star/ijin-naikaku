// カレンダー：1日に予定 12 件・件名が長いとき、390px・360px（文字 標準・特大）で月のマスが伸びすぎず、その日の一覧に 12 件が出てボタンが重ならず、横にはみ出さない（hz-v-day-many）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const w of [390,360])for(const fs of ['','xl']){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
  await p.evaluate(fs=>{if(fs)document.documentElement.dataset.fs=fs;for(let i=0;i<12;i++)S.tasks.push({id:'mm'+i,date:TODAY,time:String(8+i).padStart(2,'0')+':00',kind:'',cat:'',title:'受変電設備 年次点検（停電作業・絶縁抵抗測定・保護継電器試験）'+(i+1),place:'Ａ棟 地下1階 第1電気室 高圧受電盤',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});go('month')},fs);await p.waitForTimeout(400);
  const tag=`${w}px ${fs||'標準'}`;
  const m=await p.evaluate(()=>{const cells=[...document.querySelectorAll('#app td, #app .cal > *, #app [class*=cal] [onclick]')].filter(e=>e.textContent.trim()&&e.getBoundingClientRect().height>0);const hs=cells.map(e=>e.getBoundingClientRect().height).sort((a,b)=>b-a);return {max:Math.round(hs[0]||0),med:Math.round(hs[Math.floor(hs.length/2)]||0),sw:document.documentElement.scrollWidth}});
  if(m.sw>w+2)bad.push(tag+' 月：横にはみ出す '+m.sw);
  if(m.max>Math.max(220,m.med*4))bad.push(tag+` 月：12 件の日のマスが伸びすぎる（${m.max}px、ふつう ${m.med}px）`);
  const d=await p.evaluate(()=>{const sw=document.documentElement.scrollWidth;const bs=[...document.querySelectorAll('#app button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});let ov=0,ex='';
   for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i].getBoundingClientRect(),q=bs[j].getBoundingClientRect();const x=Math.min(a.right,q.right)-Math.max(a.left,q.left),y=Math.min(a.bottom,q.bottom)-Math.max(a.top,q.top);if(x>2&&y>2&&!bs[i].contains(bs[j])&&!bs[j].contains(bs[i])){ov++;if(!ex)ex=bs[i].textContent.trim().slice(0,12)+'／'+bs[j].textContent.trim().slice(0,12)}}
   return {sw,ov,ex,n:document.body.innerText.split('受変電設備 年次点検').length-1}});
  if(d.sw>w+2)bad.push(tag+' 一覧：横にはみ出す '+d.sw);if(d.n<12)bad.push(tag+' 一覧：その日の予定 12 件が全部出ない（'+d.n+'）');if(d.ov)bad.push(tag+` 一覧：ボタンが重なる ${d.ov} 組（${d.ex}）`);
  console.log(tag,JSON.stringify(m),JSON.stringify(d));await c.close();}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
