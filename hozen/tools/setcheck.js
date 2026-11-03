// 設定画面の確認：390px で開き、「全データ消去」が通常のバックアップ欄と別の赤枠「危険な操作」に分かれ、
// 「💾 データ」タブの一番下にあり、押しやすい大きさで、はみ出さないことを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);await p.evaluate(()=>go('set'));await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const d=document.querySelector('#dangerCard');if(!d)return null;const bk=[...document.querySelectorAll('.card')].find(x=>/データ・バックアップ/.test(x.textContent.slice(0,20)));
  const w=d.querySelector('button.red');return {inBk:bk&&bk.contains(d),hasWipe:!!w,h:w&&w.getBoundingClientRect().height,vis:d.closest('.tabpane').style.display!=='none',last:[...d.closest('.tabpane').children].pop()===d}});
 if(!r)bad.push('危険な操作の欄が無い');else{if(r.inBk)bad.push('バックアップ欄の中にある');if(!r.hasWipe)bad.push('消去ボタンが無い');if(r.h<44)bad.push('消去ボタンが小さい '+r.h);if(!r.vis)bad.push('データタブに無い');if(!r.last)bad.push('タブの一番下でない')}
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 if(process.argv[2]){await p.evaluate(()=>document.querySelector('#dangerCard').scrollIntoView());await p.screenshot({path:process.argv[2]})}
 // 基本情報・選択肢の各欄に「何に使われるか」の説明が出て、はみ出さない（390px）
 const hp=await p.evaluate(()=>{go('set',{setTab:'basic'});return null});await p.waitForTimeout(300);
 const hh=await p.evaluate(()=>{const h=[...document.querySelectorAll('.sethelp')];return {n:h.length,over:h.some(x=>x.getBoundingClientRect().right>document.documentElement.clientWidth),sw:document.documentElement.scrollWidth}});
 if(hh.n<8)bad.push('設定の欄の説明が足りない '+hh.n);if(hh.over||hh.sw>392)bad.push('設定の説明がはみ出す');
 // 点検項目・天気の各タブにも「何に効くか」の説明が出て、はみ出さない（390px）
 for(const [tab,min] of [['items',2],['link',1]]){
  await p.evaluate(t=>{go('set',{setTab:t})},tab);await p.waitForTimeout(300);
  const h2=await p.evaluate(()=>{const v=[...document.querySelectorAll('.sethelp')].filter(x=>x.offsetParent);return {n:v.length,over:v.some(x=>x.getBoundingClientRect().right>document.documentElement.clientWidth),sw:document.documentElement.scrollWidth}});
  if(h2.n<min)bad.push(tab+'タブの説明が足りない '+h2.n);if(h2.over||h2.sw>392)bad.push(tab+'タブの説明がはみ出す');
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
