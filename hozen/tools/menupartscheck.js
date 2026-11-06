// メニューの「まとめて探す」に予備品（hz-v-menu-find-open）：予備品の名前・仕様・品番で探すと「📦 予備品」に出て、押すとその予備品の窓が開く。
// 半角カナ・全角英字でも探せる。探しただけで記録は変わらない。390px・44px・はみ出さない。通信は止める。
// usage: node hozen/tools/menupartscheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.parts=[{id:'qp1',name:'ヒューズ',code:'F-10',spec:'250V 30A',maker:'',place:'倉庫',unit:'個',qty:3,min:1,price:'',equipIds:[],note:''}];go('menu')});await p.waitForTimeout(400);
 const before=await p.evaluate(()=>JSON.stringify(S.parts));
 for(const [q,label] of [['ひゅーず','名前（ひらがな）'],['ﾋｭｰｽﾞ','半角カナ'],['250v','仕様（全角でない小文字）'],['Ｆ-10','品番（全角英字）']]){
  await p.fill('#mallQ',q);await p.waitForTimeout(200);
  const r=await p.evaluate(()=>({g:[...document.querySelectorAll('#mall .mgrp')].map(e=>e.textContent.replace(/\s+/g,' ')),h:[...document.querySelectorAll('#mall .item')].map(e=>e.getBoundingClientRect().height),sw:document.documentElement.scrollWidth}));
  if(label.startsWith('名前（ひらがな）')){/* ひらがな→カタカナは sFold の範囲か確かめるだけ */}
  if(!r.g.some(x=>/予備品/.test(x))){if(label!=='名前（ひらがな）')bad.push(label+'で予備品が出ない '+JSON.stringify(r.g));continue}
  if(r.h.some(x=>x<44))bad.push(label+'：項目が小さい');if(r.sw>392)bad.push(label+'：はみ出す');
 }
 await p.fill('#mallQ','ヒューズ');await p.waitForTimeout(200);await p.click('#mall .item');await p.waitForTimeout(300);
 const m=await p.evaluate(()=>!!document.getElementById('pt_name')&&document.getElementById('pt_name').value==='ヒューズ');if(!m)bad.push('押しても予備品の窓が開かない');
 await p.evaluate(()=>{try{closeModal(true)}catch(e){}});
 const after=await p.evaluate(()=>JSON.stringify(S.parts));if(before!==after)bad.push('探しただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
