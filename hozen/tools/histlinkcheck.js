// 点検履歴：絞り込み → 行を押してその日の日常点検へ → 戻ると絞り込みが残る・行は44px以上・保存の形は変わらない
// usage: node hozen/tools/histlinkcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const n=numDefs()[0];for(let i=1;i<=40;i++){const k=addD(TODAY,-i);S.daily[k]={done:true,c:{},[n.id]:String(10+i),by:'職員'+(i%2?1:2),note:i%3?'':'メモあり'}}save();go('hist')});await p.waitForTimeout(300);
 const keys0=await p.evaluate(()=>Object.keys(S).sort().join());
 // 絞り込み：キーワード・期間
 await p.evaluate(()=>{V.hRange='90';V.hKw='職員1';render()});await p.waitForTimeout(200);
 const n1=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(n1<10||n1>40)bad.push('キーワードで絞れていない '+n1);
 const h=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('#app .item')].map(e=>e.getBoundingClientRect().height)));if(h<44)bad.push('行が小さい '+h);
 // 下の方の行を押す
 await p.evaluate(()=>{window.scrollTo(0,400)});
 const dayK=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')][5];const m=it.getAttribute('onclick').match(/day:'([\d-]+)'/);it.click();return m&&m[1]});await p.waitForTimeout(400);
 if(await p.evaluate(()=>V.day)!==dayK)bad.push('その日の日常点検へ行かない '+dayK);
 // 戻る
 if(!await p.$('#dayBackHist'))bad.push('日常点検に「点検履歴にもどる」が無い');else{const bh=await p.evaluate(()=>document.querySelector('#dayBackHist').getBoundingClientRect().height);if(bh<44)bad.push('戻るボタンが小さい '+bh)}
 const back=await p.$('#dayBackHist');
 if(back)await back.click();else await p.evaluate(()=>history.back());
 await p.waitForTimeout(500);
 const s=await p.evaluate(()=>({view:V.view,kw:V.hKw,r:V.hRange,n:document.querySelectorAll('#app .item').length,val:(document.querySelector('#app input')||{}).value,y:scrollY}));
 if(s.view!=='hist')bad.push('戻っても点検履歴でない '+JSON.stringify(s));
 else{if(s.kw!=='職員1'||s.r!=='90')bad.push('戻ると絞り込みが消える '+JSON.stringify(s));if(s.n!==n1)bad.push('戻ると件数が変わる '+s.n+'/'+n1);if(s.y<100)bad.push('戻ると位置が先頭に戻る '+s.y)}
 await p.evaluate(()=>go('home'));await p.waitForTimeout(200);await p.evaluate(()=>go('day',{day:TODAY}));await p.waitForTimeout(200);if(await p.$('#dayBackHist'))bad.push('ホームから来たのに戻るボタンが出る');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))bad.push('横にはみ出す');
 if(await p.evaluate(()=>Object.keys(S).sort().join())!==keys0)bad.push('保存の項目が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
