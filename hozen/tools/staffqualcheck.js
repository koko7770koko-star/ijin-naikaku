// 人員・資格の確認：資格が未登録の人の行に「資格を登録 ›」が出て、押すと資格の窓が開く。登録済みの人は資格名が出る。390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.quals={'職員A':['第三種電気主任技術者'],'職員B':[]};go('staff')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({n:document.querySelectorAll('#app .qadd').length,t:document.getElementById('app').innerText,sw:document.documentElement.scrollWidth}));
 if(r.n<1)bad.push('未登録の人に「資格を登録 ›」が出ない');if(!/第三種電気主任技術者/.test(r.t))bad.push('登録済みの資格名が出ない');if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.click('#app .qadd');await p.waitForTimeout(300);
 if(!await p.evaluate(()=>!!document.querySelector('#ql')))bad.push('資格の窓が開かない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
