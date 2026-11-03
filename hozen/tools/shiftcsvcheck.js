// シフト表：「CSV に書き出す」（44px）。見出しは 日付・曜日・人の名前、1日1行、BOM つき、値が画面の勤務と同じ。
// 書き出しは window.hzSave を差し替えて受け取る。シフトの記録（kinmuhyo_v1）は書き出しで変わらない。390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(900);
 await p.evaluate(()=>{const o=SHIFT.get();o.members=[{name:'職員,A',type:'夜勤'},{name:'職員B',type:'夜勤'},{name:'職員C',type:'日勤'}];SHIFT.set(o)});await p.waitForTimeout(500);
 const hand=await p.evaluate(()=>{const e=document.getElementById('shCsvBtn');return e?e.getBoundingClientRect().height:0});
 if(!hand)bad.push('CSV のボタンが無い');else if(hand<44)bad.push('ボタンが44px未満 '+hand);
 const before=await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1'));
 const scr=await p.evaluate(()=>[...document.querySelectorAll('#shTable tbody tr')].map(tr=>[...tr.querySelectorAll('td')].slice(0,5).map(t=>t.textContent.trim())).filter(r=>/\d+\/\d+/.test(r[0])));
 const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text(),raw:new Uint8Array(await bl.arrayBuffer()).slice(0,3).join(',')};return true};
   document.getElementById('shCsvBtn').click();for(let k=0;k<40&&!window.__out;k++)await new Promise(r=>setTimeout(r,50));return window.__out});
 if(!out)bad.push('書き出されない');else{
  if(!/^勤務表_\d{4}-\d{2}\.csv$/.test(out.n))bad.push('ファイル名 '+out.n);
  if(out.raw!=='239,187,191')bad.push('BOM が無い '+out.raw);
  const t=out.t.replace(/^﻿/,'');const L=t.split('\r\n');
  if(!t.startsWith('"日付","曜日","職員,A","職員B","職員C"'))bad.push('見出し '+L[0]);
  if(L.length-1!==scr.length||L.length<28)bad.push('行数 '+(L.length-1)+'（画面 '+scr.length+'）');
  const SH={'A日夜勤':'A','B日夜勤':'B','公休':'休','希望休':'希望','連続NG':'連NG','明けNG':'明NG'};
  const r1=L[1].replace(/"/g,'').split(',');if(!/^\d{4}-\d{2}-\d{2}$/.test(r1[0]))bad.push('日付の形 '+r1[0]);
  // 画面の1行目の最初の人のマスと同じ勤務か
  const v=r1[2]+(r1.length>5?',':'');const scrV=scr[0][2];
  if(scrV&&r1.length>=5&&(SH[r1[2]]||r1[2])!==scrV)bad.push('画面と値が違う 画面='+scrV+' CSV='+r1[2]);}
 if(await p.evaluate(()=>localStorage.getItem('kinmuhyo_v1'))!==before)bad.push('書き出しでシフトの記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
