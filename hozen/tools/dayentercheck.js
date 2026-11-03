// 日常点検の数字欄の確認：数字を入れて Enter を押すたびに次の欄へ進み（最後の欄は閉じて止まる）、入れた値が全部残り、
// 最後の欄以外は enterkeyhint="next"・最後は "done"、390px で横にはみ出さないこと。保存の形は変えない。
// usage: node hozen/tools/dayentercheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{go('day')});await p.waitForTimeout(500);
 const ids=await p.evaluate(()=>[...document.querySelectorAll('input[id^="n_"]')].map(e=>e.id));
 if(ids.length<2)bad.push('数字の欄が少ない '+ids.length);
 const hints=await p.evaluate(()=>[...document.querySelectorAll('input[id^="n_"]')].map(e=>e.getAttribute('enterkeyhint')));
 hints.forEach((h,i)=>{const w=i<hints.length-1?'next':'done';if(h!==w)bad.push(`${i+1}番目の enterkeyhint が ${h}（本来 ${w}）`)});
 const vals=ids.map((_,i)=>String(10+i));
 await p.focus('#'+ids[0]);
 for(let i=0;i<ids.length;i++){
  const cur=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
  if(cur!==ids[i]){bad.push(`Enter で ${i+1} 番目の欄に進まない（今 ${cur}）`);break}
  await p.keyboard.type(vals[i]);await p.keyboard.press('Enter');await p.waitForTimeout(80);
 }
 const last=await p.evaluate(()=>document.activeElement&&document.activeElement.tagName);
 if(last==='INPUT'&&(await p.evaluate(()=>document.activeElement.id.startsWith('n_'))))bad.push('最後の欄で Enter しても閉じない');
 const got=await p.evaluate(ids=>ids.map(i=>document.getElementById(i).value),ids);
 if(got.join()!==vals.join())bad.push('入れた値が残らない：'+got.join(','));
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS ('+ids.length+'欄)');await b.close();process.exit(errs.length||bad.length?1:0)})();
