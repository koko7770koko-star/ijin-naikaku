// 月報・年報・日報の上の説明文：文字「大」「特大」・360px で、説明文が細い列に押されず（幅が画面の半分以上）、印刷／PDF・共有のボタンは下の段に並ぶ。標準は今までどおり横並び。hz-xl-review-8
// usage: node hozen/tools/reportheadxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale()},fs);
 for(const [name,fn] of [['月報',()=>{V.rmode='m';go('report')}],['年報',()=>{V.rmode='y';go('report')}],['日報',()=>go('dailyRep',{day:TODAY})]]){
  await p.evaluate(fn);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const s=document.querySelector('#app .card.noprint>.row:first-child>.muted.grow');if(!s)return null;const bt=s.parentElement.querySelector('button'),a=s.getBoundingClientRect(),q=bt.getBoundingClientRect();return {sw:a.width,cw:s.parentElement.getBoundingClientRect().width,below:q.top>=a.bottom-1,page:document.documentElement.scrollWidth}});
  if(!r){errs.push(tag+'・'+name+'：説明文が見つからない');continue}
  if(r.page>w+2)errs.push(tag+'・'+name+'：横にはみ出す');
  if(fs){if(r.sw<r.cw*0.9)errs.push(tag+'・'+name+'：説明文の幅が '+Math.round(r.sw)+'px しかない');if(!r.below)errs.push(tag+'・'+name+'：ボタンが説明の下の段に並ばない')}else if(r.below)errs.push(tag+'・'+name+'：標準でボタンが下の段に落ちた')}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
