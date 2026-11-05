// 設定→点検項目（set items）の数値の項目で、文字「大」「特大」・360px のとき「急変の注意（前回比%）」の欄と「設備」の選び欄が
// 上下にずれず、設備の選び欄の文字が切れない（hz-xl-set-items）。標準・390px ははみ出さないことだけ見る。
// usage: node hozen/tools/setitemsxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 const r=await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('set',{setTab:'items'});const out=[];
  const lab=[...document.querySelectorAll('#app label.f')].filter(l=>l.textContent.includes('急変の注意'));if(!lab.length)return ['急変の注意の欄が見つからない'];
  for(const l of lab.slice(0,3)){const g=l.closest('.grid2');const inp=l.parentElement.querySelector('input');const sel=g.querySelector('select');if(!inp||!sel){out.push('欄が見つからない');continue}
   const a=inp.getBoundingClientRect(),s=sel.getBoundingClientRect();
   const sameRow=Math.abs(a.top-s.top)<a.height/2||a.bottom<=s.top+1||s.bottom<=a.top+1;if(!sameRow)out.push('急変の注意の欄と設備の選び欄が上下にずれる（'+Math.round(a.top-s.top)+'px）');
   if(f){const cs=getComputedStyle(sel),cv=document.createElement('canvas').getContext('2d');cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const t=sel.options[sel.selectedIndex].text,tw=cv.measureText(t).width,room=sel.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-16;if(tw>room)out.push('設備の選び欄「'+t+'」が切れる（'+Math.round(tw)+'>'+Math.round(room)+'）')}}
  if(document.documentElement.scrollWidth>innerWidth+1)out.push('はみ出す');return [...new Set(out)]},fs);
 for(const x of r)errs.push(tag+x);
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
