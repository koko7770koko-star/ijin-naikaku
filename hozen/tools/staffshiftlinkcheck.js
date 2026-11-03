// 人員とシフト表の行き来（hz-staff-shift-link）：人員の一覧に その人の今月の勤務（夜勤・日勤・休みの日数）、押すと開く資格の窓に
//  今月の勤務日（日付と A/B夜勤・日勤）と「シフト表を開く」（44px）。シフト表のメンバーでない人には出さない。シフト表（kinmuhyo_v1）は読むだけ。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0&&window.SHIFT,null,{timeout:15000});
 await p.evaluate(()=>{closeModal(true);go('shift')});await p.waitForTimeout(300);// 初めて開くとシフト表は初期値を保存する（ふだんの動き）。その後を基準にする
 const before=await p.evaluate(()=>{closeModal(true);S.settings.staff=[...new Set([...(S.settings.staff||[]),'外部の担当'])];go('staff');return [localStorage.getItem('kinmuhyo_v1'),JSON.stringify(S.quals)]});
 await p.waitForTimeout(150);
 const nm=await p.evaluate(()=>SHIFT.members().find(n=>{const L=staffMonth(n);return L.some(x=>/夜勤/.test(x.v))}));
 if(!nm){bad.push('今月 夜勤のあるメンバーがいない（確かめの前提）');}
 else{
  const row=await p.evaluate(n=>{const it=[...document.querySelectorAll('#app .item')].find(e=>e.querySelector('.ti')&&e.querySelector('.ti').textContent===n);return it?(it.querySelector('.stsum')||{}).textContent||'':null},nm);
  if(row===null)bad.push('人員にシフトのメンバーが出ない');else if(!/今月：.*夜勤 \d+日/.test(row))bad.push('一覧に今月の勤務の日数が無い '+row);
  const exp=await p.evaluate(n=>staffMonth(n).filter(x=>/夜勤/.test(x.v)).length,nm);
  const cnt=await p.evaluate(n=>{const L=Object.entries(SHIFT.dayInfo(TODAY.slice(0,8)+'01',TODAY.slice(0,8)+'28'));return L.filter(([d,o])=>o.A.includes(n)||o.B.includes(n)).length},nm);
  if(exp<cnt)bad.push('夜勤の日数がシフト表と合わない '+exp+' '+cnt);
  await p.evaluate(n=>editQual(n),nm);await p.waitForSelector('#modal .stmon');
  const md=await p.evaluate(()=>({tags:document.querySelectorAll('#modal .stmon .tag').length,txt:document.querySelector('#modal .stmon').innerText,h:[...document.querySelectorAll('#modal .stmon button')].map(x=>x.getBoundingClientRect().height)}));
  if(!md.tags)bad.push('窓に勤務日が無い');if(!/夜勤/.test(md.txt))bad.push('窓に夜勤の印が無い '+md.txt.slice(0,60));if(!md.h.length||md.h[0]<44)bad.push('シフト表を開くが44px未満');
  await p.click('#modal .stmon button');await p.waitForTimeout(200);
  const st=await p.evaluate(()=>({v:V.view,mask:document.querySelector('#mask').classList.contains('on')}));if(st.v!=='shift'||st.mask)bad.push('シフト表へ飛ばない '+JSON.stringify(st));
  await p.goBack();await p.waitForTimeout(200);if(await p.evaluate(()=>V.view)!=='staff')bad.push('戻るで人員に戻らない');
 }
 // シフト表のメンバーでない人
 const ext=await p.evaluate(()=>{const it=[...document.querySelectorAll('#app .item')].find(e=>e.querySelector('.ti')&&e.querySelector('.ti').textContent==='外部の担当');return it?!!it.querySelector('.stsum'):null});
 if(ext===null)bad.push('設定の担当者が出ない');else if(ext)bad.push('シフトに居ない人に勤務の日数が出る');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 const after=await p.evaluate(()=>[localStorage.getItem('kinmuhyo_v1'),JSON.stringify(S.quals)]);if(after[0]!==before[0])bad.push('シフト表の記録が変わった');if(after[1]!==before[1])bad.push('資格の記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
