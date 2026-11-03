// 年間計画（hz-year-month-link）：月の見出し（44px のボタン）を押すと「カレンダー」「盤の点検」を選べて、その年度の同じ月へ飛ぶ。
//  1〜3月は次の年。戻るで年間計画（同じ年度）に戻る。印のマスを押したときの動き（印の切り替え）は変えない。保存の形は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{closeModal(true);S.items=[{id:'it1',name:'月次点検',cat:S.settings.cats[0]||'',cycle:'',note:''}];S.marks={};go('year',{fy:2025});return JSON.stringify([S.items,S.marks,S.tasks,S.banChk||{}])});
 await p.waitForTimeout(150);
 const hs=await p.evaluate(()=>[...document.querySelectorAll('table.yr th .yrmh')].map(e=>({t:e.textContent,h:e.getBoundingClientRect().height,a:e.getAttribute('aria-label')})));
 if(hs.length!==12)bad.push('月の見出しのボタンが12個でない '+hs.length);
 if(hs.some(x=>x.h<44))bad.push('月の見出しが44px未満');if(!hs.length||!/4月の予定を開く/.test(hs[0].a))bad.push('読み上げの名前が無い');
 // 2月（次の年）→ カレンダー
 await p.click('table.yr th .yrmh:text-is("2月")');await p.waitForSelector('#yrmCal');
 await p.click('#yrmCal');await p.waitForTimeout(150);
 let st=await p.evaluate(()=>({v:V.view,y:V.y,m:V.m,sel:V.sel,mask:document.querySelector('#mask').classList.contains('on')}));
 if(st.v!=='month'||st.y!==2026||st.m!==2||st.sel!=='2026-02-01')bad.push('2月→カレンダーが違う '+JSON.stringify(st));if(st.mask)bad.push('選んだあと窓が残る');
 await p.goBack();await p.waitForTimeout(200);
 st=await p.evaluate(()=>({v:V.view,fy:V.fy}));if(st.v!=='year'||st.fy!==2025)bad.push('戻るで年間計画に戻らない '+JSON.stringify(st));
 // 6月 → 盤の点検
 await p.click('table.yr th .yrmh:text-is("6月")');await p.waitForSelector('#yrmBan');await p.click('#yrmBan');await p.waitForTimeout(150);
 st=await p.evaluate(()=>({v:V.view,ym:V.banYm,h:(document.querySelector('#app h2')||{}).textContent}));
 if(st.v!=='ban'||st.ym!=='2025-06')bad.push('6月→盤の点検が違う '+JSON.stringify(st));
 await p.goBack();await p.waitForTimeout(200);if(await p.evaluate(()=>V.view)!=='year')bad.push('盤の点検から戻るで年間計画に戻らない');
 // 印のマスは今までどおり印が変わる（飛ばない）
 await p.click('table.yr td.mk >> nth=0');await p.waitForTimeout(100);
 const mk=await p.evaluate(()=>({v:V.view,o:((S.marks[2025]||{}).it1||[])[0]}));if(mk.v!=='year'||mk.o!=='○')bad.push('印のマスの動きが変わった '+JSON.stringify(mk));
 await p.evaluate(()=>{S.marks={}});
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 const after=await p.evaluate(()=>JSON.stringify([S.items,S.marks,S.tasks,S.banChk||{}]));if(after!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
