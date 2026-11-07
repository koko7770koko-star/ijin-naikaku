// 作業標準：300 件（前後のチェック 40 項目ずつ）で、一覧・探す（文書番号・全角半角）・窓を開くがそれぞれ 1 秒以内、件数が合い、
// 一覧を A4 で印刷しても幅に収まるか（hz-v-stds-steps-many。stdsmanycheck は 100 件）。記録は変えない。usage: node hozen/tools/stds300check.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const ck=n=>[...Array(40)].map((_,k)=>({text:'確認項目'+k+'：検電・接地を確かめる（'+n+'）',req:k%2===0}));
  S.stds=[...Array(300)].map((_,i)=>({id:'sd'+i,name:'作業標準'+i+'（停電作業）',docNo:'DOC-'+String(i).padStart(4,'0'),ver:'1',kinds:['停電作業'],pre:ck('前'),post:ck('後'),note:'',approvedBy:i%3?'責任者':'',approvedDate:i%3?'2026-04-01':'',hist:[]}));save()});
 const before=await p.evaluate(()=>JSON.stringify(S.stds).length);
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 let s=Date.now();await p.evaluate(()=>{V.stdQ='';go('stds')});await raf();tm.list=Date.now()-s;
 const n=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>/作業標準\d+/.test(x.textContent)).length);if(n!==300)bad.push('一覧 '+n);
 s=Date.now();await p.evaluate(()=>{V.stdQ='ｄｏｃ-0123';render()});await raf();tm.search=Date.now()-s;
 const h=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>/作業標準\d+/.test(x.textContent)).length);if(h!==1)bad.push('探す '+h);
 s=Date.now();await p.evaluate(()=>editStd('sd123'));await p.waitForTimeout(50);tm.modal=Date.now()-s-50;
 const open=await p.evaluate(()=>/DOC-0123/.test((document.querySelector('#modal')||{innerHTML:''}).innerHTML));if(!open)bad.push('窓が開かない');
 await p.evaluate(()=>{closeModal(true);V.stdQ='';render()});await raf();
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,W:innerWidth}));if(w.sw>w.W+1)bad.push('A4 の幅からはみ出す '+w.sw);
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>JSON.stringify(S.stds).length)!==before)bad.push('見ただけで記録が変わった');
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
