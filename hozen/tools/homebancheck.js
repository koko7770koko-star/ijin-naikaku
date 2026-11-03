// ホームの盤の点検の残り：盤が無ければ出ない。あれば「あと○面（全○面）」の1行（44px以上）。押すと盤の点検が開き、次の未点検の盤が光る。全部済めば「済み」。390pxではみ出さない。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.locs=[];S.banChk={};go('home')});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!!document.querySelector('.homeban')))bad.push('盤が無いのに出る');
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1'),mk('p2','盤2','盤','f1'),mk('p3','盤3','盤','f1')];
  const ym=TODAY.slice(0,7);S.banChk={};S.banChk[ym]={p1:['済','済','済']};go('home')});await p.waitForTimeout(300);
 let r=await p.evaluate(()=>{const e=document.querySelector('.homeban');return e?{t:e.textContent,h:e.getBoundingClientRect().height,sw:document.documentElement.scrollWidth}:null});
 if(!r)bad.push('出ない');else{if(!/あと2面（全3面）/.test(r.t))bad.push('件数が違う '+r.t);if(r.h<44)bad.push('低い '+r.h);if(r.sw>392)bad.push('はみ出す')}
 const before=await p.evaluate(()=>JSON.stringify(S.banChk));
 await p.click('.homeban');await p.waitForTimeout(900);
 const f=await p.evaluate(()=>({v:V.view,flash:(document.querySelector('.banrow.flash')||{}).id||''}));
 if(f.v!=='ban')bad.push('盤の点検が開かない');if(f.flash!=='ban-p2')bad.push('次の未点検の盤が光らない '+f.flash);
 if(before!==await p.evaluate(()=>JSON.stringify(S.banChk)))bad.push('押しただけで記録が変わった');
 await p.evaluate(()=>{const ym=TODAY.slice(0,7);S.banChk[ym]={p1:['済','済','済'],p2:['済','済','済'],p3:['済','延','済']};go('home')});await p.waitForTimeout(300);
 if(!/全3面 済み/.test(await p.evaluate(()=>document.querySelector('.homeban').textContent)))bad.push('全部済みの表示が違う');
 await p.screenshot({path:process.env.SHOT||'/tmp/homeban.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
