// 文字の大きさ「特大」（fscale xl）・幅 360px で全画面を開き、横にはみ出さないこと（設定の全タブも）を確かめる。
// usage: node hozen/tools/xlwidthcheck.js   （外部への通信はすべて止める）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const bad=[];
 for(const [W,fs] of [[360,'xl'],[360,'l'],[390,'xl']]){
  const ctx=await b.newContext({viewport:{width:W,height:780}});const p=await ctx.newPage();
  p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForTimeout(1800);
  await p.evaluate(fs=>setFScale(fs),fs);await p.waitForTimeout(200);
  const views=await p.evaluate(()=>Object.keys(VIEWS).filter(v=>v!=='equipDetail').concat(['shift']));
  const sw=()=>p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  for(const v of views){await p.evaluate(v=>{try{go(v)}catch(e){}},v);await p.waitForTimeout(250);
   const d=await sw();if(d>1)bad.push(`${W}px・${fs}：画面 ${v} が ${d}px 横にはみ出す`);
   if(v==='set'){const tabs=await p.evaluate(()=>[...document.querySelectorAll('.ptabs button')].length);
    for(let i=0;i<tabs;i++){await p.evaluate(i=>document.querySelectorAll('.ptabs button')[i].click(),i);await p.waitForTimeout(150);
     const d2=await sw();if(d2>1)bad.push(`${W}px・${fs}：設定のタブ ${i+1} で ${d2}px はみ出す`);}}}
  await ctx.close();}
 await b.close();console.log(bad.slice(0,20).join('\n')||'NO ERRORS');process.exit(bad.length?1:0);})();
