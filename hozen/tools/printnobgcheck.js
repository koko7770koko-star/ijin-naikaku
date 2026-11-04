// 印刷で「背景のグラフィック」が切（既定）でも読めるか：印刷表示で白っぽい文字なのに、背景が print-color-adjust:exact でない（紙では白地になる）要素を数える。
// 対象：report・month・year・ban・day・printDoc。usage: node hozen/tools/printnobgcheck.js [--list]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const k=Object.keys(S.daily||{});if(!k.length){S.daily={};S.daily[TODAY]={done:true}}});
 const MEAS=()=>{const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=([r,g,b])=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
  const out=[];document.querySelectorAll('#app *').forEach(e=>{const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
   const cs=getComputedStyle(e);const f=rgb(cs.color);if(lum(f)<0.6)return;
   // 紙での背景：exact の要素（または祖先）の背景だけが残る
   let bg=null;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){const s=getComputedStyle(x);const a=rgb(s.backgroundColor);if(a.length===3||(a.length===4&&a[3]>.5)){if(s.printColorAdjust==='exact'||s.webkitPrintColorAdjust==='exact'){bg=a;}break}}
   if(!bg||lum(bg)>0.4)out.push((e.tagName+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')).slice(0,40)+'「'+e.textContent.trim().slice(0,10)+'」')});
  return out};
 const list=process.argv.includes('--list');
 await p.emulateMedia({media:'print'});
 await p.evaluate(()=>{V.day=addD(TODAY,-3)});
 for(const v of ['report','month','year','day','ban','printDoc','dailyRep','hist','equip']){
  try{await p.evaluate(x=>go(x),v)}catch(e){continue}await p.waitForTimeout(300);
  const r=await p.evaluate(MEAS);if(list&&r.length)console.log(v+': '+[...new Set(r)].slice(0,12).join(' / '));if(r.length)bad.push(v+'：白い文字で紙では背景が出ない物 '+r.length+' 件 '+[...new Set(r)].slice(0,3).join(' / '))}
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
