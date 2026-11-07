// 操作ログ：上限 1000 件に達した後も記録を足すと古い物から捨てられ（ちょうど 1000 件・新しい物が残る）、保存して読み直しても同じで、
// 設定の画面と「操作ログ」の窓が 1 秒以内に開き（窓は新しい順に 200 件）、CSV が 1000 件出て、復元で混ぜても 1000 件を超えないか（hz-v-oplog-many）。
// usage: node hozen/tools/oplogmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const r1=await p.evaluate(()=>{S.opLog=[];for(let i=0;i<1200;i++)opLog('試しの操作','番号'+i+' '+'長い内容の例 '.repeat(10));save();return {n:S.opLog.length,first:S.opLog[0].detail.split(' ')[0],last:S.opLog.at(-1).detail.split(' ')[0]}});
 if(r1.n!==1000)bad.push('上限を超えた後の件数 '+r1.n);if(r1.first!=='番号200'||r1.last!=='番号1199')bad.push('古い物から捨てられていない '+r1.first+'〜'+r1.last);
 await p.reload();await p.waitForFunction(READY,null,{timeout:15000});const n2=await p.evaluate(()=>S.opLog.length);if(n2!==1000)bad.push('読み直すと件数が違う '+n2);
 const ts=await p.evaluate(()=>{const s=performance.now();go('set');return performance.now()-s});if(ts>1000)bad.push('設定の画面が出るまで '+Math.round(ts)+'ms');
 const tw=await p.evaluate(()=>{const s=performance.now();showOpLog();return performance.now()-s});await p.waitForTimeout(200);if(tw>1000)bad.push('操作ログの窓が出るまで '+Math.round(tw)+'ms');
 const w=await p.evaluate(()=>{const m=document.querySelector('#modal');const it=[...m.querySelectorAll('.item')];return {n:it.length,top:it[0]?it[0].textContent:'',head:m.querySelector('h3').textContent,ov:m.scrollWidth>m.clientWidth+1}});
 if(w.n!==200)bad.push('窓の行が '+w.n+'（200 のはず）');if(!/番号1199/.test(w.top))bad.push('窓の先頭が新しい物でない');if(!/1000件/.test(w.head))bad.push('窓の件数が 1000 と出ない '+w.head);if(w.ov)bad.push('窓が横にはみ出す');
 const dl=p.waitForEvent('download',{timeout:15000}).catch(()=>null);await p.evaluate(()=>exportOpLogCsv());const d=await dl;
 if(!d)bad.push('CSV が出ない');else{const t=require('fs').readFileSync(await d.path(),'utf8');const lines=t.trim().split(/\r?\n/).length-1;if(lines!==1000)bad.push('CSV の行数 '+lines)}
 const mg=await p.evaluate(()=>{const other=[...Array(800)].map((_,i)=>({at:new Date(Date.now()+1000+i).toISOString(),op:'別の端末',detail:'x'+i,by:''}));const m=mergeOpLog(S.opLog,other);return {n:m.length,last:m.at(-1).detail}});
 if(mg.n!==1000)bad.push('混ぜた後の件数 '+mg.n);if(mg.last!=='x799')bad.push('混ぜた後に新しい物が残らない '+mg.last);
 console.log('設定 '+Math.round(ts)+'ms・窓 '+Math.round(tw)+'ms');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
