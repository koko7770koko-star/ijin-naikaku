// カレンダー（hz-month-today-jump）：‹ › で遠くの月へ行くと「○年○月（今月ではありません）」の帯と「今月へ」（44px）が出て、押すと今月・今日が選ばれる。
//  今月では帯が出ない。今日のマスには「今日」の札（色だけにしない）。‹ › に読み上げの名前。保存の形は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const before=await p.evaluate(()=>{go('month');return JSON.stringify(S.tasks)});await p.waitForTimeout(150);
 const band=()=>p.evaluate(()=>{const e=document.querySelector('.mpast');return e?e.innerText:''});
 if(await band())bad.push('今月なのに帯が出る');
 const td=await p.evaluate(()=>{const e=document.querySelector('.cal .d.today');return e?e.innerText:''});if(!/今日/.test(td))bad.push('今日のマスに「今日」の札が無い');
 const al=await p.evaluate(()=>[...document.querySelectorAll('.mnav button')].map(x=>x.getAttribute('aria-label')).join());if(al!=='前へ,次へ')bad.push('‹ › に読み上げの名前が無い '+al);
 for(let i=0;i<7;i++){await p.click('.mnav button[aria-label="前へ"]');await p.waitForTimeout(40)}
 if(!/今月ではありません/.test(await band()))bad.push('7か月前で帯が出ない');
 if(await p.evaluate(()=>document.querySelector('.cal .d.today')))bad.push('別の月なのに今日のマスがある');
 const h=await p.evaluate(()=>document.querySelector('.mpast button').getBoundingClientRect().height);if(h<44)bad.push('今月へが44px未満 '+h);
 await p.click('.mpast button:has-text("今月へ")');await p.waitForTimeout(120);
 const st=await p.evaluate(()=>({y:V.y,m:V.m,sel:V.sel,ty:+TODAY.slice(0,4),tm:+TODAY.slice(5,7),T:TODAY}));
 if(st.y!==st.ty||st.m!==st.tm||st.sel!==st.T)bad.push('今月へで今月・今日に戻らない '+JSON.stringify(st));
 if(await band())bad.push('今月に戻っても帯が残る');
 for(let i=0;i<14;i++){await p.click('.mnav button[aria-label="次へ"]');await p.waitForTimeout(30)}if(!/今月ではありません/.test(await band()))bad.push('先の月で帯が出ない');
 await p.emulateMedia({media:'print'});if(await p.evaluate(()=>{const e=document.querySelector('.mpast');return e&&getComputedStyle(e).display!=='none'}))bad.push('印刷に帯が出る');await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.tasks))!==before)bad.push('記録が変わった');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
