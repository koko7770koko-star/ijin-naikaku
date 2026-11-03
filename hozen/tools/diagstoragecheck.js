// 診断の「端末の記録の大きさ」の確認：健全度の下に記録の大きさ・写真の枚数が出る・8割を超えたらバックアップとデータ点検の導線が出る（44px以上）・記録は変わらない・390pxで横はみ出しなし。
// usage: node hozen/tools/diagstoragecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>go('diag',{dgTab:'health'}));await p.waitForTimeout(500);
 let t=await p.evaluate(()=>({txt:(document.getElementById('dgStore')||{}).innerText||'',cls:(document.getElementById('dgStore')||{}).className,sw:document.documentElement.scrollWidth}));
 if(!/記録/.test(t.txt)||!/写真/.test(t.txt))bad.push('大きさが出ない：'+t.txt);if(/いっぱい/.test(t.txt))bad.push('空なのに警告が出る');if(t.sw>392)bad.push('横にはみ出す '+t.sw);
 await p.evaluate(()=>{window.storageInfo=async()=>({ls:4500000,lsMax:5000000,usage:1e6,quota:1e9,persisted:true});go('diag',{dgTab:'health'})});await p.waitForTimeout(500);
 t=await p.evaluate(()=>{const e=document.getElementById('dgStore');const bs=[...e.querySelectorAll('button')];return {txt:e.innerText,n:bs.length,minH:Math.min(...bs.map(x=>x.getBoundingClientRect().height)),sw:document.documentElement.scrollWidth}});
 if(!/90%/.test(t.txt)||!/いっぱい/.test(t.txt))bad.push('9割で警告が出ない：'+t.txt);if(t.n!==2||t.minH<44)bad.push('導線のボタン '+t.n+' 高さ '+t.minH);if(t.sw>392)bad.push('警告で横にはみ出す '+t.sw);
 const after=await p.evaluate(()=>JSON.stringify(S));if(after!==before)bad.push('表示で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
