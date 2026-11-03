// 点検履歴：期間をボタン（今月・先月・30日・3か月・1年・全期間・日付を指定）で選べる／今月は1日〜今日・先月は1日〜末日／
// 「異常だけ」はボタンで切り替わる／日付欄は「日付を指定」のときだけ出る／390pxではみ出さない・ボタン44px以上。画面だけの状態で保存の形は変えない。
// usage: node hozen/tools/histrangecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{const n=numDefs()[0];n.min=5;n.max=50;const f=addM(TODAY.slice(0,7)+'-01',-1);
  [TODAY.slice(0,7)+'-01',TODAY,f,f.slice(0,7)+'-'+pad(lastDayOf(+f.slice(0,4),+f.slice(5,7))),addM(TODAY.slice(0,7)+'-01',-2)].forEach((d,i)=>{S.daily[d]=S.daily[d]||{};S.daily[d][n.id]=i===1?999:10;S.daily[d].done=new Date().toISOString()});
  V.hRange='30';V.hNg=false;V.hItem='';V.hKw='';save();go('hist')});await p.waitForTimeout(300);
 const btns=await p.evaluate(()=>[...document.querySelectorAll('#hRangeBtns button')].map(x=>{const r=x.getBoundingClientRect();return {t:x.textContent,h:r.height,r:r.right,on:x.getAttribute('aria-pressed')}}));
 if(btns.map(x=>x.t).join()!=='今月,先月,30日,3か月,1年,全期間,日付を指定')bad.push('ボタン '+btns.map(x=>x.t).join());
 btns.forEach(x=>{if(x.h<44||x.r>390)bad.push('ボタンの大きさ '+JSON.stringify(x))});
 if(btns.find(x=>x.t==='30日').on!=='true')bad.push('30日が選ばれた印にならない');
 const rng=()=>p.evaluate(()=>histRange().join('〜'));
 const first=await p.evaluate(()=>TODAY.slice(0,7)+'-01'),now=await p.evaluate(()=>TODAY);
 await p.click('#hRangeBtns button:nth-child(1)');await p.waitForTimeout(150);if(await rng()!==first+'〜'+now)bad.push('今月 '+await rng());
 const rows0=await p.evaluate(()=>histRows().length);if(rows0<1)bad.push('今月の行が出ない');
 await p.click('#hRangeBtns button:nth-child(2)');await p.waitForTimeout(150);
 const r1=await p.evaluate(()=>{const [f,t]=histRange();return {f,t,n:histRows().length,okF:f.endsWith('-01'),prevOk:f.slice(0,7)===addM(TODAY.slice(0,7)+'-01',-1).slice(0,7)&&t.slice(0,7)===f.slice(0,7)}});
 if(!r1.okF||!r1.prevOk||r1.n!==2)bad.push('先月 '+JSON.stringify(r1));
 await p.click('#hRangeBtns button:nth-child(5)');await p.waitForTimeout(150);const y=await p.evaluate(()=>histRows().length);if(y!==5)bad.push('1年 '+y);
 // 日付欄は「日付を指定」のときだけ
 if(await p.evaluate(()=>document.querySelectorAll('#app input[type=date]').length))bad.push('指定でないのに日付欄が出る');
 await p.click('#hRangeBtns button:nth-child(7)');await p.waitForTimeout(150);if(await p.evaluate(()=>document.querySelectorAll('#app input[type=date]').length)!==2)bad.push('日付を指定で日付欄が出ない');
 // 異常だけ
 await p.click('#hRangeBtns button:nth-child(1)');await p.waitForTimeout(100);
 const all=await p.evaluate(()=>histRows().length);await p.click('#hNgBtn');await p.waitForTimeout(150);
 const ng=await p.evaluate(()=>({n:histRows().length,on:V.hNg,p:document.querySelector('#hNgBtn').getAttribute('aria-pressed'),h:document.querySelector('#hNgBtn').getBoundingClientRect().height}));
 if(!ng.on||ng.p!=='true'||ng.n>=all||ng.n<1)bad.push('異常だけ '+JSON.stringify([all,ng]));if(ng.h<44)bad.push('異常だけボタンの高さ');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
