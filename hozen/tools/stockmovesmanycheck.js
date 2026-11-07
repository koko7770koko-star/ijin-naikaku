// 在庫：予備品 800 品目・入出庫履歴 2 万件（全件の表示は 500 件ずつ「さらに500件表示」）・異常案件 3000・作業指示 3000 で、予備品のタブ・「ほか○件を表示」・予算と実績のタブ・CSV が
// それぞれ 1 秒以内で、予算の実績（部品・消耗品＝入庫×単価、初期在庫は数えない／修繕費）が手で数えた値と同じか。390px（hz-v-stock-moves-csv-many）。
// 保存の形は変えない。usage: node hozen/tools/stockmovesmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=1000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const T=TODAY,fy=fyNow();
  S.parts=[...Array(800)].map((_,i)=>({id:'p'+i,name:'部品'+i,code:'C'+i,spec:'',maker:'',place:'棚'+(i%20),qty:10,min:i%50?'':20,unit:'個',price:i%3?100+i:'',equipIds:[],note:''}));
  S.moves=[...Array(20000)].map((_,i)=>({id:'m'+i,date:addD(T,-(i%700)),partId:'p'+(i%800),type:['入庫','出庫','棚卸'][i%3],qty:1+(i%4),after:10,by:'',ref:i%97===0?'init':'',note:''}));
  S.issues=[...Array(3000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),closed:'',cost:i%5?'':1000,title:'異常'+i,status:'対応中'}));
  S.works=[...Array(3000)].map((_,i)=>({id:'w'+i,date:addD(T,-(i%700)),kind:'修理',status:'完了',cost:500,issueId:i%2?'i'+(i%3000):''}));
  let parts=0,rep=0;const inFy=d=>fyOfDate(d)===fy;
  S.moves.forEach(m=>{if(m.type==='入庫'&&m.ref!=='init'&&inFy(m.date)){const q=S.parts[+m.partId.slice(1)];if(q.price!=='')parts+=q.price*m.qty}});
  S.issues.forEach(i=>{if(inFy(i.date)&&i.cost)rep+=i.cost});
  S.works.forEach(w=>{const iss=w.issueId&&S.issues[+w.issueId.slice(1)];if(iss&&iss.cost)return;if(inFy(w.date))rep+=500});
  (S.equipment||[]).forEach(e=>(e.repairs||[]).forEach(x=>{if(x.date&&inFy(x.date)&&Number(x.cost))rep+=Number(x.cost)}));
  save();V.mvAll=0;return {parts,rep,fy}});await p.waitForTimeout(400);
 const tm={};let s;
 const yen=n=>n.toLocaleString('ja-JP')+'円';
 s=Date.now();await p.evaluate(()=>go('stock',{stTab:'parts'}));tm.parts=Date.now()-s;
 const n20=await p.evaluate(()=>[...document.querySelectorAll('.item .ti')].filter(x=>/^(入庫|出庫|棚卸)：/.test(x.textContent)).length);if(n20!==20)bad.push('最近の件数 '+n20);
 const btn0=await p.evaluate(()=>(document.querySelector('#mvMore')||{textContent:''}).textContent);if(!/ほか19980件/.test(btn0))bad.push('ボタン '+btn0);
 s=Date.now();await p.click('#mvMore');await p.waitForTimeout(20);tm.more=Date.now()-s-20;
 const cnt=()=>p.evaluate(()=>[...document.querySelectorAll('.item .ti')].filter(x=>/^(入庫|出庫|棚卸)：/.test(x.textContent)).length);
 let nAll=await cnt();if(nAll!==500)bad.push('全件の最初 '+nAll);
 const nx=await p.evaluate(()=>(document.querySelector('#mvNext')||{textContent:''}).textContent);if(!/残り 19500件/.test(nx))bad.push('さらに表示のボタン '+nx);
 s=Date.now();await p.click('#mvNext');await p.waitForTimeout(20);tm.next=Date.now()-s-20;nAll=await cnt();if(nAll!==1000)bad.push('さらに表示で '+nAll);
 // 最後まで辿れる（最古の 1 件が出る）
 await p.evaluate(()=>{V.mvN=20000;render()});await p.waitForTimeout(50);nAll=await cnt();if(nAll!==20000)bad.push('最後まで辿れない '+nAll);if(await p.$('#mvNext'))bad.push('最後なのにさらに表示');
 await p.evaluate(()=>{V.mvN=1000;render()});await p.waitForTimeout(50);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 s=Date.now();await p.click('#mvMore');await p.waitForTimeout(20);tm.less=Date.now()-s-20;
 s=Date.now();const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text()};return true};exportStockCsv();for(let k=0;k<200&&!window.__out;k++)await new Promise(r=>setTimeout(r,10));return window.__out});tm.csv=Date.now()-s;
 if(!out)bad.push('CSV が出ない');else{const L=out.t.replace(/^﻿/,'').split('\r\n').filter(x=>x!=='');if(L.length!==1+800+1+20000)bad.push('CSV の行 '+L.length);if(/\(削除済み\)/.test(out.t))bad.push('CSV に削除済み')}
 s=Date.now();await p.evaluate(()=>{V.stTab='budget';render()});tm.budget=Date.now()-s;
 const tb=await p.evaluate(()=>[...document.querySelectorAll('.bgtbl tr')].map(r=>[...r.children].map(x=>x.textContent.trim())));
 const row=k=>(tb.find(r=>r[0]===k)||[])[2];
 if(row('部品・消耗品')!==yen(exp.parts))bad.push('部品・消耗品の実績 '+row('部品・消耗品')+'（手で '+yen(exp.parts)+'）');
 if(row('修繕費')!==yen(exp.rep))bad.push('修繕費の実績 '+row('修繕費')+'（手で '+yen(exp.rep)+'）');
 for(const k in tm)if(tm[k]>LIM)bad.push(k+' '+tm[k]+'ms');
 const keys=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return [o.moves.length,Object.keys(o.moves[0]).sort().join(',')]});if(keys[0]!==20000)bad.push('保存の件数 '+keys[0]);
 console.log('実績 部品'+exp.parts+'・修繕'+exp.rep+'・'+JSON.stringify(tm));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
