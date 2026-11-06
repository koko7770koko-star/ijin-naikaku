// 非常用発電機の数字の入力の確認：窓（genStart）の数字欄が数字キーボード（inputmode=decimal）で、
// Enter を押すたびに次の欄へ進み（最後の欄は閉じて止まる）、入れた値が残り、保存はされず、390px で横にはみ出さないこと。
// 保存の形は変えない。usage: node hozen/tools/genentercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.equipment=S.equipment||[];S.equipment.push({id:'eqg1',name:'非常用発電機1',kind:'発電機',status:'稼働'});save();go('diag',{dgTab:'meas'})});await p.waitForTimeout(400);
 const before=await p.evaluate(()=>(S.meas||[]).length);
 await p.evaluate(()=>genStart('eqg1'));await p.waitForTimeout(500);
 const sel='#ms_rows input[data-mv]';
 const n=await p.evaluate(s=>document.querySelectorAll(s).length,sel);
 if(n<2)bad.push('数字の欄が少ない '+n);
 const modes=await p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.getAttribute('inputmode')),sel);
 modes.forEach((m,i)=>{if(m!=='decimal')bad.push(`${i+1}番目の欄に数字キーボード（inputmode=decimal）が出ない（${m}）`)});
 const vals=Array.from({length:n},(_,i)=>String(10+i));
 await p.focus(sel+':nth-of-type(1)').catch(()=>{});
 await p.evaluate(s=>document.querySelector(s).focus(),sel);
 for(let i=0;i<n;i++){
  const idx=await p.evaluate(s=>[...document.querySelectorAll(s)].indexOf(document.activeElement),sel);
  if(idx!==i){bad.push(`Enter で ${i+1} 番目の欄に進まない（今 ${idx}）`);break}
  await p.keyboard.type(vals[i]);await p.keyboard.press('Enter');await p.waitForTimeout(120);
 }
 const still=await p.evaluate(s=>[...document.querySelectorAll(s)].indexOf(document.activeElement),sel);
 if(still>=0)bad.push('最後の欄で Enter しても閉じない');
 const got=await p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.value),sel);
 if(got.join()!==vals.join())bad.push('入れた値が残らない：'+got.join(','));
 const after=await p.evaluate(()=>(S.meas||[]).length);if(after!==before)bad.push('Enter だけで保存された');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS ('+n+'欄)');await b.close();process.exit(errs.length||bad.length?1:0)})();
