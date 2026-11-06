// 点検履歴の印刷：日常点検の備考に入れた改行が紙で消えず、入れたとおりに段を分けて出る（hz-v-hist-print-nl）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&typeof go==='function');
 await p.evaluate(()=>{const n0=numDefs()[0];S.daily[TODAY]={by:'点検者1',note:'盤Ａ 異常なし\n盤Ｂ 発熱あり',[n0.id]:(n0.min!=null&&n0.min!==''?Number(n0.min):1)};V.hRange='30';V.hItem='';go('hist')});await p.waitForTimeout(400);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const tr=[...document.querySelectorAll('table.hpt tbody tr')].find(t=>t.textContent.includes('盤Ａ'));if(!tr)return null;const td=[...tr.cells].find(x=>x.textContent.includes('盤Ａ'));return {t:td.innerText,ws:getComputedStyle(td).whiteSpace,vis:tr.getBoundingClientRect().height>0}});
 if(!r)bad.push('印刷の表に備考の行が無い');
 else{if(!/盤Ａ 異常なし\n盤Ｂ 発熱あり/.test(r.t))bad.push('印刷：備考の改行が消える（'+JSON.stringify(r.t)+'・white-space '+r.ws+'）');if(!r.vis)bad.push('印刷：表が見えない');}
 await p.emulateMedia({media:'screen'});
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('390px で横にはみ出す '+sw);
 console.log(JSON.stringify(r));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
