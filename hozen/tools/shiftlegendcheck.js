// シフト表：「色の意味へ」ボタン（44px）で凡例へ動ける・回数カードが390pxで切れない・保存の形は変わらない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const keys0=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));
 const m=await p.evaluate(()=>{const x=document.getElementById('shLegBtn');if(!x)return null;const r=x.getBoundingClientRect();return{h:r.height,sw:document.documentElement.scrollWidth,cut:[...document.querySelectorAll('#shPer .pc span')].filter(s=>s.scrollWidth>s.parentElement.clientWidth).length}});
 if(!m)bad.push('ボタンが無い');else{if(m.h<44)bad.push('小さい '+m.h);if(m.sw>392)bad.push('はみ出す');if(m.cut)bad.push('回数カードが切れる '+m.cut)}
 await p.click('#shLegBtn');await p.waitForTimeout(900);
 const v=await p.evaluate(()=>{const r=document.querySelector('#pg-shift .legend').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight});
 if(!v)bad.push('凡例が見える所に動かない');
 const keys1=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));if(keys0&&keys1!==keys0)bad.push('保存の項目が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
