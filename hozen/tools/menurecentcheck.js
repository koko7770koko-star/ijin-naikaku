// メニューの「最近開いた画面」：開いた画面が先頭に出る（最大4・同じ画面は1つ・ホームとメニューは入れない）。
// 探す欄で絞ると出ない。タップで開く。localStorage に新しいキーを作らない。390px ではみ出さない。
// usage: node hozen/tools/menurecentcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>go('menu'));await p.waitForTimeout(200);
 if(await p.evaluate(()=>!!document.querySelector('#mrecent')))bad.push('開く前から「最近」が出る');
 const keys0=await p.evaluate(()=>Object.keys(localStorage).sort().join());
 for(const v of ['equip','ban','hist','equip','issues','year','home']){await p.evaluate(x=>go(x),v);await p.waitForTimeout(80)}
 await p.evaluate(()=>go('menu'));await p.waitForTimeout(200);
 const r=await p.evaluate(()=>({h:!!document.querySelector('#mrecent'),n:document.querySelectorAll('#mrecent+.mtgrid .mtile').length,names:[...document.querySelectorAll('#mrecent+.mtgrid .mt')].map(x=>x.textContent),sw:document.documentElement.scrollWidth,small:[...document.querySelectorAll('#mrecent+.mtgrid .mtile')].map(x=>x.getBoundingClientRect().height)}));
 if(!r.h||r.n!==4)bad.push('最近の件数 '+r.n+' '+r.names.join('/'));
 if(r.names[0]!=='年間計画・期限'||r.names[1]!=='異常・修理'||r.names[2]!=='設備台帳'||r.names[3]!=='点検履歴・グラフ')bad.push('並び '+r.names.join('/'));
 if(r.small.some(h=>h<44))bad.push('タイルが低い '+r.small.join(','));if(r.sw>392)bad.push('はみ出す '+r.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.fill('.msearch','校正');await p.waitForTimeout(100);if(await p.evaluate(()=>getComputedStyle(document.querySelector('#mrecent')).display)!=='none')bad.push('探している間も最近が出る');
 await p.fill('.msearch','');await p.waitForTimeout(100);if(await p.evaluate(()=>getComputedStyle(document.querySelector('#mrecent')).display)==='none')bad.push('探す欄を空にしても最近が戻らない');
 await p.click('#mrecent+.mtgrid .mtile');await p.waitForTimeout(200);if(await p.evaluate(()=>V.view)!=='year')bad.push('タップで開かない '+await p.evaluate(()=>V.view));
 const keys1=await p.evaluate(()=>Object.keys(localStorage).sort().join());if(keys1!==keys0)bad.push('localStorage のキーが増えた '+keys0+' → '+keys1);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
