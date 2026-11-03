// AI画面の確認：8つの機能すべてに「送る物：…」の1行があり、390pxではみ出さず、文字が12px以上であることを確かめる。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let sent=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();sent++;return r.abort()});
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>go('ai'));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({n:document.querySelectorAll('#app .mitem').length,s:[...document.querySelectorAll('#app .aisend')].map(e=>({t:e.textContent,f:parseFloat(getComputedStyle(e).fontSize)})),sw:document.documentElement.scrollWidth}));
 if(r.s.length!==r.n)bad.push('送る物の行が足りない '+r.s.length+'/'+r.n);
 if(r.s.some(x=>!/^送る物：/.test(x.t)))bad.push('送る物：で始まらない行がある');
 if(r.s.some(x=>x.f<12))bad.push('12px未満');
 if(r.sw>392)bad.push('横にはみ出す');
 await p.screenshot({path:process.env.SHOT||'/tmp/ai390.png',fullPage:true});
 if(sent)bad.push('外に送ろうとした '+sent);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
