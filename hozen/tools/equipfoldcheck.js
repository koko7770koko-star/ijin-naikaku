// 設備台帳：絞り込みは最初は畳まれ、押すと開く・指定中は開いたまま件数を出す・44px・390pxではみ出さない・QR/階層は畳まない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{V.eqKind='';V.eqImp='';V.eqLoc='';V.eqAll=false;V.eqFo=false;go('equip')});await p.waitForTimeout(300);
 const st=()=>p.evaluate(()=>{const bt=document.getElementById('eqFoBtn');const r=bt&&bt.getBoundingClientRect();return{btn:!!bt,h:r&&r.height,f:!!document.querySelector('.eqf'),qr:[...document.querySelectorAll('#app button')].some(x=>x.textContent.includes('QR')),sw:document.documentElement.scrollWidth}});
 let s=await st();if(!s.btn)bad.push('絞り込みボタンが無い');if(s.f)bad.push('最初から開いている');if(!s.qr)bad.push('QRが畳まれた');if(s.h<44)bad.push('小さい '+s.h);if(s.sw>392)bad.push('はみ出す');
 await p.click('#eqFoBtn');await p.waitForTimeout(200);s=await st();if(!s.f)bad.push('押しても開かない');if(s.sw>392)bad.push('開いてはみ出す');
 await p.click('#eqFoBtn');await p.waitForTimeout(200);s=await st();if(s.f)bad.push('もう一度押しても畳まれない');
 await p.evaluate(()=>{V.eqImp='A';render()});await p.waitForTimeout(200);s=await st();if(!s.f)bad.push('指定中なのに畳まれた');
 if(!(await p.evaluate(()=>document.getElementById('eqFoBtn').textContent.includes('絞り込み 1'))))bad.push('指定数が出ない');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
