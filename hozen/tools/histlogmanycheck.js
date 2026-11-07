// 修正履歴：1 万件（同じ異常に 300 件を含む）を記録すると、古い分が端末内の別の場所へ移され（消えない）、本体は 3000 件以下になり、
// 異常の窓（中の「修正履歴」）が 1 秒以内に開き、修正履歴の CSV が保管分も含めて全件（1 万件）出るか。390px（hz-v-hist-search-many）。
// usage: node hozen/tools/histlogmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=10000;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(N=>{S.issues=[{id:'isH',src:'manual:isH',date:TODAY,title:'履歴の多い異常',detail:'',place:'',status:'対応中',urgency:'中',equipId:'',action:'',cause:'',closed:'',photos:[],log:[]}];
  S.history=[];for(let i=0;i<N;i++)S.history.push({at:new Date(Date.now()-(N-i)*60000).toISOString(),type:i%33===0?'issue':'task',ref:i%33===0?'isH':'tk'+(i%500),field:'状態',from:'予定'+i,to:'完了'+i,by:'確認者'});
  save();trimHistory()},N);
 await p.waitForFunction(()=>S.history.length<=3000&&(S.histArcKeys||[]).length>0,null,{timeout:20000}).catch(()=>bad.push('古い修正履歴が保管に移らない'));
 const st=await p.evaluate(async()=>({body:S.history.length,all:(await allHistory()).length}));
 if(st.body>3000)bad.push('本体の修正履歴が多すぎる '+st.body);if(st.all!==N)bad.push('保管分を合わせた件数が違う（消えた） '+st.all+'/'+N);
 await p.reload();await p.waitForFunction(READY,null,{timeout:15000});const st2=await p.evaluate(async()=>(await allHistory()).length);if(st2!==N)bad.push('読み直すと件数が違う '+st2);
 const ms=await p.evaluate(()=>{go('issues');const s=performance.now();editIssue('isH');return performance.now()-s});await p.waitForTimeout(300);if(ms>1000)bad.push('異常の窓が開くまで '+Math.round(ms)+'ms');
 const lg=await p.evaluate(()=>{const d=[...document.querySelectorAll('#modal details')].find(x=>/修正履歴/.test(x.textContent));if(!d)return null;d.open=true;const m=document.querySelector('#modal');return {sum:d.querySelector('summary').textContent,ov:m.scrollWidth>m.clientWidth+1}});
 if(!lg)bad.push('異常の窓に修正履歴が無い');else{if(!/（\d+件）/.test(lg.sum))bad.push('修正履歴の件数が出ない '+lg.sum);if(lg.ov)bad.push('修正履歴を開くと窓がはみ出す')}
 await p.evaluate(()=>closeModal(true));
 const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);const s0=Date.now();await p.evaluate(()=>exportHistoryCsv());const d=await dl;const cm=Date.now()-s0;
 if(!d)bad.push('CSV が出ない');else{const t=require('fs').readFileSync(await d.path(),'utf8');const lines=t.trim().split(/\r?\n/).length-1;if(lines!==N)bad.push('CSV の行数 '+lines+'/'+N);if(cm>5000)bad.push('CSV に '+cm+'ms')}
 console.log('本体 '+st.body+'件・全部 '+st.all+'件・窓 '+Math.round(ms)+'ms・CSV '+cm+'ms');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
