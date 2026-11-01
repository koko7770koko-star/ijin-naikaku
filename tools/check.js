// 390px で index.html を開き、ページのエラーが無いこと・画面に文字が出ることを確かめる。usage: node tools/check.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch(process.env.BROWSER?{executablePath:process.env.BROWSER}:{});const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('CONSOLE '+m.text());});
 await p.route('**/*',r=>{const u=r.request().url();return u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')?r.continue():r.abort();});
 await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(4000);
 const n=await p.evaluate(()=>document.body.innerText.length);console.log('TEXT_LEN',n);
 console.log(errs.slice(0,10).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||n<20?1:0);})();
