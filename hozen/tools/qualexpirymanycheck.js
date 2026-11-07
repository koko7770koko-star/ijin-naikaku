// 人員・資格の期限：200 人・資格 1000 件（期限切れ・60 日以内・先のものを混ぜる）で、人員・資格の画面・ホーム（「資格の期限 ○人」）・シフト表（名前の ⚠）が
// それぞれ 1 秒以内に出て、人数が手で数えた値と同じで、期限の近い人が上に並ぶか。390px（hz-v-qual-expiry-many）。保存の形は変えない。
// usage: node hozen/tools/qualexpirymanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const T=TODAY,Q=['第三種電気主任技術者','第二種電気工事士','消防設備士（甲種第4類）','高圧ケーブル絶縁診断技術者','低圧電気取扱特別教育修了'];S.qualList=[...new Set([...S.qualList,...Q])];
  S.settings.staff=[...Array(200)].map((_,i)=>'職員'+(i+1));S.quals={};S.qualExp={};let warn=0,ng=0;
  S.settings.staff.forEach((n,i)=>{S.quals[n]=Q.slice();const ex={};Q.forEach((q,k)=>{const off=i%4===0?400+k:i%4===1?(k===0?-10-(i%30):400):i%4===2?(k===2?30+(i%29):400):61+k+(i%9);ex[q]=addD(T,off)});S.qualExp[n]=ex;
   const lefts=Object.values(ex).map(d=>diffD(d,T)).filter(x=>x<=60);if(lefts.length)warn++;if(lefts.some(x=>x<0))ng++});
  save();return {warn,ng,first:S.settings.staff.map(n=>[n,Math.min(...Object.values(S.qualExp[n]).map(d=>diffD(d,T)))]).sort((a,b)=>a[1]-b[1])[0]}});
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 let s=Date.now();await p.evaluate(()=>go('staff'));await raf();tm.staff=Date.now()-s;
 const top=await p.evaluate(()=>{const it=document.querySelector('#app .item .ti');return it?it.textContent:''});if(!top.startsWith(exp.first[0]))bad.push('期限の近い人が上でない '+top.slice(0,20)+'（'+exp.first[0]+' '+exp.first[1]+'日）');
 const pills=await p.evaluate(()=>[...document.querySelectorAll('#app .item .ti .pill')].length);if(pills!==exp.warn)bad.push('人員の画面の印 '+pills+'（手で '+exp.warn+'）');
 s=Date.now();await p.evaluate(()=>go('home'));await raf();tm.home=Date.now()-s;
 const al=await p.evaluate(()=>(document.querySelector('#app').innerText.match(/資格の期限 (\d+)人/)||[])[1]);if(+al!==exp.warn)bad.push('ホームの資格の期限 '+al+'人（手で '+exp.warn+'）');
 s=Date.now();await p.click('#nav button[data-v="shift"]');await p.waitForSelector('#shTable td.cell');await raf();tm.shift=Date.now()-s;
 const qw=await p.evaluate(()=>document.querySelectorAll('#shTable .qw').length);const shown=await p.evaluate(()=>[...document.querySelectorAll('#shTable button.qn')].map(x=>x.dataset.qn));
 const wantQw=await p.evaluate(n=>n.filter(x=>qualExpWarn(x).length).length,shown);if(qw!==wantQw)bad.push('シフト表の ⚠ '+qw+'（手で '+wantQw+'）');
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 await p.click('#nav button[data-v="home"]');await raf();if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log(JSON.stringify(tm)+'・期限 '+exp.warn+'人（切れ '+exp.ng+'人）');console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
