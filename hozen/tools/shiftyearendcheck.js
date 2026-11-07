// 夜勤シフト表：12 月→翌年 1 月（期間 12/11〜1/10）で A/B の当番の順番が切れずに続き（12/31 と 1/1 で月ごとに計算し直しても同じ・A の 3 日後に B）、
// 元日が休日の色・平日の 12/30 は休日の色でなく、期間の見出しと提出用（A4）の見出しに正しい年が出るか。保存の形（kinmuhyo_v1）は変えない（hz-v-shift-yearend）。
// usage: node hozen/tools/shiftyearendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
 const keys0=await p.evaluate(()=>Object.keys(SHIFT.get()).sort().join(','));
 // 当番のつながり
 const r=await p.evaluate(()=>{const all=SHIFT.dayInfo('2026-12-20','2027-01-10'),a=SHIFT.dayInfo('2026-12-20','2026-12-31'),b=SHIFT.dayInfo('2027-01-01','2027-01-10');
  const out=[];const ks=Object.keys(all).sort();
  ks.forEach(k=>{const one=k<'2027'?a[k]:b[k];if(JSON.stringify(one.all)!==JSON.stringify(all[k].all))out.push('月ごとに計算すると違う '+k);if(all[k].A.length!==1||all[k].B.length!==1)out.push('A/B が1人でない '+k+' A'+all[k].A.length+' B'+all[k].B.length)});
  for(let i=0;i+3<ks.length;i++){const A=all[ks[i]].A[0],B3=all[ks[i+3]].B[0];if(A!==B3)out.push('順番が切れる '+ks[i]+' A='+A+' → '+ks[i+3]+' B='+B3)}
  const seq=ks.map(k=>all[k].A[0]);return {out,seq:seq.join(',')}});
 r.out.forEach(x=>bad.push(x));
 // 画面（期間 2026/12/11〜2027/1/10）
 await p.evaluate(()=>{const s=SHIFT.get();s.view='2027-01';SHIFT.set(s)});await p.waitForTimeout(400);
 const v=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#shTable tbody tr')];const f=t=>rows.find(x=>(x.querySelector('td.dc')||{textContent:''}).textContent.replace(/今日/,'').trim()===t);
  const r1=f('1/1'),r30=f('12/30'),r31=f('12/31');return {per:document.getElementById('periodTxt').textContent,h11:!!r1&&r1.classList.contains('hol'),h1230:!!r30&&r30.classList.contains('hol'),has31:!!r31,n:rows.length,sw:document.documentElement.scrollWidth}});
 if(!/2026\/12\/11/.test(v.per))bad.push('期間の見出し '+v.per);if(!v.has31)bad.push('12/31 の行が無い');if(!v.h11)bad.push('元日が休日の色でない');if(v.h1230)bad.push('平日の 12/30 が休日の色');if(v.n!==31)bad.push('行の数 '+v.n);if(v.sw>392)bad.push('はみ出す '+v.sw);
 // 提出用（A4）の見出し
 for(const type of ['cal','p11']){
  await p.evaluate(t=>{const s=SHIFT.get();s.sub={type:t,month:'2027-01'};SHIFT.set(s)},type);await p.click('#tabs button[data-p="sub"]');await p.waitForTimeout(700);
  const t=await p.evaluate(()=>{const sh=document.querySelector('#subSheets .sheet');return sh?sh.textContent:''});
  if(!/2027年1月/.test(t))bad.push(type+' の提出用の見出しに 2027年1月 が無い');
  if(type==='p11'&&!/12\/31|31/.test(t))bad.push('p11 に 12/31 が無い');
  await p.click('#nav button[data-v="shift"]').catch(()=>{});await p.waitForTimeout(300)}
 const keys1=await p.evaluate(()=>Object.keys(SHIFT.get()).sort().join(','));if(keys0!==keys1)bad.push('保存の項目が変わった '+keys0+' → '+keys1);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
