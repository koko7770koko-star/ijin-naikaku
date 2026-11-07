// 不具合（異常・故障）：記録 3000 件（未完了・完了・故障・期限超過が混ざる、長い題）・設備 500 台・棟 6 で、一覧が 1 秒以内に出て、
// 絞り込み（未完了・すべて・期限超過・故障・緊急）・探す欄・棟の絞り込みを押すたびに 1 秒以内、件数が正しく、「さらに表示」で増え、
// 390px・文字「標準」「特大」ではみ出さないか。見ただけで記録は変えない（hz-v-issues-many）。usage: node hozen/tools/issuesmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=3000,LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(([f,N])=>{S.settings.fscale=f;const U=['緊急','高','中','低'];
  S.locs=[...Array(6)].map((_,i)=>({id:'bl'+i,name:'ABCDEF'[i]+'棟',type:'建屋',parent:'',note:'',pos:{}}));
  S.equipment=[...Array(500)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+String(i).padStart(4,'0'),name:'試しの設備'+i+'（高圧受変電設備 第'+i+'系統）',kind:'変圧器',locId:'bl'+(i%6),status:'稼働',importance:'',repairs:[]}));
  S.issues=[...Array(N)].map((_,i)=>({id:'ism'+i,src:'manual:ism'+i,date:addD(TODAY,-(i%900)),title:'試しの異常'+i+' 高圧受電盤の真空遮断器の動作不良と異音（長い題の例）',detail:'点検時に確認。詳細は報告書を参照',place:'',status:i%3?'完了':'対応中',urgency:U[i%4],failure:i%7===0,due:i%3?'':addD(TODAY,(i%5)-2),equipId:i%2?'eqm'+(i%500):'',action:i%3?'部品交換':'',cause:'',closed:i%3?TODAY:'',photos:[],log:[]}));save()},[fs,N]);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.issues));
 const want=await p.evaluate(()=>{const o=S.issues.filter(i=>i.status!=='完了');return {open:o.length,all:S.issues.length,over:o.filter(i=>i.due&&i.due<TODAY).length,fail:S.issues.filter(i=>i.failure).length,urg:o.length?S.issues.filter(i=>i.urgency==='緊急').length:0}});
 const cntTxt=()=>p.evaluate(()=>{const h=[...document.querySelectorAll('#app .card h2, #app .card h3, #app .card .ct, #app .card > *:first-child')].map(x=>x.textContent).find(t=>/異常・故障/.test(t))||'';const m=h.match(/(\d+)件/);
  return {n:m?+m[1]:-1,rows:[...document.querySelectorAll('#app .item')].filter(x=>/試しの異常\d+/.test(x.textContent)).length,sw:document.documentElement.scrollWidth}});
 const t0=await p.evaluate(()=>{applyFScale();V.isF='open';V.isQ='';V.isB='';V.isMore=0;const t=performance.now();go('issues');return performance.now()-t});await p.waitForTimeout(200);
 if(t0>LIM)bad.push(tag+'一覧が出るまで '+Math.round(t0)+'ms');
 let r=await cntTxt();if(r.n!==want.open)bad.push(tag+'未完了の件数が違う '+r.n+'/'+want.open);if(r.rows!==100)bad.push(tag+'最初の100件が並ばない '+r.rows);if(r.sw>392)bad.push(tag+'はみ出す '+r.sw);
 for(const [f,w] of [['all',want.all],['over',want.over],['fail',want.fail],['緊急',null]]){
  const ms=await p.evaluate(f=>{V.isF=f;const t=performance.now();render();return performance.now()-t},f);await p.waitForTimeout(100);
  if(ms>LIM)bad.push(tag+'絞り込み '+f+'：'+Math.round(ms)+'ms');r=await cntTxt();if(w!=null&&r.n!==w)bad.push(tag+'絞り込み '+f+' の件数が違う '+r.n+'/'+w);if(r.sw>392)bad.push(tag+f+' ではみ出す '+r.sw)}
 let ms=await p.evaluate(()=>{V.isF='all';V.isQ='試しの異常1234 ';const t=performance.now();render();return performance.now()-t});await p.waitForTimeout(100);
 if(ms>LIM)bad.push(tag+'探す欄：'+Math.round(ms)+'ms');r=await cntTxt();if(r.n!==1)bad.push(tag+'探す欄で絞れない '+r.n);
 ms=await p.evaluate(()=>{V.isQ='系統';const t=performance.now();render();return performance.now()-t});await p.waitForTimeout(100);
 if(ms>LIM)bad.push(tag+'設備名で探す：'+Math.round(ms)+'ms');r=await cntTxt();if(r.n!==N/2)bad.push(tag+'設備名で探せない '+r.n);
 ms=await p.evaluate(()=>{V.isQ='';V.isB='bl2';const t=performance.now();render();return performance.now()-t});await p.waitForTimeout(100);
 if(ms>LIM)bad.push(tag+'棟で絞る：'+Math.round(ms)+'ms');r=await cntTxt();const wb=await p.evaluate(()=>S.issues.filter(i=>{const e=i.equipId&&S.equipment.find(x=>x.id===i.equipId);return e&&e.locId==='bl2'}).length);if(r.n!==wb)bad.push(tag+'棟で絞れない '+r.n+'/'+wb);
 await p.evaluate(()=>{V.isB='';render()});const mb=await p.$('#app button:has-text("さらに")');if(!mb)bad.push(tag+'「さらに表示」が無い');else{await mb.click();await p.waitForTimeout(200);r=await cntTxt();if(r.rows!==200)bad.push(tag+'さらに表示で増えない '+r.rows)}
 const after=await p.evaluate(()=>JSON.stringify(S.issues));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 console.log(tag+'一覧 '+Math.round(t0)+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
