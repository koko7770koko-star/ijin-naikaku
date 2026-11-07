// シフト表：メンバー 30 人・予定変更 3 年分（約 4500 件）で、「⇄ ほかの人と入れ替える」（相手の一覧・確かめの窓・変更）、
// 「自動に戻す」（確かめの窓・変更）、月別の集計（12 か月）の切り替え、勤務表の CSV がそれぞれ 1 秒以内で、
// 入れ替え・戻しが正しく保存され（kinmuhyo_v1 の形は同じ）、CSV が画面の勤務と同じか。390px（hz-v-shift-swap-many）。
// usage: node hozen/tools/shiftswapmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 await p.click('#shTable td.cell');await p.waitForTimeout(200);await p.click('#popOpts button:not(.cur)');await p.waitForTimeout(300);
 const ap=await p.$('button:has-text("この内容で変更")');if(ap){await ap.click();await p.waitForTimeout(300)}
 const keys0=await p.evaluate(()=>{const g=SHIFT.get();return {k:Object.keys(g).sort().join(','),c:g.changes[0]}});if(!keys0.c){console.log('最初の変更ができない');process.exit(1)}
 await p.evaluate(c0=>{const g=SHIFT.get();g.members=[...Array(30)].map((_,i)=>({name:'職員'+(i+1),type:i<24?'夜勤':'日勤'}));const V=['有給','希望休','A日夜勤','B日夜勤','日勤'];const ch=[];
  const isNum=typeof c0.date==='number',base=isNum?c0.date:null;
  for(let k=0;k<4500;k++){const off=-900+Math.floor(k/5);const date=isNum?base+off:(()=>{const d=new Date(c0.date+'T00:00:00');d.setDate(d.getDate()+off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
   const name='職員'+(1+(k*7)%30);if(!ch.some(x=>x.name===name&&x.date===date))ch.push({...c0,name,date,val:V[k%5]})}
  g.changes=ch;SHIFT.set(g)},keys0.c);await p.waitForTimeout(500);
 await p.click('#nav button[data-v="home"]');await p.click('#nav button[data-v="shift"]');await p.waitForSelector('#shTable td.cell');
 const nCh=await p.evaluate(()=>SHIFT.get().changes.length);const tm={};let s;
 const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('kinmuhyo_v1')));
 // 1) 入れ替え：変更の無いマスで、入れ替えの相手がいる所
 const cells=await p.evaluate(()=>[...document.querySelectorAll('#shTable td.cell')].map((t,k)=>({k,chg:t.classList.contains('chg')})));
 let swapped=null;
 for(const x of cells.filter(x=>!x.chg).slice(0,80)){await p.evaluate(()=>document.getElementById('pop').classList.remove('on'));
  await p.evaluate(k=>document.querySelectorAll('#shTable td.cell')[k].click(),x.k);if(!await p.$('#swapBtn'))continue;
  s=Date.now();await p.click('#swapBtn');const o=await p.$('#popSwap [data-sw]');tm.swapList=Date.now()-s;if(!o)continue;
  const who=await p.evaluate(()=>{const t=document.getElementById('popTtl').textContent;return {me:t.split('　')[0]}});const sw=await o.getAttribute('data-sw');
  s=Date.now();await o.click();const ok=await p.waitForSelector('button:has-text("この内容で変更")',{timeout:5000}).catch(()=>null);tm.swapConfirm=Date.now()-s;
  if(!ok){bad.push('入れ替えの確かめが出ない');break}
  s=Date.now();await ok.click();await p.waitForTimeout(20);tm.swapApply=Date.now()-s-20;swapped={...who,other:'職員'+(+sw+1)};break}
 if(!swapped)bad.push('入れ替えの相手がいるマスが見つからない');
 await p.waitForTimeout(400);
 let g=await st();if(g.changes.length!==nCh+2&&swapped)bad.push('入れ替えで変更が 2 件増えない '+g.changes.length+'/'+(nCh+2));
 // 2) 自動に戻す：変更ありのマス
 const ck=await p.evaluate(()=>[...document.querySelectorAll('#shTable td.cell')].findIndex(t=>t.classList.contains('chg')));
 if(ck<0)bad.push('変更ありのマスが無い');else{
  await p.evaluate(k=>document.querySelectorAll('#shTable td.cell')[k].click(),ck);
  s=Date.now();await p.click('#popAuto');const ok=await p.waitForSelector('button:has-text("この内容で変更")',{timeout:5000}).catch(()=>null);tm.autoConfirm=Date.now()-s;
  if(!ok)bad.push('自動に戻すの確かめが出ない');else{s=Date.now();await ok.click();await p.waitForTimeout(20);tm.autoApply=Date.now()-s-20}
  await p.waitForTimeout(400);const g2=await st();if(g2.changes.length!==g.changes.length-1)bad.push('自動に戻すで変更が 1 件減らない '+g2.changes.length);g=g2}
 // 3) 月別の集計（12 か月）の切り替え
 for(const v of ['cal','p11']){s=Date.now();await p.selectOption('#aggType',v);await p.waitForTimeout(20);tm['agg_'+v]=Date.now()-s-20}
 const aggRows=await p.evaluate(()=>document.querySelectorAll('#aggCard tbody tr').length);if(aggRows!==12)bad.push('集計の月が '+aggRows);
 // 4) CSV
 s=Date.now();const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text()};return true};
   document.getElementById('shCsvBtn').click();for(let k=0;k<100&&!window.__out;k++)await new Promise(r=>setTimeout(r,10));return window.__out});tm.csv=Date.now()-s;
 if(!out)bad.push('CSV が書き出されない');else{const L=out.t.replace(/^﻿/,'').split('\r\n');const head=L[0].replace(/"/g,'').split(',');if(head.length!==32)bad.push('CSV の列 '+head.length);
  const scr=await p.evaluate(()=>[...document.querySelectorAll('#shTable tbody tr')].length);if(L.length-1!==scr)bad.push('CSV の行 '+(L.length-1)+'（画面 '+scr+'）');
  const scrRows=await p.evaluate(()=>[...document.querySelectorAll('#shTable tbody tr')].map(tr=>[...tr.querySelectorAll('td.cell')].map(t=>t.textContent.trim())));
  const SH={'A日夜勤':'A','B日夜勤':'B','公休':'休','希望休':'希望','連続NG':'連NG','明けNG':'明NG'};let diff=0;
  scrRows.forEach((r,i)=>{const v=(L[i+1]||'').replace(/"/g,'').split(',').slice(2);r.forEach((x,j)=>{if((SH[v[j]]||v[j])!==x)diff++})});if(diff)bad.push('CSV と画面の勤務が違うマス '+diff)}
 for(const k in tm)if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 const after=await st();if(Object.keys(after).sort().join(',')!==keys0.k)bad.push('kinmuhyo_v1 の形が変わった');if(after.members.length!==30)bad.push('メンバーが '+after.members.length);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log('変更 '+nCh+'件・'+JSON.stringify(tm));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
