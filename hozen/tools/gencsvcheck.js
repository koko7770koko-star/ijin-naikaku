// 非常用発電機の点検記録の CSV の確認：発電機の画面に「CSV に書き出す」（44px）、1回の点検が1行・項目が列（単位つき）・BOM つき、
// 発電機以外の測定は入らない、記録が無いときはボタンを出さない。書き出しは window.hzSave を差し替えて受け取る。記録は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.equipment=[{id:'g1',code:'G-2',name:'発電機B',kind:'発電機',status:'稼働',locId:'',place:'屋上',repairs:[]},{id:'g2',code:'G-1',name:'発電機A',kind:'発電機',status:'稼働',locId:'',place:'',repairs:[]}];
  const R=(v)=>GEN_TPL.rows.map((r,i)=>({...r,v:i===0?v:i===1?'60':''}));const cond={temp:'',hum:'',toolName:''};
  S.meas=[{id:'m1',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,equipId:'g1',date:'2026-10-05',rows:R('210'),cond,by:'点検者',note:'異常なし'},
   {id:'m2',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,equipId:'g2',date:'2026-10-03',rows:R('205'),cond,by:'',note:''},
   {id:'m3',tplId:'mt_gen',type:GEN_TPL.type,name:GEN_TPL.name,equipId:'g1',date:'2026-09-05',rows:R('208'),cond,by:'',note:''},
   {id:'m4',tplId:'',type:'絶縁抵抗',name:'絶縁',equipId:'',date:'2026-10-01',rows:[{name:'絶縁抵抗',unit:'MΩ',min:'',max:'',v:'100'}],cond,by:'',note:''}];
  go('diag',{dgTab:'meas'});return JSON.stringify(S.meas)});
 await p.waitForTimeout(400);
 const btn=await p.evaluate(()=>{const e=document.getElementById('genCsvBtn');return e?e.getBoundingClientRect().height:0});
 if(!btn)bad.push('発電機の画面に CSV のボタンが無い');else if(btn<44)bad.push('ボタンが44px未満 '+btn);
 const out=await p.evaluate(async()=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text(),raw:new Uint8Array(await bl.arrayBuffer()).slice(0,3).join(',')};return true};
   document.getElementById('genCsvBtn').click();for(let k=0;k<40&&!window.__out;k++)await new Promise(r=>setTimeout(r,50));return window.__out});
 if(!out)bad.push('書き出されない');else{
  if(!/^発電機点検_\d{4}-\d{2}-\d{2}\.csv$/.test(out.n))bad.push('ファイル名 '+out.n);
  if(out.raw!=='239,187,191')bad.push('BOM が無い '+out.raw);
  const L=out.t.replace(/^﻿/,'').replace(/"/g,'').split('\r\n'),H=L[0].split(',');
  if(L.length!==4)bad.push('行数 '+L.length+'（見出し+3のはず）');
  if(!H.includes('電圧（V）')||!H.includes('周波数（Hz）')||!H.includes('燃料残量（%）'))bad.push('列が違う '+L[0]);
  if(!/^2026-10-03,G-1,発電機A/.test(L[1])||!/^2026-09-05,G-2,発電機B,屋上,208,60/.test(L[2])||!/^2026-10-05,G-2/.test(L[3]))bad.push('並び・値が違う\n'+L.join('\n'));
  if(/絶縁/.test(out.t))bad.push('発電機以外の測定が入った');}
 if(await p.evaluate(()=>JSON.stringify(S.meas))!==before)bad.push('記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 await p.evaluate(()=>{S.meas=S.meas.filter(m=>m.tplId!=='mt_gen');render()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>!!document.getElementById('genCsvBtn')))bad.push('記録が無いのにボタンが出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
