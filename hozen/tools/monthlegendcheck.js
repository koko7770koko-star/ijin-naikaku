// カレンダー：予定のあるマスで ◯/● が見え、勤務者は予定の下の1段にまとまる。390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.tasks=[{id:'ml1',title:'確認点検',date:TODAY,time:'',place:'',staff:'',status:'予定',result:'',photos:[]},{id:'ml2',title:'完了点検',date:TODAY,time:'',place:'',staff:'',status:'完了',result:'良',photos:[]}];S.settings.showCrew=true;V.sel=TODAY;go('month')});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const d=document.querySelector('.cal .d.today');const ts=[...d.querySelectorAll('.t')].map(x=>x.textContent);const wc=d.querySelector('.wc');const t0=d.querySelector('.t').getBoundingClientRect().top;return{ts,wc:!!wc,after:wc?wc.getBoundingClientRect().top>=t0:true,sw:document.documentElement.scrollWidth}});
 if(!r.ts.some(x=>x.startsWith('◯')))bad.push('予定に ◯ が出ない '+r.ts);if(!r.ts.some(x=>x.startsWith('●')))bad.push('完了に ● が出ない '+r.ts);
 if(!r.after)bad.push('勤務者が予定より上にある');if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.screenshot({path:process.env.SHOT||'/tmp/ml.png'});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
