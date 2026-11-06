// 設備カルテの印刷：修理履歴・異常案件・作業実績が 0 件の節は、見出しと「ありません」を1行に詰める（空の枠で頁を取らない）。1件以上ある節は今までどおり（hz-v-eqcard-print）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.equipment=[{id:'ed0',code:'E-001',name:'設備1',kind:'受変電',importance:'A',status:'稼働',maker:'',model:'',serial:'',installed:'2010-04',life:20,place:'',photos:[],docs:[],repairs:[],health:[]}];S.issues=[];save();go('equipDetail',{eq:'ed0',eqTab:'rec'})});
 await p.waitForTimeout(300);await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>[...document.querySelectorAll('#app .card')].filter(e=>/故障・修理履歴|異常案件|作業・点検の実績/.test(e.querySelector('h2')?.textContent||'')).map(e=>({t:e.querySelector('h2').textContent,h:Math.round(e.getBoundingClientRect().height)})));
 if(r.length!==3)bad.push('0件の3つの節が見つからない '+JSON.stringify(r));
 r.forEach(x=>{if(x.h>40)bad.push(x.t+' が0件なのに '+x.h+'px の枠を取る')});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
