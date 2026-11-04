// 全画面（VIEWS）のボタン：文字「特大」「大」・360px と標準 390px で、漢字・かなの続き（「ファイ/ル」「予/定」など）で割れない・はみ出さない（hz-btn-wordbreak）。
// 割れてよい所は <wbr> で文字のかたまりを分けた所だけ（かたまりの中で割れたら落ちる）。nav は絵と文字の2行が正しいので除く。
// usage: node hozen/tools/btnwordallcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 for(const v of views){
  try{await p.evaluate(v=>go(v,{day:TODAY}),v);}catch(e){errs.push(w+fs+' '+v+' ERR '+e.message.slice(0,80));continue}
  await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const CJK=/[぀-ヺー-ヿ一-鿿]/;const out=[];
   [...document.querySelectorAll('#app .btn, #app button')].filter(x=>x.offsetParent&&!x.closest('nav')).forEach(x=>{
    const bx=x.getBoundingClientRect();if(bx.right>innerWidth+0.5&&!x.closest('.tscroll,.hscroll,[style*=overflow]'))out.push('「'+x.textContent.trim().slice(0,30)+'」がはみ出す');const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
    while(t=tw.nextNode()){const s=t.textContent;prev=null;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
     if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i]))out.push('「'+x.textContent.trim().slice(0,30)+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
   return [...new Set(out)]});
  for(const x of r)errs.push(w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+' '+v+'：'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
