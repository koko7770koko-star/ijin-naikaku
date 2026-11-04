// 記録が0件の画面を印刷にしても、案内ボタン（＋ 追加・登録など）が紙に出ない（画面の見た目は変えない）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const views=['stds','locs','mtpl','stock','dwgs','lib','ban'];
 for(const v of views){
  await p.emulateMedia({media:'screen'});await p.evaluate(v=>{S.stds=[];S.locs=[];S.mtpl=[];S.parts=[];S.tools=[];S.dwgs=[];S.lib=[];go(v)},v).catch(e=>errs.push(v+' '+e.message));await p.waitForTimeout(250);
  const scr=await p.evaluate(()=>document.querySelectorAll('#app button').length);
  await p.emulateMedia({media:'print'});await p.waitForTimeout(100);
  const n=await p.evaluate(()=>[...document.querySelectorAll('#app button,#app input,#app select,#app textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'}).map(e=>(e.textContent||e.id||e.tagName).trim().slice(0,12)));
  if(n.length)bad.push(v+'：印刷にボタン・入力欄が出る '+n.join('｜'));
  if(!scr)bad.push(v+'：画面ではボタンが無い（確かめが無効）');
 }
 await p.emulateMedia({media:'screen'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
