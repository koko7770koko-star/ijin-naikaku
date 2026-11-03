// QRラベルの印刷表示：設備40台（長い名前を含む）で、ラベルが枠からはみ出さない・ページの境で割れない設定・QRが20mm以上で読める大きさ。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.equipment=Array.from({length:40},(_,i)=>({id:'eq'+i,code:'E-'+String(i+1).padStart(3,'0'),name:i%5===0?'非常用発電機設備の長い名前テスト用ABCDEFGHIJKLMN':'設備'+(i+1),locId:'',status:'稼働',run:{meters:[]}}));go('qr')});
 await p.waitForTimeout(300);await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const L=[...document.querySelectorAll('.qrl')];const sh=document.querySelector('.qrsheet').getBoundingClientRect();
  const over=L.filter(l=>{const lr=l.getBoundingClientRect();return [...l.querySelectorAll('.qrt,.qrt *')].some(x=>x.getBoundingClientRect().right>lr.right+1)||lr.right>sh.right+1}).length;
  const q=document.querySelector('.qri').getBoundingClientRect().width/96*25.4;
  return{n:L.length,over,qmm:q,avoid:getComputedStyle(L[0]).breakInside,sw:document.documentElement.scrollWidth}});
 if(r.n!==40)bad.push('ラベル数 '+r.n);if(r.over)bad.push('枠をはみ出すラベル '+r.over);if(r.qmm<20)bad.push('QRが小さい '+r.qmm.toFixed(1)+'mm');if(r.avoid!=='avoid')bad.push('ラベルがページの境で割れる設定');if(r.sw>800)bad.push('横にはみ出す '+r.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
