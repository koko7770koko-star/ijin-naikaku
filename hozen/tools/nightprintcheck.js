// 夜間モードのまま印刷（media print）しても、紙が白地・黒字のままか（hz-night-print）。画面の夜間はそのまま。保存データは変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const lum=s=>{const m=(s||'').match(/[\d.]+/g);if(!m)return 1;const [r,g,b,a]=m.map(Number);if(a===0)return 1;return (0.2126*r+0.7152*g+0.0722*b)/255};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{document.documentElement.classList.add('night')});
 const before=await p.evaluate(()=>JSON.stringify(S));
 const screenBg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
 if(lum(screenBg)>0.3)bad.push('画面の夜間が暗くない（確かめの前提）：'+screenBg);
 for(const v of ['month','report','ban','dailyRep','year','printDoc']){
  await p.emulateMedia({media:'screen'});await p.evaluate(x=>{try{go(x)}catch(e){}},v);await p.waitForTimeout(250);
  await p.emulateMedia({media:'print'});await p.waitForTimeout(100);
  const r=await p.evaluate(()=>{const f=e=>getComputedStyle(e);const bg=f(document.body).backgroundColor,hb=f(document.documentElement).backgroundColor,col=f(document.body).color;
   let darkBg=0,pale=0,n=0;document.querySelectorAll('#app *').forEach(e=>{if(!e.offsetParent&&f(e).position!=='fixed')return;const s=f(e);if(!e.textContent.trim()||e.children.length)return;n++;const m=x=>{const a=(x.match(/[\d.]+/g)||[]).map(Number);return a.length<3?1:(a[3]===0?1:(0.2126*a[0]+0.7152*a[1]+0.0722*a[2])/255)};if(m(s.color)>0.7){let q=e,eb=1;while(q){const bc=f(q).backgroundColor;if(bc&&bc!=='rgba(0, 0, 0, 0)'&&bc!=='transparent'){eb=m(bc);break}q=q.parentElement}if(eb>0.5)pale++}});
   return {bg,hb,col,pale,n}});
  if(lum(r.bg)<0.9||lum(r.hb)<0.9)bad.push(v+'：印刷の地が白でない '+r.bg+' / '+r.hb);
  if(lum(r.col)>0.4)bad.push(v+'：印刷の文字色が薄い '+r.col);
  if(r.pale>0)bad.push(v+'：印刷で薄い文字が'+r.pale+'か所');
 }
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S))!==before)bad.push('保存データが変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
