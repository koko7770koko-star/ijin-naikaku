// カレンダー（月）：12 月→翌年 1 月→（うるう年の）2 月で、見出しの年月・前後の月の灰色の日の予定（同じ月日の別の年の予定を出さない）・勤務者（シフト表と同じ）・元日の「祝」が正しいか。
// A4 縦の印刷（monthPrintHTML）にも正しい年と元日の予定が出るか。表示だけで記録は変えない（hz-v-cal-yearend）。
// usage: node hozen/tools/calyearendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=(id,date,title)=>({id,date,time:'',kind:'月次',cat:'',title,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});
  S.tasks=[T('y1','2027-01-01','元日の点検Q'),T('y0','2026-01-01','去年の元日の点検'),T('y2','2026-12-31','大みそかの点検R'),T('y3','2025-12-31','前の年の大みそか'),T('y4','2028-02-29','うるう日の点検L'),T('y5','2027-02-28','前の年の2月末')];save()});
 const before=await p.evaluate(()=>JSON.stringify(S.tasks));
 const cell=(s)=>p.evaluate(s=>{const e=[...document.querySelectorAll('#app .cal .d')].find(x=>(x.getAttribute('onclick')||'').includes("'"+s+"'"));if(!e)return null;
  return {t:e.textContent,o:e.classList.contains('o'),hol:/祝/.test((e.querySelector('.n')||{textContent:''}).textContent),crew:[...e.querySelectorAll('.w.a,.w.b')].map(x=>x.textContent).join(',')}},s);
 const head=()=>p.evaluate(()=>(document.querySelector('#app .mnav .t')||{textContent:''}).textContent.trim());
 await p.evaluate(()=>{S.settings.showCrew=true;V.y=2026;V.m=12;V.sel='2026-12-15';go('month')});await p.waitForTimeout(250);
 let h=await head();if(!/2026年\s*12月/.test(h))bad.push('12 月の見出し '+h);
 let x=await cell('2027-01-01');if(!x)bad.push('12 月に灰色の 1/1 が無い');else{if(!x.o)bad.push('1/1 が灰色でない');if(!/元日の点検Q/.test(x.t)||/去年の元日/.test(x.t))bad.push('灰色の 1/1 の予定が違う：'+x.t);if(!x.hol)bad.push('灰色の 1/1 に祝が無い')}
 x=await cell('2026-12-31');if(!x||!/大みそかの点検R/.test(x.t)||/前の年の大みそか/.test(x.t))bad.push('12/31 の予定が違う：'+(x&&x.t));
 const crewOk=async s=>{const want=await p.evaluate(s=>{const o=crewDay(s);return o?[...o.A,...o.B].map(sn).join(','):''},s);const got=(await cell(s)||{}).crew;if(want!==got)bad.push(s+' の勤務者が違う '+got+' / '+want)};
 await crewOk('2026-12-31');await crewOk('2027-01-01');
 await p.evaluate(()=>document.querySelectorAll('#app .mnav button')[1].click());await p.waitForTimeout(250);
 h=await head();if(!/2027年\s*1月/.test(h))bad.push('次の月の見出し '+h);
 x=await cell('2026-12-31');if(!x)bad.push('1 月に灰色の 12/31 が無い');else{if(!x.o)bad.push('12/31 が灰色でない');if(!/大みそかの点検R/.test(x.t)||/前の年の大みそか/.test(x.t))bad.push('灰色の 12/31 の予定が違う：'+x.t)}
 x=await cell('2027-01-01');if(!x||x.o||!x.hol||!/元日の点検Q/.test(x.t))bad.push('1 月の 1/1 が違う：'+JSON.stringify(x));
 await crewOk('2026-12-31');await crewOk('2027-01-01');
 const pr=await p.evaluate(()=>monthPrintHTML(2027,1));if(!/2027/.test(pr))bad.push('印刷に 2027 が無い');if(!/元日の点検Q/.test(pr))bad.push('印刷に元日の予定が無い');if(/去年の元日の点検/.test(pr))bad.push('印刷に去年の元日の予定が出る');
 // うるう年の 2 月
 await p.evaluate(()=>{V.y=2028;V.m=2;V.sel='2028-02-10';render()});await p.waitForTimeout(250);
 x=await cell('2028-02-29');if(!x||x.o||!/うるう日の点検L/.test(x.t))bad.push('2028/2/29 が違う：'+JSON.stringify(x));
 const n=await p.evaluate(()=>[...document.querySelectorAll('#app .cal .d:not(.o)')].length);if(n!==29)bad.push('2028 年 2 月の日数 '+n);
 await p.evaluate(()=>{V.y=2027;V.m=2;render()});await p.waitForTimeout(200);
 const n2=await p.evaluate(()=>[...document.querySelectorAll('#app .cal .d:not(.o)')].length);if(n2!==28)bad.push('2027 年 2 月の日数 '+n2);
 x=await cell('2027-02-28');if(!x||!/前の年の2月末/.test(x.t))bad.push('2027/2/28 が違う');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('はみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify(S.tasks));if(after!==before)bad.push('見ただけで予定が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
