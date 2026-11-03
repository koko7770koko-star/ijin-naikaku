// 夜勤は日付をまたぐ：端末の時刻を 11/4 0:30 に見立てて日常点検を開くと、「前日の夜勤なら昨日に入れる」案内が出て、ボタンで昨日（11/3）の画面に移る／
// 昼間（12時）には出ない／昨日がすでに完了なら出ない／昨日を開いているときは出ない／390pxではみ出さない・ボタン44px以上。日付を選ぶだけで保存の形は変えない。
// usage: node hozen/tools/crossdaycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const fake=iso=>`(()=>{const R=Date,T=new R('${iso}').getTime(),D0=R.now();class F extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0))}static now(){return T+(R.now()-D0)}}window.Date=F})();`;
(async()=>{const b=await chromium.launch();
 const run=async(iso,pre)=>{const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.addInitScript(fake(iso));await p.goto('file://'+FILE);await p.waitForTimeout(1500);
  if(pre)await p.evaluate(pre);await p.evaluate(()=>go('day',{day:TODAY}));await p.waitForTimeout(300);return {p,c,errs}};
 let {p,c,errs}=await run('2026-11-04T00:30:00+09:00');
 const info=await p.evaluate(()=>{const e=document.getElementById('dayCross');if(!e)return null;const bt=e.querySelector('button').getBoundingClientRect();return {td:TODAY,h:bt.height,r:bt.right,sw:document.documentElement.scrollWidth,t:e.textContent}});
 if(!info)bad.push('0:30 に案内が出ない');else{if(info.td!=='2026-11-04')bad.push('見立てた日付 '+info.td);if(info.h<44||info.r>390||info.sw>392)bad.push('大きさ/はみ出し '+JSON.stringify(info));if(!info.t.includes('11/3'))bad.push('昨日の日付が出ない '+info.t)}
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.click('#dayCross button');await p.waitForTimeout(300);
 const v=await p.evaluate(()=>({day:V.day,again:!!document.getElementById('dayCross')}));if(v.day!=='2026-11-03')bad.push('昨日に移らない '+v.day);if(v.again)bad.push('昨日を開いているのに案内が出る');
 errs.forEach(e=>bad.push(e));await c.close();
 // 昼間は出ない
 ({p,c,errs}=await run('2026-11-04T12:00:00+09:00'));if(await p.evaluate(()=>!!document.getElementById('dayCross')))bad.push('昼間に出ている');await c.close();
 // 昨日がすでに完了なら出ない
 ({p,c,errs}=await run('2026-11-04T00:30:00+09:00',()=>{S.daily['2026-11-03']={done:new Date().toISOString()};save()}));await p.evaluate(()=>{S.daily['2026-11-03']={done:new Date().toISOString(),c:{}};save();go('day',{day:TODAY})});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!!document.getElementById('dayCross')))bad.push('昨日が完了でも出る');await c.close();
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
