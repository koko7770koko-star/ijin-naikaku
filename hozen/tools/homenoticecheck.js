// ホームのお知らせ：未実施の日付が押せる（44px以上）→その日の日常点検が開く。多いときは最新3日と「ほか n 日」。はみ出さない・エラーなし。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 // 直近の日に1日だけ記録があり、ほかは未実施の状態を作る
 await p.evaluate(()=>{S.daily={};S.daily[addD(TODAY,-4)]={done:true};go('home')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const ch=[...document.querySelectorAll('#app .alchip')];return {n:ch.length,hs:ch.map(x=>x.getBoundingClientRect().height),ws:ch.map(x=>x.getBoundingClientRect().width),more:/ほか \d+日/.test(document.querySelector('.alchips')?.textContent||''),sw:document.documentElement.scrollWidth,first:ch[0]&&ch[0].textContent,want:addD(TODAY,-1)}});
 if(r.n<1)bad.push('日付のボタンが出ない');if(r.n>3)bad.push('日付のボタンが3つを超える '+r.n);if(r.hs.some(h=>h<44)||r.ws.some(w=>w<44))bad.push('日付のボタンが小さい');if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.click('#app .alchip');await p.waitForTimeout(400);
 const v=await p.evaluate(()=>({view:V.view,day:V.day}));if(v.view!=='day'||v.day!==r.want)bad.push('その日の日常点検が開かない '+JSON.stringify(v)+' 期待 '+r.want);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');if(process.argv[2]){await p.evaluate(()=>go('home'));await p.waitForTimeout(300);await p.screenshot({path:process.argv[2]})}await b.close();process.exit(errs.length||bad.length?1:0)})();
