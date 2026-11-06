// 設定の「消す」系の操作（全データ消去・シフト初期化・ひな形/作業/予備品/作業標準/図面の削除・写真の整理）を途中で取り消すと、
// localStorage の全キーが1文字も変わらないことの確かめ（390px）。
// usage: node hozen/tools/clearcancelcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let dlg=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>{dlg++;d.dismiss().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.tasks=[{id:'t1',date:TODAY,title:'試験'}];S.issues=[{id:'i1',date:TODAY,title:'a',status:'完了'}];S.mtpl=[{id:'m1',name:'ひな形1'}];S.works=[{id:'w1',title:'作業1'}];S.parts=[{id:'p1',name:'予備1'}];S.stds=[{id:'s1',name:'標準1'}];S.drawings=[{id:'d1',name:'図面1',vers:[]}];save();go('set')});await p.waitForTimeout(500);
 const snap=()=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(o)});
 const diff=(a,b)=>{const A=JSON.parse(a),B=JSON.parse(b);return [...new Set([...Object.keys(A),...Object.keys(B)])].filter(k=>A[k]!==B[k])};
 const cancelAsk=async(name,call,wrongFirst)=>{
  const before=await snap();dlg=0;
  await p.evaluate(`(()=>{window.__r=undefined;Promise.resolve((${call})).then(v=>{window.__r='done'})})()`);await p.waitForTimeout(300);
  if(wrongFirst){await p.fill('#askin','ちがう').catch(()=>{});const dis=await p.evaluate(()=>{const o=document.getElementById('askok');return o?o.disabled:null});if(dis===false)bad.push(name+'：違う文字でも実行できる')}
  await p.click('#askov [data-c]').catch(()=>bad.push(name+'：「やめる」が無い'));await p.waitForTimeout(300);
  const d=diff(before,await snap());if(d.length)bad.push(name+'：取り消したのに変わった '+d.join(','));};
 await cancelAsk('全データ消去','wipe()',true);
 const cases=[['シフト初期化','resetAll()'],['ひな形','delMtpl("m1")'],['作業','delWork("w1")'],['予備品','delPart("p1")'],['作業標準','delStd("s1")'],['図面','delDwg("d1")']];
 for(const [name,call] of cases){const before=await snap();dlg=0;await p.evaluate(`(async()=>{await Promise.resolve((${call}))})().catch?.(()=>{})`).catch(()=>{});await p.waitForTimeout(300);
  if(!dlg&&name!=='シフト初期化')bad.push(name+'：確認が出ない');const d=diff(before,await snap());if(d.length)bad.push(name+'：取り消したのに変わった '+d.join(','))}
 const left=await p.evaluate(()=>[S.tasks.length,S.issues.length,S.mtpl.length,S.works.length,S.parts.length,S.stds.length,S.drawings.length].join());if(left!=='1,1,1,1,1,1,1')bad.push('取り消したのに中身が減った '+left);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
