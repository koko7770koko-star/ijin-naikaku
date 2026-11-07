// 月報・年報：12 月・1 月・3 月（年度末）・4 月の月報に、その月の予定・異常だけが入り（隣の月・別の年のものは当月の欄に入らない。次の月の予定は「6. 来月の主な予定」にだけ出る）、対象期間の見出しの年が正しく、
// 年報は 4 月はじまりの年度で 3/31 の異常は前の年度・4/1 は新しい年度に入り、見出しの年度が正しいか。印刷（A4）でも同じ。記録は変えない（hz-v-monthly-yearend）。
// usage: node hozen/tools/reportyearendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=(id,date,title)=>({id,date,time:'',kind:'月次',cat:'',title,place:'',staff:'',attend:'',status:'完了',result:'',note:'',photos:[]});
  S.tasks=[T('r1','2025-12-31','大みそかの点検Ａ'),T('r2','2026-01-01','元日の点検Ｂ'),T('r3','2026-03-31','三月末の点検Ｃ'),T('r4','2026-04-01','四月始めの点検Ｄ'),T('r5','2024-12-31','前の年の大みそかＥ')];
  S.issues=[{id:'ri1',date:'2026-03-31',closed:'2026-03-31',title:'年度末の異常Ｆ',place:'',status:'完了',action:'',detail:''},{id:'ri2',date:'2026-04-01',closed:'',title:'年度始めの異常Ｇ',place:'',status:'対応中',action:'',detail:''},
   {id:'ri3',date:'2025-12-31',closed:'2025-12-31',title:'大みそかの異常Ｈ',place:'',status:'完了',action:'',detail:''}];save()});
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify([S.tasks,S.issues]));
 const show=async(set)=>{await p.evaluate(set);await p.waitForTimeout(200);return p.evaluate(()=>document.querySelector('#app').textContent)};
 const has=(t,w,no,tag,nx)=>{const i=t.search(/6\. 来月（\d+月）の主な予定/),cur=i>=0?t.slice(0,i):t,next=i>=0?t.slice(i):'';w.forEach(x=>{if(!t.includes(x))bad.push(tag+'：'+x+' が無い')});no.forEach(x=>{if(cur.includes(x))bad.push(tag+'：'+x+' が当月に入っている')});(nx||[]).forEach(x=>{if(!next.includes(x))bad.push(tag+'：来月の予定に '+x+' が無い')})};
 let t=await show(()=>{V.rmode='m';V.ry=2025;V.rm=12;go('report')});has(t,['2025/12/1 ～ 2025/12/31','大みそかの点検Ａ','大みそかの異常Ｈ'],['元日の点検Ｂ','前の年の大みそかＥ'],'2025年12月の月報',['元日の点検Ｂ','1/1']);
 t=await show(()=>{V.ry=2026;V.rm=1;render()});has(t,['2026/1/1 ～ 2026/1/31','元日の点検Ｂ'],['大みそかの点検Ａ','大みそかの異常Ｈ'],'2026年1月の月報');
 t=await show(()=>{V.ry=2026;V.rm=3;render()});has(t,['2026/3/1 ～ 2026/3/31','三月末の点検Ｃ','年度末の異常Ｆ'],['四月始めの点検Ｄ','年度始めの異常Ｇ'],'2026年3月の月報',['四月始めの点検Ｄ','4/1']);
 t=await show(()=>{V.ry=2026;V.rm=4;render()});has(t,['2026/4/1 ～ 2026/4/30','四月始めの点検Ｄ','年度始めの異常Ｇ'],['三月末の点検Ｃ','年度末の異常Ｆ'],'2026年4月の月報');
 t=await show(()=>{V.rmode='y';V.rfy=2025;render()});has(t,['2025年度','2025/4/1 ～ 2026/3/31','年度末の異常Ｆ','大みそかの異常Ｈ'],['年度始めの異常Ｇ'],'2025年度の年報');
 t=await show(()=>{V.rfy=2026;render()});has(t,['2026年度','2026/4/1 ～ 2027/3/31','年度始めの異常Ｇ'],['年度末の異常Ｆ','大みそかの異常Ｈ'],'2026年度の年報');
 const ann=await p.evaluate(()=>{const o={};[2025,2026].forEach(fy=>{o[fy]=MONTHS.map(m=>{const y=m>=4?fy:fy+1;return monthStats(y,m).ts.length}).reduce((a,b)=>a+b,0)});return o});
 if(ann[2025]!==3)bad.push('2025年度の予定の数 '+ann[2025]+'（3 のはず）');if(ann[2026]!==1)bad.push('2026年度の予定の数 '+ann[2026]+'（1 のはず）');
 // 印刷（3 月の月報）
 await p.evaluate(()=>{V.rmode='m';V.ry=2026;V.rm=3;render()});await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const pt=await p.evaluate(()=>[...document.querySelectorAll('#app *')].filter(e=>e.offsetParent!==null&&e.children.length===0).map(e=>e.textContent).join(''));await p.emulateMedia({media:'screen'});
 has(pt,['2026/3/1 ～ 2026/3/31','三月末の点検Ｃ'],['四月始めの点検Ｄ'],'3月の月報の印刷',['四月始めの点検Ｄ']);
 const after=await p.evaluate(()=>JSON.stringify([S.tasks,S.issues]));if(after!==before)bad.push('見ただけで記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
