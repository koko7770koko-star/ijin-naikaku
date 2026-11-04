// 設備台帳の「絞り込み」・日常点検の「日報」・異常の「未完了を印刷」「故障分析」のボタン：文字「大」「特大」・360px と標準 390px で、漢字・かなの間（「絞/り」「日/報」「完/了」）で割れない・はみ出さない（hz-btn-wordbreak-k1）。
// usage: node hozen/tools/btnwordk1check.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 for(const [v,re] of [['equip','絞り込み'],['day','日報|昨日|今日|明日'],['issues','未完了を印刷|故障分析']]){
  await p.evaluate(v=>go(v,{day:TODAY}),v);await p.waitForTimeout(250);
  const r=await p.evaluate(re=>{const CJK=/[぀-ヺー-ヿ一-鿿]/;const out=[];let n=0;
   [...document.querySelectorAll('#app button')].filter(x=>x.offsetParent&&new RegExp(re).test(x.textContent)).forEach(x=>{n++;
    const bx=x.getBoundingClientRect();if(bx.right>innerWidth+0.5)out.push('「'+x.textContent.trim()+'」がはみ出す');
    const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
    while(t=tw.nextNode()){const s=t.textContent;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
     if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i]))out.push('「'+x.textContent.trim()+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
   return {n,out:[...new Set(out)]}},re);
  if(!r.n)errs.push(tag+' '+v+'：ボタンが見つからない');
  for(const x of r.out)errs.push(tag+' '+v+'：'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
