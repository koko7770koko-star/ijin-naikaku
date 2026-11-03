// 報告書：記録が0件の月・年度で案内（「記録はありません」＋日常点検・不具合へのボタン、44px以上）が出る。
// 記録のある月では出ない。「undefined」「NaN」が出ない。390px で横にはみ出さない。記録は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const info=sel=>p.evaluate(sel=>{const e=document.querySelector(sel);const a=document.querySelector('#app').innerText;return {bad:/undefined|NaN/.test(a),sw:document.documentElement.scrollWidth,e:e?{t:e.textContent,bs:[...e.querySelectorAll('button')].map(x=>[x.textContent.trim(),x.getBoundingClientRect().height])}:null}},sel);
 const before=await p.evaluate(()=>{S.tasks=[];S.issues=[];S.daily={};S.notes={};return JSON.stringify([S.tasks,S.issues,S.daily,S.notes])});
 for(const [mode,sel] of [['m','.monthlyEmpty'],['y','.yearlyEmpty']]){
  await p.evaluate(m=>{V.ry=now.getFullYear()-10;V.rm=3;V.rfy=now.getFullYear()-10;go('report',{rmode:m})},mode);await p.waitForTimeout(300);
  const r=await info(sel);const n=mode==='m'?'月報':'年報';
  if(!r.e)bad.push(n+'：案内が出ない');else{
   if(!/記録はありません/.test(r.e.t))bad.push(n+'：「記録はありません」が無い');
   for(const w of ['日常点検','不具合']){const bt=r.e.bs.find(x=>x[0].includes(w));if(!bt)bad.push(n+'：「'+w+'」のボタンが無い');else if(bt[1]<44)bad.push(n+'：'+w+'のボタンが44px未満 '+bt[1])}}
  if(r.bad)bad.push(n+'：undefined/NaN が出ている');if(r.sw>392)bad.push(n+'：横にはみ出す '+r.sw);
  // ボタンで日常点検へ行ける
  const to=await p.evaluate(()=>{const bt=[...document.querySelectorAll('.monthlyEmpty button,.yearlyEmpty button')].find(x=>x.textContent.includes('日常点検'));if(!bt)return '';bt.click();return V.view||''});
  await p.waitForTimeout(200);if(!(await p.evaluate(()=>/日常点検/.test(document.title+document.querySelector('#app').innerText.slice(0,200)))))bad.push(n+'：ボタンで日常点検に行けない');}
 // 記録のある月・年度では出ない
 await p.evaluate(()=>{const c0={};chkDefs().forEach(d=>c0[d.id]='○');S.daily[TODAY]={done:true,c:c0};V.ry=now.getFullYear();V.rm=now.getMonth()+1;V.rfy=fyOf(V.ry,V.rm);go('report',{rmode:'m'})});await p.waitForTimeout(300);
 if((await info('.monthlyEmpty')).e)bad.push('記録のある月で案内が出ている');
 await p.evaluate(()=>go('report',{rmode:'y'}));await p.waitForTimeout(300);
 if((await info('.yearlyEmpty')).e)bad.push('記録のある年度で案内が出ている');
 await p.evaluate(()=>{delete S.daily[TODAY]});
 if(await p.evaluate(()=>JSON.stringify([S.tasks,S.issues,S.daily,S.notes]))!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
