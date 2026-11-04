// 工事の「写して新しく作る」の確認：写した窓が内容を引き継ぎ、作業番号は新しく・日付は今日・結果や写真は空、
// 保存すると1件増え元の工事は変わらない・390px ではみ出さない。保存の形は変えない。
// usage: node hozen/tools/worksdupcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{editWork('', {title:'年次停電点検',kind:'点検',date:'2025-05-10',content:'手順A',result:'前回の結果',cost:'1000',needN:2});});
 await p.waitForSelector('#wk_title');
 await p.evaluate(()=>{saveWork('')});await p.waitForTimeout(300);
 const id=await p.evaluate(()=>{const w=S.works[0];w.result='前回の結果';w.cost='1000';w.pre[0]&&(w.pre[0].done=true);save();return w.id});
 await p.evaluate(i=>editWork(i),id);await p.waitForSelector('#wk_title');
 const btn=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(x=>x.textContent.trim()==='写して新しく作る').map(x=>x.getBoundingClientRect().height));
 if(btn.length!==1)bad.push('ボタンが '+btn.length+' 個');
 await p.evaluate(i=>dupWork(i),id);await p.waitForSelector('#wk_title');await p.waitForTimeout(200);
 const f=await p.evaluate(()=>({t:$('#wk_title').value,no:$('#wk_no').value,d:$('#wk_date').value,r:$('#wk_result').value,c:$('#wk_cost').value,ct:$('#wk_content').value,n:$('#wk_needN').value,sw:document.documentElement.scrollWidth,td:TODAY,pre:WK.pre.every(x=>!x.done)}));
 if(f.t!=='年次停電点検'||f.ct!=='手順A'||f.n!=='2')bad.push('内容を引き継いでいない '+JSON.stringify(f));
 if(f.d!==f.td)bad.push('日付が今日でない '+f.d);if(f.r||f.c)bad.push('結果・費用が残っている');if(!f.pre)bad.push('チェックが済のまま');if(f.sw>392)bad.push('はみ出す '+f.sw);
 await p.evaluate(()=>saveWork(''));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({n:S.works.length,l:JSON.parse(localStorage.getItem('hospElecSched_v1')).works.length,a:S.works[0],b:S.works[1]}));
 if(r.n!==2||r.l!==2)bad.push('件数 '+r.n+'/'+r.l);
 if(r.a.result!=='前回の結果'||r.a.date!=='2025-05-10')bad.push('元の工事が変わった');
 if(r.b.id===r.a.id||r.b.no===r.a.no||r.b.status!=='起案'||r.b.result)bad.push('写しが正しくない '+r.b.no+'/'+r.a.no);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
