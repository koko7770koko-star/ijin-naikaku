// 点検履歴の絞り込みが戻ると残るか（hz-hist-filter-keep）：履歴を開いてから期間・項目・言葉・要注意だけを変え、下へスクロール → 1件を開く（日常点検）→
//  ① 端末の戻る（history.back）② 画面の「‹ 点検履歴にもどる」の両方で、条件（hRange・hItem・hKw・hNg）とスクロール位置がそのまま。保存の形は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const data0=await p.evaluate(()=>{const pad=n=>String(n).padStart(2,'0'),ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const nd=numDefs(),cd=chkDefs();
  S.daily={};for(let i=0;i<80;i++){const d=new Date();d.setDate(d.getDate()-i);const r={c:{}};nd.forEach(n=>{r[n.id]=String(100+(i%9))});cd.forEach(x=>{r.c[x.id]=i%5?'○':'×'});r.note='確認'+i;S.daily[ds(d)]=r}
  save();V.hRange='30';V.hItem='';V.hKw='';V.hNg=true;go('home');go('hist');return JSON.stringify(S.daily)});await p.waitForTimeout(300); // 前にも開いて条件を入れてあった（2回目）
 // 開いた後で条件を変える（画面の操作と同じく V を変えて描き直す）
 const want=await p.evaluate(()=>{const nd=numDefs();V.hRange='90';V.hItem=nd[1]?nd[1].id:(nd[0]||{}).id;V.hKw='確認';V.hNg=false;render();return {hRange:V.hRange,hItem:V.hItem,hKw:V.hKw,hNg:V.hNg}});
 await p.waitForTimeout(150);await p.evaluate(()=>window.scrollTo(0,900));await p.waitForTimeout(150);const y0=await p.evaluate(()=>Math.round(scrollY));if(y0<300)bad.push('試験の前提：スクロールできない '+y0);
 const st=()=>p.evaluate(()=>({v:V.view,hRange:V.hRange,hItem:V.hItem,hKw:V.hKw,hNg:V.hNg,y:Math.round(scrollY)}));
 const same=(a)=>a.v==='hist'&&a.hRange===want.hRange&&a.hItem===want.hItem&&a.hKw===want.hKw&&a.hNg===want.hNg&&Math.abs(a.y-y0)<=40;
 const open1=async()=>{await p.evaluate(()=>{const e=[...document.querySelectorAll('#app [onclick^="go(\'day\'"]')][3]||document.querySelector('#app [onclick^="go(\'day\'"]');e.click()});await p.waitForTimeout(300);if(await p.evaluate(()=>V.view)!=='day')bad.push('1件を開けない')};
 await open1();await p.goBack();await p.waitForTimeout(400);let s1=await st();if(!same(s1))bad.push('端末の戻るで条件か位置が変わる '+JSON.stringify({want,y0,s1}));
 await open1();await p.click('#dayBackHist');await p.waitForTimeout(400);s1=await st();if(!same(s1))bad.push('「‹ 点検履歴にもどる」で条件か位置が変わる '+JSON.stringify({want,y0,s1}));
 if(await p.evaluate(()=>JSON.stringify(S.daily))!==data0)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
