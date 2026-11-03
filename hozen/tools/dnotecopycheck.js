// 日報：特記事項が空の日に、直近の日の文を1回で写せる・入力済みは上書きしない・写したあと直せる・44px・はみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const d0=await p.evaluate(()=>{S.dnotes={};go('dailyRep',{day:TODAY});return render(),!!document.getElementById('dnCopy')});
 if(d0)bad.push('写す元が無いのにボタンが出る');
 await p.evaluate(()=>{S.dnotes[addD(TODAY,-3)]='巡回異常なし';go('dailyRep',{day:TODAY})});await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>{const x=document.getElementById('dnCopy');if(!x)return null;const r=x.getBoundingClientRect();return{h:r.height,sw:document.documentElement.scrollWidth}});
 if(!btn)bad.push('ボタンが出ない');else{if(btn.h<44)bad.push('小さい '+btn.h);if(btn.sw>392)bad.push('はみ出す')}
 await p.click('#dnCopy');await p.waitForTimeout(300);
 const v=await p.evaluate(()=>S.dnotes[TODAY]);if(v!=='巡回異常なし')bad.push('写らない '+v);
 if(await p.evaluate(()=>!!document.getElementById('dnCopy')))bad.push('入力済みなのにボタンが残る');
 await p.evaluate(()=>{copyPrevDnote(TODAY);S.dnotes[addD(TODAY,-3)]='別の文';copyPrevDnote(TODAY)});
 if(await p.evaluate(()=>S.dnotes[TODAY])!=='巡回異常なし')bad.push('入力済みを上書きした');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
