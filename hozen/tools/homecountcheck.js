// ホームの「済み n／全部 m」：日常点検・盤・発電機。表示だけで記録は変えない。390px。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const txt=()=>p.evaluate(()=>{const e=document.querySelector('.homecount');return e?{t:[...e.querySelectorAll('button')].map(x=>x.textContent.replace(/\s+/g,' ').trim()),h:[...e.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height),sw:document.documentElement.scrollWidth}:null});
 await p.evaluate(()=>{S.locs=[];S.equipment=[];go('home')});await p.waitForTimeout(300);
 let r=await txt();
 if(!r||r.t.length!==1||!/日常点検\s*済み \d+／全部 \d+/.test(r.t[0]))bad.push('盤・発電機が無いとき日常点検だけのはず '+JSON.stringify(r));
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});S.locs=[mk('b1','棟1','建屋',''),mk('f1','階1','階','b1'),mk('p1','盤1','盤','f1'),mk('p2','盤2','盤','f1'),mk('p3','盤3','盤','f1')];
  S.banChk={};S.banChk[TODAY.slice(0,7)]={p1:['済','済','済']};
  S.equipment=[{id:'g1',name:'発電機1',kind:'発電機',status:'稼働'},{id:'g2',name:'発電機2',kind:'発電機',status:'稼働'}];S.meas=[{id:'m1',tplId:'mt_gen',equipId:'g1',date:TODAY,rows:[]}];go('home')});await p.waitForTimeout(300);
 r=await txt();
 if(!r||r.t.length!==3)bad.push('3つ出るはず '+JSON.stringify(r));
 else{if(!/盤\s*済み 1／全部 3/.test(r.t[1]))bad.push('盤 '+r.t[1]);if(!/発電機\s*済み 1／全部 2/.test(r.t[2]))bad.push('発電機 '+r.t[2]);if(r.h.some(h=>h<44))bad.push('低い '+r.h);if(r.sw>392)bad.push('はみ出す')}
 const before=await p.evaluate(()=>JSON.stringify([S.daily,S.banChk,S.meas]));
 await p.evaluate(()=>{S.daily[TODAY]={done:true,c:{}};go('home')});await p.waitForTimeout(300);
 r=await txt();const m=r&&r.t[0].match(/済み (\d+)／全部 (\d+)/);if(!m||m[1]!==m[2])bad.push('完了なのに全部済みでない '+(r&&r.t[0]));
 await p.evaluate(b=>{S.daily={};S.banChk={}},0);
 await p.screenshot({path:process.env.SHOT||'/tmp/homecount.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
