// 設備の階層（locs）の確認：階が B1F→1F→2F→10F の順・ぜんぶ たたむ/ひらく・390pxではみ出さない・「編集」が44px以上・場所の id と数は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const ids=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('l1','本館','施設',''),mk('a','A棟','建屋','l1'),mk('f10','10F','階','a'),mk('f2','2F','階','a'),mk('f1','1F','階','a'),mk('fb','B1F','階','a'),mk('r1','第1電気室','電気室','f1'),mk('b1','盤1','盤','r1')];go('locs');return S.locs.map(l=>l.id).join()});await p.waitForTimeout(300);
 const order=await p.evaluate(()=>[...document.querySelectorAll('.locn .ti')].map(x=>x.textContent.replace(/[▾▸\s]/g,'')).filter(t=>/F$/.test(t)).join());
 if(order!=='B1F,1F,2F,10F')bad.push('階の順が違う：'+order);
 const n0=await p.evaluate(()=>document.querySelectorAll('.locn').length);
 await p.click('button:has-text("ぜんぶ たたむ")');await p.waitForTimeout(200);const n1=await p.evaluate(()=>document.querySelectorAll('.locn').length);if(!(n1<n0))bad.push('たたむで減らない '+n0+'→'+n1);
 await p.click('button:has-text("ぜんぶ ひらく")');await p.waitForTimeout(200);if(await p.evaluate(()=>document.querySelectorAll('.locn').length)!==n0)bad.push('ひらくで戻らない');
 const h=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('.locn .btn')].map(x=>x.getBoundingClientRect().height)));if(h<44)bad.push('編集ボタンが小さい '+h);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(await p.evaluate(()=>S.locs.map(l=>l.id).join())!==ids)bad.push('場所の id が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
