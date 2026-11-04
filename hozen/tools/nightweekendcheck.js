// 夜間：シフト表の土日・祝日の行（td.dc・td.wd）の比が 4.5 以上、標準の明るさの AI 画面の「›」(.ar) が 3 以上か。390px。
// usage: node hozen/tools/nightweekendcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const MEAS=`(sel=>{const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
  const lum=([r,g,b])=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
  const bgOf=(e,d)=>{for(;e;e=e.parentElement){const a=rgb(getComputedStyle(e).backgroundColor);if(a.length===3||(a.length===4&&a[3]>=.99))return a}return d};
  const out=[];document.querySelectorAll(sel).forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!(e.textContent||'').trim())return;
   const l1=lum(rgb(getComputedStyle(e).color)),l2=lum(bgOf(e,window.__d));out.push(+((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)).toFixed(2))});return out})`;
 // 夜間・シフト表の土日祝の行
 await p.evaluate(()=>{S.settings.night='on';save();applyNight&&applyNight()}).catch(()=>{});
 await p.evaluate(()=>document.documentElement.classList.add('night'));
 await p.evaluate(()=>go('shift'));await p.waitForTimeout(700);
 const tabN=await p.evaluate(()=>document.querySelectorAll('#shiftApp .tabs button').length);let n=0;
 for(let i=0;i<tabN;i++){await p.evaluate(i=>document.querySelectorAll('#shiftApp .tabs button')[i].click(),i);await p.waitForTimeout(300);
  const r=await p.evaluate('('+MEAS+')("#shiftApp table.sh tr:not(.today) td.dc,#shiftApp table.sh tr:not(.today) td.wd")');
  n+=r.length;r.filter(x=>x<4.5).forEach(x=>errs.push('夜間シフト表の土日祝 比 '+x+' < 4.5'))}
 if(!n)errs.push('土日の行が見つからない');
 // 標準の AI の「›」
 await p.evaluate(()=>{document.documentElement.classList.remove('night');S.settings.night='off';save();applyNight&&applyNight()}).catch(()=>{});
 await p.evaluate(()=>document.documentElement.classList.remove('night'));
 await p.evaluate(()=>go('ai'));await p.waitForTimeout(400);
 const a=await p.evaluate('(window.__d=[255,255,255],'+MEAS+')(".ar")');
 if(!a.length)errs.push('AI の「›」が見つからない');a.filter(x=>x<3).forEach(x=>errs.push('AI の「›」 比 '+x+' < 3'));
 console.log(errs.join('\n')||'NO ERRORS ('+n+'+'+a.length+' 件)');await b.close();process.exit(errs.length?1:0)})();
