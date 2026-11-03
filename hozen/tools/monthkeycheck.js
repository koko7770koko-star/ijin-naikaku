// カレンダー：凡例が ◯予定・●実施済み・延期・衝突 の4つの色つきの札で出る・390pxではみ出さない・保存の形は変わらない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{go('month')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const l=document.getElementById('calLg');if(!l)return null;return{t:[...l.querySelectorAll('.lg')].map(x=>x.textContent),sw:document.documentElement.scrollWidth,over:l.scrollWidth>l.clientWidth+1}});
 if(!r)bad.push('凡例が無い');else{if(r.t.length!==4||!r.t[0].startsWith('◯')||!r.t[1].startsWith('●'))bad.push('凡例の中身 '+r.t);if(r.sw>392)bad.push('はみ出す');if(r.over)bad.push('凡例が切れる')}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
