// 作業報告書の印刷（A4）：作業内容 40 行・結果 20 行でも、長い欄の行が丸ごと次の頁に送られて 1 頁目が空になることがない（2 頁に収まる）。
// 作業内容・結果の行だけ頁の境で割れてよく（tr.prbrk）、ほかの行は割れない（hz-v-workrep-a4）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const lines=n=>Array.from({length:n},(_,i)=>'手順'+(i+1)+' 受変電設備の盤内を点検し、端子の緩みと発熱を確かめた').join('\n');
  S.works=[{id:'wra4',no:'W-1',title:'試しの作業 受変電設備の年次点検',kind:'点検',status:'完了',date:TODAY,endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:['職員1','職員2'],vendor:'協力会社',vendorStaff:'作業員',outage:{on:true},cost:'',
   approvals:[1,2,3].map(i=>({at:Date.now(),role:'係長',by:'職員'+i,act:'承認',method:'口頭'})),content:lines(40),result:lines(20),place:'',pre:[1,2,3,4].map(i=>({text:'作業前の確認'+i,done:true,by:'職員1'})),post:[1,2,3].map(i=>({text:'作業後の確認'+i,done:true,by:'職員1'})),photos:[],hist:[1,2,3].map(i=>({at:Date.now(),act:'更新',by:'職員1',note:''}))}];
  go('printDoc',{doc:{t:'work',id:'wra4'}})});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#app tr')];const pb=rows.filter(t=>t.classList.contains('prbrk'));const other=rows.find(t=>!t.classList.contains('prbrk'));
  return {pb:pb.length,pbBi:pb.map(t=>getComputedStyle(t).breakInside),oBi:other?getComputedStyle(other).breakInside:''}});
 if(r.pb!==2)bad.push('作業内容・結果の行に prbrk が無い '+r.pb);
 if(r.pbBi.some(x=>/avoid/.test(x)))bad.push('作業内容・結果の行が割れない設定のまま');
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n>2)bad.push('A4 '+n+' 枚になる（長い欄が丸ごと次の頁に送られている）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
