// 未完了の異常一覧の印刷：0件のときは列の見出しだけの表を出さず「未完了の異常はありません」1行（月報の repTable と同じ形）。1件以上なら表（hz-v-issue-print-empty）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const look=()=>p.evaluate(()=>({th:document.querySelectorAll('#app table th').length,hasTh:[...document.querySelectorAll('#app table th')].some(e=>/発見日/.test(e.textContent)),empty:[...document.querySelectorAll('#app .repEmpty')].map(e=>e.textContent.trim()),sw:document.documentElement.scrollWidth,row:/試しの異常/.test(document.querySelector('#app').textContent)}));
 await p.evaluate(()=>{S.issues=[];go('printDoc',{doc:{t:'issueList'}})});await p.waitForTimeout(300);
 let r=await look();
 if(r.hasTh)bad.push('0件なのに列の見出しの表が出る');if(!r.empty.includes('未完了の異常はありません'))bad.push('0件の「ありません」1行が無い '+JSON.stringify(r.empty));
 await p.evaluate(()=>{S.issues=[{id:'ipe1',date:TODAY,title:'試しの異常',status:'対応中',action:'',place:''}];go('printDoc',{doc:{t:'issueList'}})});await p.waitForTimeout(300);
 r=await look();
 if(!r.hasTh||!r.row)bad.push('1件あるのに表が出ない');if(r.empty.length)bad.push('1件あるのに「ありません」が出る');if(r.sw>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
