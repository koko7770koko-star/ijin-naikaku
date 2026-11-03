// 保全の設定・測定のひな形：重み・チェックリスト・下限/上限の入力欄に、何に効くかの説明が1行以上あり、390px で折れず、はみ出さない。
// usage: node hozen/tools/msethelpcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>go('mset'));await p.waitForTimeout(300);
 let t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/大きいほど/.test(t))bad.push('重みの説明が無い');if(!/新しく作る作業指示に最初から入ります/.test(t))bad.push('作業前チェックの説明が無い');
 let sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('保全の設定がはみ出す '+sw);
 await p.evaluate(()=>{go('mtpl')});await p.waitForTimeout(300);await p.evaluate(()=>editMtpl());await p.waitForSelector('#mt_rows',{state:'attached'});
 t=await p.evaluate(()=>document.querySelector('#modal').innerText);if(!/管理値外（赤）/.test(t))bad.push('下限・上限の説明が無い');
 sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('ひな形の窓がはみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
