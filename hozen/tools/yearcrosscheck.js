// 年間計画：年をまたぐとき（12月→1月）。今日が 12/28 と 1/3 のどちらでも、同じ年度（4月始まり）に ●（12月）と ◯（1月）が並び、
// 今月の列（th.cur）が正しい月で、年度を次へ送ると前の年度の印が出ず、戻すと戻る。印は年度ごと（S.marks[年度]）に保存されたまま。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [label,iso,fy,curM] of [['12/28','2026-12-28T10:00:00+09:00',2026,12],['1/3','2027-01-03T10:00:00+09:00',2026,1]]){
  const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.clock.setFixedTime(new Date(iso));
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
  // 12月（index 8）に済、1月（index 9）に ○ を入れた1項目
  await p.evaluate(`(()=>{const r=Array(12).fill('');r[8]='済';r[9]='○';S.items=[{id:'yc1',name:'年またぎ項目',cat:(S.settings.cats||[''])[0],cycle:'毎月',who:'',base:''}];S.marks={};S.marks[${fy}]={yc1:r};save();go('year')})()`);await p.waitForTimeout(400);
  const read=()=>p.evaluate(()=>{const th=document.querySelector('th.cur'),tr=[...document.querySelectorAll('table.yr tr')].find(t=>/年またぎ項目/.test(t.textContent)),tds=tr?[...tr.querySelectorAll('td.mk')].map(t=>t.textContent.trim()):null;const hd=[...document.querySelectorAll('.mnav, .card h2')].map(e=>e.textContent).join('|');return {fy:V.fy,cur:th?th.textContent.trim():'',tds,hd,sw:document.documentElement.scrollWidth}});
  let r=await read();
  if(r.fy!==fy)bad.push(label+'：開いた年度が '+r.fy+'（期待 '+fy+'）');
  if(r.cur!==curM+'月')bad.push(label+'：今月の列が '+r.cur+'（期待 '+curM+'月）');
  if(!r.tds||r.tds[8]===''||r.tds[9]!=='◯'&&r.tds[9]!=='○'&&!/◯|○/.test(r.tds[9]))bad.push(label+'：12月の済・1月の ◯ が並ばない '+JSON.stringify(r.tds));
  if(r.tds&&!/●|済/.test(r.tds[8]))bad.push(label+'：12月が ● でない '+JSON.stringify(r.tds));
  if(r.sw>392)bad.push(label+'：横にはみ出す');
  await p.evaluate(()=>{V.fy++;render()});await p.waitForTimeout(300);r=await read();
  if(r.tds&&r.tds.some(x=>x!==''&&/[●◯○済]/.test(x)))bad.push(label+'：次の年度に前の年度の印が出る '+JSON.stringify(r.tds));
  if(r.cur)bad.push(label+'：次の年度に今月の列が出る '+r.cur);
  await p.evaluate(()=>{V.fy--;render()});await p.waitForTimeout(300);r=await read();
  if(!r.tds||!/●|済/.test(r.tds[8])||!/◯|○/.test(r.tds[9]))bad.push(label+'：年度を戻すと印が戻らない '+JSON.stringify(r.tds));
  const st=await p.evaluate(()=>JSON.stringify(S.marks[2026]&&S.marks[2026].yc1));if(st!==JSON.stringify(['','','','','','','','','済','○','','']))bad.push(label+'：保存された印が変わった '+st);
  await c.close()}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
