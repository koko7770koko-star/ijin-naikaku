// 日報の横に流れる表（.repscroll）：右に続きがあるときだけ右端が薄くなり、端まで動かすと消え、左が欠けると左端が薄くなる。印刷には出ない。hz-repscroll-hint
// usage: node hozen/tools/repscrollhintcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const [W,night] of [[360,false],[360,true]]){const c=await b.newContext({viewport:{width:W,height:700}});const p=await c.newPage();const tag=W+'px'+(night?'・夜':'');
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(n=>{if(n)S.settings.night=true;go('dailyRep',{day:TODAY})},night);await p.waitForTimeout(300);
 const q=()=>p.evaluate(()=>{const e=document.querySelector('.repscroll');if(!e)return null;const m=e.scrollWidth-e.clientWidth;return {m,more:e.classList.contains('rs-more'),less:e.classList.contains('rs-less'),mask:getComputedStyle(e).maskImage||getComputedStyle(e).webkitMaskImage}});
 const a=await q();if(!a){bad.push(tag+'：.repscroll が無い');await c.close();continue}
 if(a.m>2){
  if(!a.more||a.less)bad.push(tag+'：最初は右だけ薄くなるはず '+JSON.stringify(a));if(!/gradient/.test(a.mask))bad.push(tag+'：右端の薄い印が付かない');
  await p.evaluate(()=>{const e=document.querySelector('.repscroll');e.scrollLeft=e.scrollWidth});await p.waitForTimeout(150);
  const e2=await q();if(e2.more||!e2.less)bad.push(tag+'：右端まで動かしたら右の印は消え左が出るはず '+JSON.stringify(e2));
  await p.emulateMedia({media:'print'});const pm=await p.evaluate(()=>getComputedStyle(document.querySelector('.repscroll')).maskImage);if(/gradient/.test(pm))bad.push(tag+'：印刷に薄い印が出る');
 }else bad.push(tag+'：表が横に流れない（確認の前提が崩れた）'+JSON.stringify(a));
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
