// 月次報告書：記録の無い月は、空の表（列の見出し＋該当なし）を出さず、節の見出しの下に「該当なし」1行だけ。節の番号・順は残る。記録のある月は表のまま。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.tasks=[];S.issues=[];S.daily={};S.notes={};V.ry=now.getFullYear();V.rm=now.getMonth()+1;V.rfy=fyOf(V.ry,V.rm);go('report',{rmode:'m'})});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const a=document.querySelector('#app');return {secs:[...a.querySelectorAll('.sec')].map(x=>x.textContent.trim().slice(0,3)),emptyRows:a.querySelectorAll('.repEmpty').length,emptyTables:[...a.querySelectorAll('table')].filter(t=>/該当なし/.test(t.textContent)&&!t.querySelector('td:not([colspan])')).length,sw:document.documentElement.scrollWidth}});
 if(r.emptyTables)bad.push('「該当なし」だけの表が残っている '+r.emptyTables);
 if(r.emptyRows<2)bad.push('1行の「該当なし」が出ない '+r.emptyRows);
 if(!r.secs.some(x=>/^2\./.test(x))||!r.secs.some(x=>/^6\./.test(x)))bad.push('節の見出しが消えた '+r.secs);
 if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
