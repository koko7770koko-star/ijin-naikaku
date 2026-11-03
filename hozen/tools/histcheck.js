// 点検履歴・グラフの確認：数値を40日分入れて 390px でグラフを開き、文字が読める大きさ（実寸 9px 以上）・
// 日付が3つ・最新値が出る・はみ出さない・エラーなしを確かめる。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const n=numDefs()[0];for(let i=0;i<40;i++){const d=addD(TODAY,-i);S.daily[d]=S.daily[d]||{};S.daily[d][n.id]=(Number(n.min)||10)+(i%7)*1.3}save();go('hist',{hItem:n.id,hRange:'90'})});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const s=document.querySelector('#app svg[role=img]');if(!s)return null;const k=s.getBoundingClientRect().width/320;return {minFont:Math.min(...[...s.querySelectorAll('text')].map(t=>parseFloat(t.getAttribute('font-size'))*k)),texts:s.querySelectorAll('text').length,sw:document.documentElement.scrollWidth}});
 if(!r)bad.push('グラフが出ない');else{if(r.minFont<9)bad.push('グラフの文字が小さい '+r.minFont.toFixed(1)+'px');if(r.texts<6)bad.push('目盛り・日付・最新値が足りない '+r.texts);if(r.sw>392)bad.push('横にはみ出す')}
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
