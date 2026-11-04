// シフト表の見出しの資格期限の警告（hz-shift-qual-warn）：期限が60日以内・切れた人の名前にだけ ⚠ を1字足す。見出しの高さは変えない・印刷では出さない・390px ではみ出さない。記録は読むだけ。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0&&window.SHIFT,null,{timeout:15000});
 await p.evaluate(()=>{closeModal(true);go('shift')});await p.waitForTimeout(400);
 const mem=await p.evaluate(()=>SHIFT.members());
 if(mem.length<3){bad.push('メンバーが3人未満（確かめの前提）')}else{
  const h0=await p.evaluate(()=>document.querySelector('#shTable thead tr').getBoundingClientRect().height);
  if(await p.evaluate(()=>document.querySelectorAll('#shTable thead .qw').length))bad.push('資格を登録していないのに ⚠ が出る');
  const day=n=>p.evaluate(n=>{const d=new Date(Date.now()+9*3600e3+n*864e5);return d.toISOString().slice(0,10)},n);
  const d30=await day(30),dOld=await day(-3),d200=await day(200);
  await p.evaluate(([m,a,b,c,d30,dOld,d200])=>{S.quals[a]=['第三種電気主任技術者'];S.quals[b]=['危険物'];S.quals[c]=['電気工事士'];S.qualExp={};S.qualExp[a]={'第三種電気主任技術者':d30};S.qualExp[b]={'危険物':dOld};S.qualExp[c]={'電気工事士':d200};go('home');go('shift')},[mem,mem[0],mem[1],mem[2],d30,dOld,d200]);
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>[...document.querySelectorAll('#shTable thead button.qn')].map(x=>({n:x.dataset.qn,w:!!x.querySelector('.qw'),t:(x.querySelector('.qw')||{}).title||'',h:x.getBoundingClientRect().height})));
  if(!r[0]||!r[0].w||!/あと\d+日/.test(r[0].t))bad.push('期限30日後の人に ⚠ が出ない '+JSON.stringify(r[0]));
  if(!r[1]||!r[1].w||!/期限切れ/.test(r[1].t))bad.push('期限切れの人に ⚠ が出ない '+JSON.stringify(r[1]));
  if(r[2]&&r[2].w)bad.push('期限200日後の人に ⚠ が出る');
  if(r.slice(3).some(x=>x.w))bad.push('資格の無い人に ⚠ が出る');
  const h1=await p.evaluate(()=>document.querySelector('#shTable thead tr').getBoundingClientRect().height);if(Math.abs(h1-h0)>0.5)bad.push('見出しの高さが変わった '+h0+'→'+h1);
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>[...document.querySelectorAll('#shTable thead .qw')].filter(e=>getComputedStyle(e).display!=='none').length);if(pr)bad.push('印刷に ⚠ が残る '+pr);await p.emulateMedia({media:'screen'});
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
