// 電気設備 総合保全管理：古い形・空・壊れた記録を localStorage に入れて開き、エラーが出ない・記録が消えないことを確かめる。
// usage: node hozen/tools/oldcheck.js   （外部への通信はすべて止めて確かめる）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
const KEY='hospElecSched_v1',SKEY='kinmuhyo_v1';
const MARK='OLDCHECK_MARK';
const CASES=[
 {name:'空（何も入っていない）',ls:{}},
 {name:'最小の古い記録（settings だけ）',ls:{[KEY]:JSON.stringify({settings:{name:MARK}})},keep:o=>o.settings&&o.settings.name===MARK},
 {name:'空のオブジェクト',ls:{[KEY]:'{}'}},
 {name:'項目が欠けた記録（予定・異常に項目が足りない）',ls:{[KEY]:JSON.stringify({settings:{name:MARK},tasks:[{id:'t1',date:'2026-11-03',title:MARK}],issues:[{id:'i1',title:MARK}],daily:{'2026-11-03':{}},items:[{id:'it1',name:MARK}]})},
  keep:o=>JSON.stringify(o).includes(MARK)&&(o.tasks||[]).some(t=>t.title===MARK)},
 {name:'JSON が壊れたメイン記録',ls:{[KEY]:'{"settings":{"name":"'+MARK+'"'},rawKeep:'"name":"'+MARK+'"'},
 {name:'JSON が壊れたシフト表の記録',ls:{[SKEY]:'{"members":[{"name":"'+MARK},rawKeep:MARK},
 {name:'配列でない値（tasks が文字列）',ls:{[KEY]:JSON.stringify({settings:{name:MARK},tasks:'abc',issues:5,daily:[]})}},
];
(async()=>{const b=await chromium.launch();const bad=[];
 for(const c of CASES){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text())});
  p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(ls=>{localStorage.clear();for(const k in ls)localStorage.setItem(k,ls[k])},c.ls);await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(500);
  const views=await p.evaluate(()=>Object.keys(VIEWS));
  for(const v of views){if(v==='equipDetail')continue;await p.evaluate(v=>{try{go(v)}catch(e){console.error('go '+v+' '+e.message)}},v);await p.waitForTimeout(150)}
  for(const v of ['home','month','day','shift','menu']){await p.click(`#nav button[data-v="${v}"]`,{timeout:2500,force:true}).catch(()=>errs.push('下のボタン '+v+' が押せない'));await p.waitForTimeout(150)}
  await p.evaluate(()=>{try{save()}catch(e){console.error('save '+e.message)}});await p.waitForTimeout(600);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(500);
  const dump=await p.evaluate(async()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}
   try{const dbs=await indexedDB.databases();o.__idb=JSON.stringify(dbs)}catch(e){}return o});
  if(c.keep){let o=null;try{o=JSON.parse(dump[KEY])}catch(e){}if(!o||!c.keep(o))errs.push('記録が消えた／変わった: '+c.name)}
  if(c.rawKeep){const all=Object.values(dump).join('\n');let inIdb=false;
   try{inIdb=await p.evaluate(async(m)=>{const dbs=await indexedDB.databases();for(const d of dbs){const db=await new Promise((ok,ng)=>{const r=indexedDB.open(d.name);r.onsuccess=()=>ok(r.result);r.onerror=ng});for(const s of [...db.objectStoreNames]){const all=await new Promise(ok=>{const r=db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>ok([])});if(JSON.stringify(all).includes(m.replace(/"/g,'\\"'))||JSON.stringify(all).includes(m))return true}}return false},c.rawKeep)}catch(e){}
   if(!all.includes(c.rawKeep)&&!inIdb)errs.push('壊れた記録の原本がどこにも残っていない: '+c.name)}
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w+'px');
  console.log((errs.length?'NG ':'OK ')+c.name+(errs.length?'\n   '+errs.slice(0,6).join('\n   '):''));if(errs.length)bad.push(c.name);
  await ctx.close();
 }
 console.log(bad.length?'FAILED '+bad.length+' 件':'ALL OK');await b.close();process.exit(bad.length?1:0)})();
