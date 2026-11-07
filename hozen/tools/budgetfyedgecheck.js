// 予算・費用：年度の境（3/31 と 4/1）の修理・異常・工事・入庫の費用が正しい年度（4 月はじまり）の実績に入り、年をまたぐ工事は始まりの日の年度に入るか。
// 画面の表の合計と、印刷（A4）にしたときの表の数字が同じか。年度の ‹ › で前後の年度へ移れるか。記録は変えない（hz-v-budget-fy-edge）。
// usage: node hozen/tools/budgetfyedgecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const R=(id,date,cost)=>({id,date,kind:'修理',content:'修理'+id,vendor:'',cost});
  S.equipment=[{id:'eqFY',name:'年度の試しの盤',kind:'盤',status:'稼働',repairs:[R('r1','2026-03-31',1000),R('r2','2026-04-01',2000),R('r3','2027-03-31',4000),R('r4','2027-04-01',8000)]}];
  S.issues=[{id:'iF1',date:'2026-03-31',closed:'2026-04-01',title:'境の異常',place:'',status:'完了',action:'',detail:'',cost:300},{id:'iF2',date:'2027-03-31',closed:'',title:'年度末の異常',place:'',status:'対応中',action:'',detail:'',cost:50}];
  S.works=[{id:'wF1',title:'年をまたぐ工事',kind:'工事',date:'2027-03-30',endDate:'2027-04-05',status:'承認済み',cost:70000}];
  S.parts=[{id:'pF',name:'年度の部品',qty:0,min:'',unit:'個',price:10,equipIds:[]}];
  S.moves=[{id:'mF1',date:'2026-03-31',partId:'pF',type:'入庫',qty:5,after:5,by:'',ref:'',note:''},{id:'mF2',date:'2026-04-01',partId:'pF',type:'入庫',qty:7,after:12,by:'',ref:'',note:''}];
  S.budget=[{id:'bF1',fy:2026,cat:'修繕費',name:'年度の予算',amount:10000}];S.plans=[];save()});
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify([S.equipment,S.issues,S.works,S.moves,S.budget]));
 const want={2025:{'修繕費':1000,'部品・消耗品':50},2026:{'修繕費':6350,'更新工事費':70000,'部品・消耗品':70},2027:{'修繕費':8000}};
 const table=()=>p.evaluate(()=>{const t=document.querySelector('#app .bgtbl');if(!t)return null;const o={};[...t.querySelectorAll('tr')].slice(1).forEach(r=>{const td=r.querySelectorAll('td');o[td[0].textContent.trim()]={bud:td[1].textContent,act:td[2].textContent,rest:td[3].textContent}});
  return {o,title:[...document.querySelectorAll('#app b.grow')].map(x=>x.textContent).find(x=>/年度/.test(x))||''}});
 const num=s=>{const d=String(s).replace(/[^0-9-]/g,'');return d?Number(d):0};
 await p.evaluate(()=>{V.bgFy=2026;go('stock',{stTab:'budget'})});await p.waitForTimeout(250);
 for(const fy of [2026,2025,2027]){
  await p.evaluate(fy=>{V.bgFy=fy;render()},fy);await p.waitForTimeout(200);const t=await table();if(!t){bad.push(fy+' 表が無い');continue}
  if(!t.title.includes(fy+'年度（'+fy+'/4〜'+(fy+1)+'/3）'))bad.push(fy+' 見出し '+t.title);
  for(const k of ['修繕費','点検委託費','更新工事費','部品・消耗品','その他']){const w=(want[fy]||{})[k]||0,g=num(t.o[k]&&t.o[k].act);if(g!==w)bad.push(fy+'年度 '+k+' 実績 '+g+'（'+w+' のはず）')}
  if(fy===2026){if(num(t.o['修繕費'].bud)!==10000)bad.push('予算 '+t.o['修繕費'].bud);if(num(t.o['修繕費'].rest)!==3650)bad.push('残 '+t.o['修繕費'].rest)}
  const api=await p.evaluate(fy=>costsOf(fy),fy);for(const k in want[fy]||{})if(api[k]!==want[fy][k])bad.push(fy+' costsOf '+k+' '+api[k]);
 }
 // ‹ › の押し方
 await p.evaluate(()=>{V.bgFy=2026;render()});await p.waitForTimeout(150);
 await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/^‹ 2025$/.test(x.textContent.trim())).click());await p.waitForTimeout(150);
 if(await p.evaluate(()=>V.bgFy)!==2025)bad.push('‹ で前の年度へ行かない');
 await p.evaluate(()=>[...document.querySelectorAll('#app button')].find(x=>/^2026 ›$/.test(x.textContent.trim())).click());await p.waitForTimeout(150);
 // 印刷にしても同じ数字
 const scr=await table();await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const prn=await p.evaluate(()=>{const t=document.querySelector('#app .bgtbl');return t&&t.offsetParent!==null?[...t.querySelectorAll('td')].map(x=>x.textContent).join('|'):null});
 await p.emulateMedia({media:'screen'});
 const scrS=await p.evaluate(()=>[...document.querySelector('#app .bgtbl').querySelectorAll('td')].map(x=>x.textContent).join('|'));
 if(prn==null)bad.push('印刷で表が出ない');else if(prn!==scrS)bad.push('印刷と画面の数字が違う');
 if(!scr||!/2026年度/.test(scr.title))bad.push('印刷前の年度 '+(scr&&scr.title));
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify([S.equipment,S.issues,S.works,S.moves,S.budget]));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
