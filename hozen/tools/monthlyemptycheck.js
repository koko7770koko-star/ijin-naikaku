// 月報：記録が0件の月で「この月の記録はありません」と戻る物が出る。記録のある月では出ない。390px。記録は変えない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const info=()=>p.evaluate(()=>{const e=document.querySelector('.monthlyEmpty');return e?{t:e.textContent,bs:[...e.querySelectorAll('button')].map(x=>[x.textContent.trim(),x.getBoundingClientRect().height]),sw:document.documentElement.scrollWidth}:null});
 // 記録のある月（今月に日常点検を1日入れる）
 await p.evaluate(()=>{S.tasks=[];S.issues=[];S.daily={};const c0={};chkDefs().forEach(d=>c0[d.id]='○');S.daily[TODAY]={done:true,c:c0};V.ry=now.getFullYear();V.rm=now.getMonth()+1;go('report',{rmode:'m'})});await p.waitForTimeout(300);
 if(await info())bad.push('記録のある月で出ている');
 // 10年前の月
 await p.evaluate(()=>{V.ry=now.getFullYear()-10;V.rm=3;render()});await p.waitForTimeout(300);
 const r=await info();
 if(!r)bad.push('記録の無い月で出ない');else{
  if(!/この月の記録はありません/.test(r.t))bad.push('文言 '+r.t);
  if(r.bs.length!==2||r.bs.some(x=>x[1]<44))bad.push('ボタン '+JSON.stringify(r.bs));
  if(r.sw>392)bad.push('はみ出す');}
 const before=await p.evaluate(()=>JSON.stringify([S.daily,S.tasks,S.issues,S.notes]));
 await p.click('.monthlyEmpty .btn:not(.sec)');await p.waitForTimeout(300);
 const back=await p.evaluate(()=>[V.ry===now.getFullYear(),V.rm===now.getMonth()+1]);
 if(!back[0]||!back[1])bad.push('今月へ戻らない');
 if(await info())bad.push('今月に戻っても出ている');
 if(before!==await p.evaluate(()=>JSON.stringify([S.daily,S.tasks,S.issues,S.notes])))bad.push('記録が変わった');
 await p.evaluate(()=>{V.ry=now.getFullYear()-10;V.rm=3;render()});await p.waitForTimeout(200);
 await p.screenshot({path:process.env.SHOT||'/tmp/monthlyempty.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
