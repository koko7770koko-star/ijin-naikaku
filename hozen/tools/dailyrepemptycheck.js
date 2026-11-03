// 日報：記録のない日は「この日の記録はありません」と出る・記録のある日は出ない・自動で入る欄と手で入力する欄の印がある・印刷でも出る・390pxではみ出さない・保存の形は変えない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const k0=await p.evaluate(()=>{S.daily={};S.dnotes={};S.meas=[];S.handover&&Object.keys(S.handover).length&&(S.handover={});go('dailyRep',{day:addD(TODAY,-300)});return Object.keys(S).sort().join()});await p.waitForTimeout(300);
 if(!await p.$('.dayempty'))bad.push('記録の無い日に「記録はありません」が出ない');
 const auto=await p.evaluate(()=>document.querySelectorAll('.rep .sec .muted').length);if(auto<7)bad.push('自動・手入力の印が7つ無い '+auto);
 if(!/手で入力/.test(await p.evaluate(()=>document.querySelector('#app').innerText)))bad.push('手入力の印が無い');
 await p.emulateMedia({media:'print'});const vis=await p.evaluate(()=>{const e=document.querySelector('.dayempty');return !!e&&getComputedStyle(e).display!=='none'});if(!vis)bad.push('印刷で記録なしの行が消える');await p.emulateMedia({media:'screen'});
 await p.evaluate(()=>{const d=addD(TODAY,-300);S.dnotes[d]='特記あり';go('dailyRep',{day:d})});await p.waitForTimeout(300);
 if(await p.$('.dayempty'))bad.push('特記事項があるのに「記録はありません」が出る');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 if(await p.evaluate(()=>Object.keys(S).sort().join())!==k0)bad.push('保存の形が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
