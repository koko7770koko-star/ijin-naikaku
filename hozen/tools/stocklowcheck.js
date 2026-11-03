// 予備品：− を1回押して最低在庫を切ったら、その場で知らせ（toast）と「在庫不足」の印が出る・1タップで済む・保存の形は変わらない
// usage: node hozen/tools/stocklowcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.parts=[{id:'p1',code:'',name:'ヒューズ 10A',spec:'',maker:'',place:'',unit:'個',qty:3,min:2,price:'',equipIds:[],note:''}];save();go('stock',{stTab:'parts'})});await p.waitForTimeout(400);
 const keys0=await p.evaluate(()=>Object.keys(S.parts[0]).sort().join());
 if(await p.evaluate(()=>/在庫不足/.test(document.querySelector('#app').innerText)))errs.push('最初から不足の印が出ている');
 await p.click('.pqb button[aria-label="1つ出庫"]');await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({q:S.parts[0].qty,txt:document.querySelector('#app').innerText,toast:(document.querySelector('#toast')||{}).innerText||document.body.innerText}));
 if(r.q!==2)errs.push('数が減らない '+r.q);if(!/在庫不足/.test(r.txt))errs.push('不足の印が出ない');if(!/最低在庫数 2 以下/.test(r.toast))errs.push('不足の知らせが出ない');
 if(await p.evaluate(()=>Object.keys(S.parts[0]).sort().join())!==keys0)errs.push('部品の項目が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('横にはみ出す');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
