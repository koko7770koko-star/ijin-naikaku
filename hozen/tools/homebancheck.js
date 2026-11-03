// ホームの盤の点検の残り：盤が無ければ出ない。あれば「あと○面（全○面）」の1行（44px以上）。押すと盤の点検が開き、次の未点検の盤が光る。全部済めば「済み」。390pxではみ出さない。保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
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
 // 棟ごとの残り：2棟（片方だけ残り）では出ない・両方に残りがあれば出る・押すとその棟・20日以降は黄色
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1'),mk('b2','棟2','建屋',''),mk('f2','階2','階','b2'),mk('p2','盤2','盤','f2'),mk('p3','盤3','盤','f2')];
  const ym=TODAY.slice(0,7);S.banChk={};S.banChk[ym]={p1:['済','済','済']};go('home')});await p.waitForTimeout(300);
 if(await p.evaluate(()=>!!document.querySelector('.homebanb')))bad.push('残りが1棟だけなのに棟の行が出る');
 await p.evaluate(()=>{S.banChk[TODAY.slice(0,7)]={};go('home')});await p.waitForTimeout(300);
 const bb=await p.evaluate(()=>[...document.querySelectorAll('.homebanb button')].map(e=>({t:e.textContent.trim(),h:e.getBoundingClientRect().height})));
 if(bb.length!==2||!/棟1 1面/.test(bb[0].t)||!/棟2 2面/.test(bb[1].t)||bb.some(x=>x.h<44))bad.push('棟ごとの残りの行が違う '+JSON.stringify(bb));
 await p.click('.homebanb button:nth-child(2)');await p.waitForTimeout(400);
 if(await p.evaluate(()=>V.view!=='ban'||V.banB!=='b2'))bad.push('棟2のタブが開かない');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('棟の行ではみ出す');
 // 25日（月の20日以降）に残りがあれば黄色
 const p2=await c.newPage();await p2.clock.install({time:new Date('2026-11-25T10:00:00')});await p2.goto('file://'+FILE);await p2.waitForTimeout(1500);
 await p2.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1')];S.banChk={};go('home')});await p2.waitForTimeout(300);
 const bg25=await p2.evaluate(()=>getComputedStyle(document.querySelector('.homeban')).backgroundColor);
 await p2.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1')];S.banChk={};go('home')});await p2.waitForTimeout(200);
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1')];S.banChk={};go('home')});await p.waitForTimeout(200);
 const bg=await p.evaluate(()=>getComputedStyle(document.querySelector('.homeban')).backgroundColor);
 if(new Date().getDate()<20&&bg===bg25)bad.push('25日でも色が変わらない（'+bg+'）');
 await p.screenshot({path:process.env.SHOT||'/tmp/homeban.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
