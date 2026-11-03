// 点検履歴の確認：日常点検の記録が400日分（数値・確認・備考つき）あっても、開く・項目や期間の絞り込みが 1 秒以内で、200件まで表示し「ほか○日」が出て、390px で行が切れず横にはみ出さないことを確かめる。
// usage: node hozen/tools/histmanycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const n0=await p.evaluate(()=>{const N=numDefs(),C=chkDefs();for(let i=0;i<400;i++){const d=addD(TODAY,-i);const r=S.daily[d]={};N.forEach((n,k)=>{r[n.id]=(Number(n.min)||10)+((i+k)%9)*1.7});r.c={};C.forEach((c,k)=>{r.c[c.id]=(i+k)%11===0?'×':'○'});r.by='職員'+(i%5);r.note=i%4?'':'備考の試し（名前の長い備考 受変電設備 高圧交流負荷開閉器の点検で気づいたこと）';r.done=new Date().toISOString()}save();return Object.keys(S.daily).length});
 const t0=Date.now();await p.evaluate(()=>go('hist'));await p.waitForSelector('#app .item, #app .card');const t1=Date.now()-t0;
 if(t1>1000)bad.push('点検履歴を開くのに '+t1+'ms');
 const r=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')];const w=document.documentElement.clientWidth;return {n:it.length,txt:/ほか\s*\d+日/.test(document.querySelector('#app').innerText),sw:document.documentElement.scrollWidth,cut:it.filter(e=>e.scrollWidth>e.clientWidth+1||e.getBoundingClientRect().right>w+1).length,ov:it.some((e,i)=>i&&e.getBoundingClientRect().top<it[i-1].getBoundingClientRect().bottom-1)}});
 await p.evaluate(()=>{V.hRange='all';render()});
 const t2=await p.evaluate(()=>{const s=performance.now();V.hRange='all';V.hItem=numDefs()[0].id;render();V.hNg=true;render();V.hKw='職員3';render();return performance.now()-s});
 const all=await p.evaluate(()=>{V.hRange='all';V.hItem='';V.hNg=false;V.hKw='';render();return {n:document.querySelectorAll('#app .item').length,more:/ほか\s*\d+日/.test(document.querySelector('#app').innerText),sw:document.documentElement.scrollWidth,cut:[...document.querySelectorAll('#app .item')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length}});
 if(t2>1000)bad.push('絞り込み3回で '+Math.round(t2)+'ms');if(all.n<150)bad.push('全期間で件数が少ない '+all.n);if(!all.more)bad.push('「ほか○日」が出ない');if(all.sw>392||all.cut||r.sw>392||r.cut)bad.push('390pxで切れる・はみ出す');if(r.ov)bad.push('行が重なる');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log('open ms',t1,'filter ms',Math.round(t2),'rows',all.n);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
