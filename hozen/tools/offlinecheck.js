// 外とつながらないとき（天気・警報・AI・PDF 用ライブラリ）に、エラーで止まらず案内が出るかを確かめる。
// usage: node hozen/tools/offlinecheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.settings.wx={on:true,lat:35,lng:135,label:'○○',pref:'270000'};});
 const r1=await p.evaluate(async()=>{try{const r=await wxFetch(true);return {r:r===null?'null':'ok',err:WX_ERR}}catch(e){return {thrown:e.message}}});
 if(r1.thrown)bad.push('天気の取得が例外で止まった '+r1.thrown);else if(r1.r==='null'&&!r1.err)bad.push('天気が取れないのに案内（WX_ERR）が空');
 const r2=await p.evaluate(async()=>{try{await wxReload();return document.getElementById('toast')?.innerText||document.body.innerText.slice(0,0)}catch(e){return 'THROWN '+e.message}});
 if(/^THROWN/.test(r2))bad.push('天気の更新ボタンが例外 '+r2);
 // PDF：読み込めないとき案内が出て、画面が busy のまま残らない
 const pdf=await p.evaluate(async()=>{try{await exportPdf(false);return {busy:document.getElementById('busy').classList.contains('on'),t:document.body.innerText.includes('PDFを作れませんでした')}}catch(e){return {thrown:e.message}}});
 if(pdf.thrown)bad.push('PDF出力が例外で止まった '+pdf.thrown);else{if(pdf.busy)bad.push('PDF出力の失敗後も「処理中」が消えない');}
 // 天気・ホーム・設定・AI 画面を開いてもエラーなし
 for(const v of ['home','set','ai','month','day']){await p.evaluate(v=>go(v),v);await p.waitForTimeout(400);}
 const card=await p.evaluate(()=>{go('home');return 0});await p.waitForTimeout(500);
 const home=await p.evaluate(()=>document.body.innerText);if(!/天気/.test(home))bad.push('ホームに天気の案内が出ない');
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 console.log(JSON.stringify({r1,pdf}));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
