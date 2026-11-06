// 予備品の入出庫履歴：200件あっても「ほか○件を表示」で最古の1件まで画面で辿れ、戻せる。390px・特大でもはみ出さない。保存の形は変えない。
// usage: node hozen/tools/stockmovesmorecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.parts=[{id:'p1',name:'テスト部品',code:'',spec:'',maker:'',place:'',qty:10,min:'',unit:'個',equipIds:[]}];
  S.moves=[...Array(200)].map((_,i)=>({id:'m'+i,date:addD(T,-i),partId:'p1',type:i%2?'出庫':'入庫',qty:1,after:10,by:'',ref:'',note:'メモ'+i}));save();V.mvAll=0;go('stock',{stTab:'parts'})});await p.waitForTimeout(400);
 const st=()=>p.evaluate(()=>{const it=[...document.querySelectorAll('.item')].filter(x=>/^(入庫|出庫)：/.test((x.querySelector('.ti')||{textContent:''}).textContent));return {n:it.length,btn:(document.querySelector('#mvMore')||{textContent:''}).textContent.trim(),sw:document.documentElement.scrollWidth}});
 let r=await st();if(r.n!==20)bad.push('先頭の件数 '+r.n);if(!/ほか180件/.test(r.btn))bad.push('ボタン '+r.btn);
 await p.click('#mvMore');await p.waitForTimeout(200);r=await st();if(r.n!==200)bad.push('全件出ない '+r.n);if(r.sw>392)bad.push('はみ出す '+r.sw);
 await p.click('#mvMore');await p.waitForTimeout(200);r=await st();if(r.n!==20)bad.push('戻らない '+r.n);
 await p.evaluate(()=>{S.moves=S.moves.slice(0,5);render()});await p.waitForTimeout(150);r=await st();if(r.btn)bad.push('少ないのにボタン');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
