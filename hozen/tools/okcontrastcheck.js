// 標準（昼）の明るさで home・day の「✓ 異常なしで記録」(.btn.ok)・「残り○件」(.qs)・「未入力」(.badge) の文字の比が 4.5 以上か。390px。
// usage: node hozen/tools/okcontrastcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>document.documentElement.classList.remove('night'));
 let n=0;
 for(const v of ['home','day']){await p.evaluate(x=>go(x),v);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
   const lum=([r,g,b])=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
   const bgOf=e=>{for(;e;e=e.parentElement){const a=rgb(getComputedStyle(e).backgroundColor);if(a.length===3||(a.length===4&&a[3]>=.99))return a;}return [255,255,255]};
   const out=[];
   document.querySelectorAll('.btn.ok,.qs,.badge').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!(e.textContent||'').trim())return;
    const f=rgb(getComputedStyle(e).color),g=bgOf(e),l1=lum(f),l2=lum(g);const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
    out.push([e.className,(e.textContent||'').trim().slice(0,12),+ratio.toFixed(2)])});
   return out});
  for(const [cl,t,ratio] of r){n++;if(ratio<4.5)errs.push(v+': '+cl+' 「'+t+'」 比 '+ratio+' < 4.5')}}
 if(!n)errs.push('対象が見つからない');
 console.log(errs.join('\n')||'NO ERRORS ('+n+' 件)');await b.close();process.exit(errs.length?1:0)})();
