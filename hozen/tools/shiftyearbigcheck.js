// 夜勤シフト表：職員 30 人（夜勤 24・日勤 6）に 1 年分の予定変更（毎日いくつか）を入れ、文字「特大」でも
// ①月の切り替えが 0.5 秒以内 ②印刷の用紙（cal・p11）が A4 で 1 ページに収まり、名前の見出しが切れず、表が枠からはみ出さない
// ③画面が横にはみ出さない ④kinmuhyo_v1 の形が変わらない（hz-v-staff-shift-year）。名前は「職員1」の形だけ。usage: node hozen/tools/shiftyearbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.settings.fscale='xl';save();applyFScale()});
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 await p.click('#shTable td.cell');await p.waitForTimeout(200);await p.click('#popOpts button:not(.cur)');await p.waitForTimeout(300);
 const ap=await p.$('button:has-text("この内容で変更")');if(ap){await ap.click();await p.waitForTimeout(300)}
 const k0=await p.evaluate(()=>{const g=SHIFT.get();return {k:Object.keys(g).sort().join(','),c:g.changes[0]}});
 if(!k0.c){console.log('最初の変更ができない');process.exit(1)}
 await p.evaluate(([c0,PD])=>{const g=SHIFT.get();g.members=[...Array(30)].map((_,i)=>({name:'職員'+(i+1),type:i<24?'夜勤':'日勤'}));
  const V=['有給','希望休','A日夜勤','B日夜勤','日勤'];const ch=[];const isNum=typeof c0.date==='number';
  const fmt=off=>{if(isNum)return c0.date+off;const d=new Date(c0.date+'T00:00:00');d.setDate(d.getDate()+off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  for(let day=-180;day<185;day++){for(let j=0;j<PD;j++){const name='職員'+(1+(day*7+j*3+400)%30);const date=fmt(day);if(!ch.some(x=>x.name===name&&x.date===date))ch.push({...c0,name,date,val:V[(day+j+400)%5]})}}
  g.changes=ch;SHIFT.set(g)},[k0.c,+process.env.PERDAY||3]);
 await p.waitForTimeout(500);await p.click('#nav button[data-v="home"]');await p.click('#nav button[data-v="shift"]');await p.waitForSelector('#shTable td.cell');
 ok(await p.evaluate(()=>document.documentElement.dataset.fs)==='xl','文字の大きさ「特大」が残らない（確かめの作りの誤り）');
 const nCh=await p.evaluate(()=>SHIFT.get().changes.length);
 const turns=[];for(const k of [-1,-1,-1,-1,1,1,1,1,1,1]){const s=Date.now();await p.evaluate(k=>moveMonth(k),k);await p.waitForTimeout(20);turns.push(Date.now()-s-20)}
 ok(Math.max(...turns)<=500,'月の切り替えが遅い '+Math.max(...turns)+'ms');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth)<=392,'画面が横にはみ出す');
 const after=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('kinmuhyo_v1'));return {k:Object.keys(o).sort().join(','),n:o.changes.length,m:o.members.length}});
 ok(after.k===k0.k,'kinmuhyo_v1 の形が変わった');ok(after.n>=nCh&&after.m===30,'保存が崩れた '+JSON.stringify(after));
 await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(800);
 for(const t of ['cal','p11']){
  await p.selectOption('#subType',t);await p.waitForTimeout(300);
  const ms=await p.evaluate(()=>[...document.querySelectorAll('#subMonth option')].map(o=>o.value));
  for(const m of [ms.find(m=>(t==='cal'?/-(01|03|05|07|08|10|12)$/:/-(01|02|04|06|08|09|11)$/).test(m))||ms[0]]){
   await p.selectOption('#subMonth',m);await p.waitForTimeout(300);
   await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.waitForTimeout(150);
   const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});
   const pages=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;ok(pages===1,`${t} ${m}：30人・特大で ${pages} ページになる`);
   const r=await p.evaluate(()=>{const sh=document.querySelector('#subSheets .sheet');if(!sh)return null;
    const ths=[...sh.querySelectorAll('thead th')];const cut=ths.filter(h=>h.scrollHeight>h.clientHeight+1||h.scrollWidth>h.clientWidth+1).length;
    const sb=sh.getBoundingClientRect(),tb=sh.querySelector('table').getBoundingClientRect();return {cut,inside:tb.right<=sb.right+1&&tb.bottom<=sb.bottom+1,rows:sh.querySelectorAll('tbody tr').length}});
   await p.emulateMedia({media:'screen'});await p.evaluate(()=>{try{renderSub()}catch(e){}});
   ok(!!r,t+'：用紙が出ない');if(r){ok(r.cut===0,`${t}：切れた見出し ${r.cut}`);ok(r.inside,t+'：表が枠からはみ出す');ok(r.rows>=28,`${t}：日の行が ${r.rows}`)}}}
 console.log('変更 '+nCh+'件・切り替え最大 '+Math.max(...turns)+'ms');
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
