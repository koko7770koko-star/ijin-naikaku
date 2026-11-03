// ホームの確認：390px で開き、「異常を記録」が1タップで記録画面を開き、一覧のボタンが異常の画面に行き、
// ボタンが44px以上・はみ出さない・エラーなしを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const h=await p.evaluate(()=>[...document.querySelectorAll('.hqk button')].map(x=>x.getBoundingClientRect().height));if(h.length!==2||Math.min(...h)<44)bad.push('ホームの入口ボタンが無い/小さい '+h);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 await p.click('.hqk button:first-child');await p.waitForTimeout(400);
 if(!await p.evaluate(()=>!!document.querySelector('#is_title')))bad.push('異常を記録が開かない');
 await p.evaluate(()=>closeModal(true));await p.click('.hqk button:nth-child(2)');await p.waitForTimeout(300);
 if(await p.evaluate(()=>V.view)!=='issues')bad.push('異常の一覧に行かない');
 if(process.argv[2]){await p.evaluate(()=>go('home'));await p.waitForTimeout(300);await p.screenshot({path:process.argv[2]})}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
