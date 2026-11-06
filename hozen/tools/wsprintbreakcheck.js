// 作業予定表（14日間）の印刷：作業 30 件で A4 に出したとき、行が頁の境で割れない（break-inside:avoid）・列の見出しが次の頁にも出る（thead）・
// 頁の最後に列の見出しだけが残らない。0件のときは列の見出しだけの表でなく「予定はありません」1行（hz-v-ws-print-break）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.works=[];V.wsFrom=TODAY;go('workSheet')});await p.waitForTimeout(300);
 let r=await p.evaluate(()=>({th:document.querySelectorAll('#app .rep th').length,empty:[...document.querySelectorAll('#app .rep .repEmpty')].map(e=>e.textContent.trim())}));
 if(r.th)bad.push('0件なのに列の見出しの表が出る');if(!r.empty.includes('予定はありません'))bad.push('0件の「予定はありません」1行が無い');
 await p.evaluate(()=>{for(let i=0;i<30;i++)S.works.push({id:'wsb'+i,no:'W-'+i,title:'試しの作業'+i+' 受変電設備の点検と清掃（停電を伴う）',kind:'点検',status:'承認済み',date:addD(TODAY,i%14),endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:['担当A','担当B'],vendor:i%3?'':'協力会社',vendorStaff:'',outage:{on:i%4===0},cost:'',approvals:[],content:'',result:'',place:''});go('workSheet')});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});
 r=await p.evaluate(()=>{const t=document.querySelector('#app .rep table');const tr=t&&t.querySelector('tbody tr');return {thead:t?getComputedStyle(t.querySelector('thead')).display:'',bi:tr?getComputedStyle(tr).breakInside:'',rows:t?t.querySelectorAll('tbody tr').length:0}});
 if(r.rows!==30)bad.push('30件の行が出ない '+r.rows);
 if(r.thead!=='table-header-group')bad.push('列の見出しが次の頁に出ない設定 '+r.thead);
 if(!/avoid/.test(r.bi))bad.push('行が頁の境で割れる設定 '+r.bi);
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;if(n<2)bad.push('2頁にならない（試しが効いていない）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
