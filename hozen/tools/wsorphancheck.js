// 作業予定表の印刷：件名の列が狭くて最後の1〜2字だけが次の行に取り残されない（hz-v-ws-title-orphan）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:700,height:1000}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.works=[];V.wsFrom=TODAY;for(let i=0;i<30;i++)S.works.push({id:'wso'+i,no:'W-'+i,title:'試しの作業'+i+' 受変電設備の点検と清掃（停電を伴う）',kind:'点検',status:'承認済み',date:addD(TODAY,i%14),endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:['担当A','担当B'],vendor:i%3?'':'協力会社',vendorStaff:'',outage:{on:i%4===0},cost:'',approvals:[],content:'',result:'',place:''});go('workSheet')});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>{const o=[];document.querySelectorAll('#app .rep tbody tr').forEach(tr=>{const td=tr.children[2];const w=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);const tops=[];let t;while(t=w.nextNode()){for(let k=0;k<t.data.length;k++){if(!t.data[k].trim())continue;const rg=document.createRange();rg.setStart(t,k);rg.setEnd(t,k+1);tops.push(Math.round(rg.getBoundingClientRect().top))}}
  const mx=Math.max(...tops),tail=tops.filter(x=>x===mx).length;o.push({lines:new Set(tops).size,tail,orphan:new Set(tops).size>1&&tail<=2})});return o});
 const n=r.filter(x=>x.orphan);if(n.length)bad.push('件名の最後の1〜2字だけが取り残される行 '+n.length+'件（最後の行が '+n[0].tail+' 字）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
