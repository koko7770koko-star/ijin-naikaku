// 盤の点検の進み：棟・階の見出しに「済み項目／全項目（済んだ盤／全盤 面）」、棟の上に「次の未点検へ」。
// A〜F棟×各階の盤で半分だけ ● にして、押すと未点検の盤へ動き（棟をまたぐ）、全部済めば案内が出る。保存の形は変えない。390px で 44px・はみ出し無し。
// usage: node hozen/tools/banprogresscheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});const L=[];
  'AB'.split('').forEach(x=>{L.push(mk('b'+x,x+'棟','建屋',''));[1,2,3].forEach(f=>{L.push(mk('f'+x+f,f+'F','階','b'+x));[1,2,3,4].forEach(n=>L.push(mk('p'+x+f+n,'盤'+f+'-'+n,'盤','f'+x+f)))})});
  S.locs=L;const ym=TODAY.slice(0,7);S.banChk={};S.banChk[ym]={};
  // A棟：1F・2F の盤を全部 ●、3F は未点検。B棟：全部未点検
  [1,2].forEach(f=>[1,2,3,4].forEach(n=>S.banChk[ym]['pA'+f+n]=['済','済','済']));
  S.banChk[ym]['pA33']=['済','',''];
  V.banB='bA';go('ban')});await p.waitForTimeout(300);
 const t=await p.evaluate(()=>document.querySelector('#app').innerText);
 if(!/25\/36/.test(t.replace(/\s/g,'')))bad.push('A棟の項目数が見出しに無い');
 if(!/8\/12面が完了/.test(t)||!/1\/12（0\/4面）/.test(t))bad.push('A棟の面の数が見出しに無い '+t.slice(0,200));
 const sm=await p.evaluate(()=>[...document.querySelectorAll('#app button')].filter(x=>x.textContent.includes('次の未点検')).map(x=>x.getBoundingClientRect().height));
 if(sm.length!==1)bad.push('次の未点検ボタンが '+sm.length);else if(sm[0]<44)bad.push('ボタンが低い '+sm[0]);
 await p.click('button:has-text("次の未点検")');await p.waitForTimeout(700);
 let f=await p.evaluate(()=>{const e=document.querySelector('.banrow.flash');return e?e.id:''});if(f!=='ban-pA31')bad.push('A棟の最初の未点検は 3F の盤3-1（'+f+'）');
 // A棟を全部 ● にすると B 棟へ移る
 await p.evaluate(()=>{const ym=TODAY.slice(0,7);[1,2,3].forEach(f=>[1,2,3,4].forEach(n=>S.banChk[ym]['pA'+f+n]=['済','済','済']));render()});
 await p.click('button:has-text("次の未点検")');await p.waitForTimeout(700);
 const vb=await p.evaluate(()=>V.banB);if(vb!=='bB')bad.push('B棟へ移らない '+vb);
 f=await p.evaluate(()=>{const e=document.querySelector('.banrow.flash');return e?e.id:''});if(!/^ban-pB/.test(f))bad.push('B棟の未点検が光らない '+f);
 // 全部済み → 案内
 await p.evaluate(()=>{const ym=TODAY.slice(0,7);['A','B'].forEach(x=>[1,2,3].forEach(f=>[1,2,3,4].forEach(n=>S.banChk[ym]['p'+x+f+n]=['済','済','延'])));render()});
 await p.click('button:has-text("次の未点検")');await p.waitForTimeout(300);
 if(!/すべて/.test(await p.evaluate(()=>document.querySelector('.toast,#toast')?.textContent||'')))bad.push('全部済みの案内が出ない');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
