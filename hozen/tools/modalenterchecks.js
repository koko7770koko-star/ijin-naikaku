// 異常・作業指示の窓：1 行の欄で Enter を押すと次の欄へ移り、最後の欄・複数行の欄では保存しない。入れた値は残り、390px で横にはみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 for(const [name,open,pre,first] of [['異常','editIssue(null)','is_','is_title'],['作業指示','editWork(null)','wk_','wk_title']]){
  await p.evaluate(open);await p.waitForSelector('#'+first,{timeout:5000});await p.waitForTimeout(300);
  const n0=await p.evaluate(()=>[S.issues.length,(S.works||[]).length].join());
  await p.focus('#'+first);await p.keyboard.type('テスト');
  const seq=[first];
  for(let i=0;i<30;i++){await p.keyboard.press('Enter');await p.waitForTimeout(40);
   const cur=await p.evaluate(()=>{const e=document.activeElement;return e&&e.id||''});
   if(!cur||cur===seq[seq.length-1]||/^(textarea)$/i.test(cur))break;seq.push(cur);
   const tag=await p.evaluate(()=>document.activeElement.tagName);if(tag==='TEXTAREA')break;}
  if(seq.length<2)bad.push(name+'：Enter で次の欄に進まない');
  const tag=await p.evaluate(()=>document.activeElement.tagName);
  if(tag==='INPUT')bad.push(name+'：最後の見える 1 行の欄の Enter で止まる（たたんだ欄へ移ろうとして焦点が外れない）');
  if(!await p.evaluate(()=>!!document.querySelector('#modal.on,#mask.on')))bad.push(name+'：Enter で窓が閉じた（保存した？）');
  const n1=await p.evaluate(()=>[S.issues.length,(S.works||[]).length].join());if(n0!==n1)bad.push(name+'：Enter で保存された');
  const v=await p.evaluate(f=>document.getElementById(f).value,first);if(v!=='テスト')bad.push(name+'：入れた値が残らない');
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(name+'：横にはみ出す '+sw);
  console.log(name,seq.join('>'),tag);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){}});await p.waitForTimeout(200);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
