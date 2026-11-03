// 年間計画の「周期から予定を自動作成」が、内蔵の祝日表の祝日（シフト表に入れていなくても）を避けて翌平日にずらす。
// 土日も避ける。skipOff を切った項目はずらさない。保存の形は変えない。
// usage: node hozen/tools/holidaymergecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const h=await p.evaluate(()=>({a:holidays().has('2099-01-01'),b:holidays().has('2099-01-02'),c:holidays().has('2026-11-23')}));
 if(!h.a||h.b||!h.c)bad.push('holidays().has の結果 '+JSON.stringify(h));
 // 2027-11-23（火）は勤労感謝の日。初回日をそこにして年1回→2027年度の予定は 11-24（水）へずれる。
 const r=await p.evaluate(()=>{S.tasks=[];S.marks={};S.items=[{id:'it1',cat:S.settings.cats[0],name:'祝日の試験',cycle:'年1回',base:'2027-11-23',time:'',place:'',staff:'',attend:'',skipOff:true,track:true},{id:'it2',cat:S.settings.cats[0],name:'ずらさない試験',cycle:'年1回',base:'2027-11-23',time:'',place:'',staff:'',attend:'',skipOff:false,track:true}];
  const T0=TODAY;genPlan(2027);closeModal(true);return S.tasks.map(t=>t.title+':'+t.date)});
 if(!r.includes('祝日の試験:2027-11-24'))bad.push('祝日がずれていない '+r.join(','));
 if(!r.includes('ずらさない試験:2027-11-23'))bad.push('skipOff を切った項目までずれた '+r.join(','));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
