// 管理値が空のひな形の測定入力：「ひな形で入れる」札を押すとひな形の編集が開き、閉じる・保存すると入力した値が残ったまま戻る。ひな形が無い行は案内の1行。保存の形は変えない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{addGenTpl();S.equipment.push({id:'eqG1',name:'発電機試験',kind:'発電機',status:'稼働',locId:'',place:''});go('diag',{dgTab:'meas'});genStart('eqG1')});await p.waitForTimeout(400);
 const inp='#ms_rows .mrow:first-child input[data-mv]';
 await p.fill(inp,'123');await p.fill('#ms_note','メモ試験');
 const btn='#ms_rows .mrow:first-child button.mlim';
 if(!await p.$(btn))bad.push('札が出ない');
 else{
  const h=await p.evaluate(s=>document.querySelector(s).getBoundingClientRect().height,btn);if(h<43)bad.push('札が44px未満 '+h);
  await p.click(btn);await p.waitForTimeout(300);
  if(!await p.$('#mt_rows'))bad.push('ひな形の編集が開かない');
  // 閉じる（キャンセル）→ 戻る
  await p.evaluate(()=>closeModal(true));await p.waitForTimeout(300);
  let s=await p.evaluate(()=>({v:(document.querySelector('#ms_rows .mrow:first-child input[data-mv]')||{}).value,n:(document.querySelector('#ms_note')||{}).value}));
  if(s.v!=='123'||s.n!=='メモ試験')bad.push('閉じて戻ると入力が消えた '+JSON.stringify(s));
  // 管理値を入れて保存 → 戻る・行に管理値が入る
  await p.click(btn);await p.waitForTimeout(300);
  await p.evaluate(()=>{MT_ROWS[0].min=100;MT_ROWS[0].max=150;saveMtpl('mt_gen')});await p.waitForTimeout(300);
  s=await p.evaluate(()=>{const r=document.querySelector('#ms_rows .mrow:first-child');return {v:r.querySelector('input[data-mv]').value,pill:r.querySelector('.pill').textContent,n:document.querySelector('#ms_note').value,btn:!!r.querySelector('button.mlim')}});
  if(s.v!=='123'||s.n!=='メモ試験')bad.push('保存して戻ると入力が消えた '+JSON.stringify(s));
  if(!/^管理値内/.test(s.pill)||s.btn)bad.push('戻ったあと管理値が反映されない '+JSON.stringify(s));
 }
 // ひな形なし（自由入力）の行は案内の1行
 await p.evaluate(()=>{closeModal(true);editMeas(null,{rows:[{name:'電圧',unit:'V',min:'',max:'',ck:false,v:''}]})});await p.waitForTimeout(300);
 const g=await p.evaluate(()=>({btn:!!document.querySelector('#ms_rows button.mlim'),t:(document.querySelector('#ms_rows .muted.mlim')||{}).textContent||''}));
 if(g.btn||!/下限・上限/.test(g.t))bad.push('自由入力の案内が出ない '+JSON.stringify(g));
 // 保存の形
 await p.evaluate(()=>{closeModal(true);editMeas(null,{equipId:'eqG1',tplId:'mt_gen',rows:tplById('mt_gen').rows.map(r=>({...r,v:''}))})});await p.waitForTimeout(300);
 await p.fill('#ms_rows .mrow:first-child input[data-mv]','120');await p.fill('#ms_by','試験');await p.evaluate(()=>saveMeas(''));await p.waitForTimeout(200);
 const k=await p.evaluate(()=>{const m=S.meas.slice(-1)[0];return m&&Object.keys(m.rows[0]).sort().join()});
 if(!k||!/ck,max,min,name,photo,src,unit,v/.test(k))bad.push('保存の形が変わった '+k);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
