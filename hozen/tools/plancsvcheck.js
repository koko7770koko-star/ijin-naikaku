// 長期保全計画の CSV の確認：更新計画の画面に「CSV」（44px）、年度順・BOM つき・件名の改行やカンマもこわれない、
// 0 件のときはボタンを出さない。書き出しは window.hzSave を差し替えて受け取る。記録は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const run=async n=>{const before=await p.evaluate(n=>{S.equipment=[{id:'e1',code:'T-1',name:'変圧器A',kind:'変圧器',status:'稼働',locId:'',place:'',repairs:[]}];
  S.plans=[...Array(n)].map((_,i)=>({id:'p'+i,title:i===0?'件名,カンマ"引用"':'計画'+i,equipId:i===0?'e1':'',year:2030-i%5,kind:'更新',cost:String(1000*i),status:'計画',note:i===0?'1行目\n2行目':''}));
  go('plan',{plTab:'renew'});return JSON.stringify(S.plans)},n);await p.waitForTimeout(300);return before};
 let before=await run(40);
 const btn=await p.evaluate(()=>{const e=document.getElementById('planCsvBtn');return e?e.getBoundingClientRect().height:0});
 if(!btn)bad.push('CSV のボタンが無い');else if(btn<44)bad.push('ボタンが44px未満 '+btn);
 const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text(),raw:new Uint8Array(await bl.arrayBuffer()).slice(0,3).join(',')};return true};
   document.getElementById('planCsvBtn').click();for(let k=0;k<40&&!window.__out;k++)await new Promise(r=>setTimeout(r,50));return window.__out});
 if(!out)bad.push('書き出されない');else{
  if(!/^保全計画_\d{4}-\d{2}-\d{2}\.csv$/.test(out.n))bad.push('ファイル名 '+out.n);
  if(out.raw!=='239,187,191')bad.push('BOM が無い '+out.raw);
  const t=out.t.replace(/^﻿/,'');
  if(!t.startsWith('"年度","件名","区分","設備","概算費用（円）","状況","備考"'))bad.push('見出し '+t.slice(0,40));
  if(!t.includes('"件名,カンマ""引用"""'))bad.push('カンマ・引用符がこわれた');
  if(!t.includes('変圧器A'))bad.push('設備名が入らない');
  const ys=[...t.matchAll(/^"(\d{4})",/gm)].map(m=>+m[1]);if(ys.length!==40)bad.push('行数 '+ys.length);if(ys.some((y,i)=>i&&y<ys[i-1]))bad.push('年度順でない');}
 if(await p.evaluate(()=>JSON.stringify(S.plans))!==before)bad.push('記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 await run(0);if(await p.evaluate(()=>!!document.getElementById('planCsvBtn')))bad.push('計画が無いのにボタンが出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
