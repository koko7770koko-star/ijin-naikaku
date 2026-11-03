// 小さい文字の確認：注・凡例・バッジ・ヒントが 12px 以上で、390px で切れず横にはみ出さない。
// カレンダーのマスなど場所の無い所は 11px 以下を許す（押すと大きく出る）。
// usage: node hozen/tools/smallfontcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 for(const v of ['home','day','hist','works','stock','ai','ban','report','set','equip','menu']){
  await p.evaluate(v=>{try{go(v)}catch(e){}},v);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const out=[];document.querySelectorAll('#app *').forEach(e=>{if(e.closest('.cal,table,.dwgv,nav,.tile,.pill'))return;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=parseFloat(getComputedStyle(e).fontSize);if(f<12&&e.getBoundingClientRect().width>0)out.push((e.className||e.tagName)+':'+f)});return {small:[...new Set(out)].slice(0,6),sw:document.documentElement.scrollWidth}});
  if(r.small.length)bad.push(v+' に 12px 未満の文字：'+r.small.join(' '));if(r.sw>392)bad.push(v+' が横にはみ出す '+r.sw);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
