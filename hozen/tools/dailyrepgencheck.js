// 日報：その日に入れた非常用発電機の数字（電圧・周波数・燃料など）が「4. 測定記録」に1台1行で載る・管理値の外は「管理値外あり」・別の日の数字は載らない・印刷でも出る・保存の形は変えない
// usage: node hozen/tools/dailyrepgencheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>{addGenTpl();const t=tplById('mt_gen');
  S.equipment.push({id:'eqG1',name:'非常用発電機 1号',kind:'発電機',status:'稼働',locId:'',place:''});S.meas=S.meas||[];
  const rows=(vals)=>t.rows.map((r,i)=>({...r,ck:false,photo:'',src:'',v:vals[i]==null?'':vals[i]}));
  S.meas.push({id:'mG1',date:'2026-05-10',equipId:'eqG1',tplId:'mt_gen',type:t.type,name:t.name,rows:rows([202,60,0,0.3,70,85]),cond:{},by:'x',note:'',photos:[]});
  S.meas.push({id:'mG2',date:'2026-05-11',equipId:'eqG1',tplId:'mt_gen',type:t.type,name:t.name,rows:[{name:'電圧',unit:'V',min:190,max:210,ck:false,photo:'',src:'',v:230}],cond:{},by:'x',note:'',photos:[]});
  save();go('dailyRep',{day:'2026-05-10'});return JSON.stringify(S.meas)});
 await p.waitForTimeout(400);
 const sec=()=>p.evaluate(()=>{const s=[...document.querySelectorAll('.rep .sec')].find(x=>/^4\./.test(x.textContent.trim()));if(!s)return null;const t=s.nextElementSibling;return {txt:t?t.innerText:'',rows:t?t.querySelectorAll('tbody tr').length:0}});
 let r=await sec();
 if(!r)errs.push('4. 測定記録の欄が無い');else{
  if(r.rows!==1)errs.push('発電機1台で行が1つでない '+r.rows);
  if(!/非常用発電機 1号/.test(r.txt))errs.push('設備名が出ない');
  if(!/電圧 202V/.test(r.txt)||!/周波数 60Hz/.test(r.txt)||!/燃料残量 85%/.test(r.txt))errs.push('数字が出ない: '+r.txt);
  if(/管理値外あり/.test(r.txt))errs.push('範囲内なのに管理値外');
  if(/230V/.test(r.txt))errs.push('別の日の数字が出る');}
 await p.evaluate(()=>{V.day='2026-05-11';render()});await p.waitForTimeout(300);r=await sec();
 if(!r||!/電圧 230V/.test(r.txt)||!/管理値外あり/.test(r.txt))errs.push('管理値の外が出ない: '+(r&&r.txt));
 await p.evaluate(()=>{V.day='2026-05-12';render()});await p.waitForTimeout(300);r=await sec();
 if(!r||!/この日の測定記録はありません/.test(r.txt))errs.push('記録の無い日の表示が違う: '+(r&&r.txt));
 await p.evaluate(()=>{V.day='2026-05-10';render()});await p.waitForTimeout(300);
 await p.emulateMedia({media:'print'});
 if(!await p.evaluate(()=>{const s=[...document.querySelectorAll('.rep .sec')].find(x=>/^4\./.test(x.textContent.trim()));const t=s&&s.nextElementSibling;return !!t&&t.offsetHeight>0&&/電圧 202V/.test(t.innerText)}))errs.push('印刷で出ない');
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.meas))!==before)errs.push('表示しただけで記録が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('横にはみ出す');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
