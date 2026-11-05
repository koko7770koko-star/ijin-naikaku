// 日常点検の数字の欄のラベル：文字「大」「特大」・360px で … で省かれず、全文が見える（「変圧器温度(℃)」「デマンド(kW)」）。標準・390px は今までどおり（はみ出しは … で隠す作り）。hz-dayfield-label
// usage: node hozen/tools/dayfieldxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('day')},fs);await p.waitForTimeout(300);
 const tag=w+'px・'+({xl:'特大',l:'大'})[fs];
 const r=await p.evaluate(()=>{const L=[...document.querySelectorAll('.grid3>.num>label.f')].filter(e=>e.offsetParent);const W=document.documentElement.clientWidth;
  return {n:L.length,bad:L.filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1).map(e=>e.textContent.trim()+' '+e.scrollWidth+'>'+e.clientWidth),out:L.filter(e=>e.getBoundingClientRect().right>W).map(e=>e.textContent.trim())}});
 if(!r.n)errs.push(tag+'：数字の欄が見つからない');
 for(const x of r.bad)errs.push(tag+'：「'+x+'」が省かれる');for(const x of r.out)errs.push(tag+'：「'+x+'」がはみ出す');
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
