// 文字「大」「特大」のまま一覧の画面（点検履歴・設備台帳・不具合・作業管理・予備品）を印刷しても、拡大（zoom）が印刷に掛からない確認。
// 印刷では html の zoom が 1、画面の中身の幅が A4（794px）を越えず、文字の大きさが標準の印刷と同じ。記録は変わらない。
// usage: node hozen/tools/printzoomcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>JSON.stringify(S.settings));
 const measure=async(view,fs)=>{await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844});
  await p.evaluate(([v,f])=>{S.settings.fscale=f;go(v);applyFScale()},[view,fs]);await p.waitForTimeout(250);
  const screenZoom=await p.evaluate(()=>getComputedStyle(document.documentElement).zoom);
  await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const a=document.querySelector('#app');let mx=0,fsz=0;for(const e of a.querySelectorAll('*')){const r=e.getBoundingClientRect();if(r.width&&r.right>mx)mx=r.right}
   const t=a.querySelector('.item,.card,td,b');if(t)fsz=parseFloat(getComputedStyle(t).fontSize);
   return {zoom:getComputedStyle(document.documentElement).zoom,sw:document.documentElement.scrollWidth,mx:Math.round(mx),fsz}});
  return {screenZoom,...r}};
 for(const v of ['hist','equip','issues','works','stock']){
  const n=await measure(v,'');const x=await measure(v,'xl');const l=await measure(v,'l');
  if(x.screenZoom==='1')bad.push(v+'：特大の画面に zoom が掛かっていない（確認が働かない）');
  for(const [k,m] of [['特大',x],['大',l]]){
   if(m.zoom!=='1')bad.push(v+' '+k+'：印刷の zoom が '+m.zoom);
   if(m.sw>796||m.mx>796)bad.push(v+' '+k+'：A4の幅を越える sw='+m.sw+' 右端='+m.mx);
   if(Math.abs(m.fsz-n.fsz)>0.5)bad.push(v+' '+k+'：印刷の文字が標準と違う '+m.fsz+' / '+n.fsz)}}
 await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844});
 const buf=await p.pdf({preferCSSPageSize:true});if(buf.length<2000)bad.push('PDFが作れない');
 await p.evaluate(()=>{S.settings.fscale='';applyFScale()});
 if(await p.evaluate(()=>JSON.stringify(S.settings))!==before)bad.push('設定の記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
