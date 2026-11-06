// 日報：記録の無い節（3. 作業・点検の実績・5. 異常案件）は列の見出し行を出さず「なし」1行（.repEmpty）。記録があれば表。2. 日常点検の表は空でも項目名を出す（hz-v-dailyrep-empty）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const look=()=>p.evaluate(()=>{const secs=[...document.querySelectorAll('.rep .sec')];const out={};secs.forEach(s=>{const k=s.textContent.trim().slice(0,2);const n=s.nextElementSibling;out[k]={empty:!!(n&&n.classList.contains('repEmpty')),th:n?n.querySelectorAll('th').length:0,txt:n?n.textContent.trim().slice(0,20):''}});return out});
 const ds='2001-02-03';
 await p.evaluate(ds=>{S.tasks=S.tasks.filter(t=>t.date!==ds);S.issues=[];go('dailyRep',{day:ds})},ds);await p.waitForTimeout(300);
 let r=await look();
 for(const k of ['3.','5.']){if(!r[k]||!r[k].empty||r[k].th||r[k].txt!=='なし')bad.push('空の日の '+k+' が「なし」1行でない '+JSON.stringify(r[k]))}
 if(!r['2.']||!r['2.'].th)bad.push('2. 日常点検の項目名が消えた');
 await p.evaluate(ds=>{S.tasks.push({id:'tFold',date:ds,time:'09:00',title:'点検X',place:'',staff:'',status:'予定',result:''});S.issues=[{id:'iFold',date:ds,title:'異常X',status:'対応中',action:''}];go('dailyRep',{day:ds})},ds);await p.waitForTimeout(300);
 r=await look();
 for(const k of ['3.','5.']){if(!r[k]||r[k].empty||!r[k].th)bad.push('記録のある日の '+k+' が表でない '+JSON.stringify(r[k]))}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
