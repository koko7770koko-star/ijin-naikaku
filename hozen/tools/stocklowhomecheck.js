// 予備品：在庫が最低在庫数以下の物があるとき、ホームのお知らせから「少ない物だけ」の一覧に行け（1品目ならその品の窓も開く）、「すべて」に戻せる（390px・保存の形は変えない）
// usage: node hozen/tools/stocklowhomecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,n,q,m)=>({id,code:'',name:n,spec:'',maker:'',place:'',unit:'個',qty:q,min:m,price:'',equipIds:[],note:''});S.parts=[mk('p1','ヒューズ少',1,2),mk('p2','ランプ十分',9,2),mk('p3','最低未設定',0,'')];save();go('home')});await p.waitForTimeout(500);
 const keys0=await p.evaluate(()=>Object.keys(S.parts[0]).sort().join());
 const hasNote=await p.evaluate(()=>/在庫不足 1品目/.test(document.querySelector('#app').innerText));if(!hasNote)errs.push('ホームに「在庫不足 1品目」が出ない');
 await p.evaluate(()=>{const e=[...document.querySelectorAll('#app [onclick]')].find(x=>/在庫不足/.test(x.innerText)&&/stTab/.test(x.getAttribute('onclick')));if(e)e.click();else window.__nf=1});await p.waitForTimeout(400);
 if(await p.evaluate(()=>window.__nf))errs.push('ホームの在庫不足の行が押せない');
 if(!await p.evaluate(()=>{const i=document.getElementById('pt_name');return !!(i&&i.offsetParent!==null&&i.value==='ヒューズ少')}))errs.push('1品目の在庫不足を押してもその品の窓が開かない（hz-v-alert-open-part）');
 await p.evaluate(()=>{try{closeModal(true)}catch(e){}});await p.waitForTimeout(300);
 let t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/ヒューズ少/.test(t)||/ランプ十分/.test(t))errs.push('少ない物だけになっていない');
 await p.click('button:has-text("すべての予備品を見る")');await p.waitForTimeout(300);
 t=await p.evaluate(()=>document.querySelector('#app').innerText);if(!/ランプ十分/.test(t))errs.push('すべてに戻らない');
 await p.click('button:has-text("少ない物だけ見る")');await p.waitForTimeout(300);
 t=await p.evaluate(()=>document.querySelector('#app').innerText);if(/ランプ十分/.test(t))errs.push('切り替えで絞れない');
 await p.evaluate(()=>go('stock',{stTab:'parts',ptLow:0}));await p.waitForTimeout(300);
 t=await p.evaluate(()=>document.querySelector('#app').innerText);if(!/ランプ十分/.test(t))errs.push('メニューからは全部出るはず');
 if(await p.evaluate(()=>Object.keys(S.parts[0]).sort().join())!==keys0)errs.push('部品の項目が変わった');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))errs.push('横にはみ出す');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
