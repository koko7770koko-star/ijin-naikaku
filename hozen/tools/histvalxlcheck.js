// 点検履歴（hist）の行の数値（「変圧器温度 102℃」など）が、文字「大」「特大」で言葉の途中（「変/圧器温度」）で割れない（hz-l-review-3）。
// 1つの数値の中で行が変わらないこと（その数値が1行に収まる幅のとき）を見る。標準・390px ははみ出さないことだけ見る。
// usage: node hozen/tools/histvalxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[390,'l'],[360,'xl'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 const r=await p.evaluate(f=>{const N=numDefs();for(let i=0;i<10;i++){const d=addD(TODAY,-i),x={c:{},by:'職員1'};N.forEach((n,k)=>x[n.id]=100+i+k);S.daily[d]=x}
  S.settings.fscale=f;save();applyFScale();go('hist');const out=[];
  const metas=[...document.querySelectorAll('#app .item .meta')].filter(m=>m.parentElement.querySelector('.meta')===m).filter(m=>/\d/.test(m.textContent)&&m.textContent.includes('・'));if(!metas.length)return ['数値の行が見つからない'];
  for(const m of metas.slice(0,5)){const parts=m.textContent.split('・');const tn=[];const wk=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let n;while(n=wk.nextNode())tn.push(n);
   // 文字ごとの行の位置を出し、1つの数値の中で行が変わるかを見る
   const tops=[];for(const t of tn)for(let i=0;i<t.textContent.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=rg.getClientRects()[0];tops.push({ch:t.textContent[i],top:q?Math.round(q.top):null})}
   let idx=0;for(const part of parts){const seg=tops.slice(idx,idx+part.length);idx+=part.length+1;const ts=seg.filter(x=>x.top!=null).map(x=>x.top);
    if(ts.length&&Math.max(...ts)-Math.min(...ts)>2&&part.length<=12){const at=seg.findIndex((x,i)=>i&&x.top>seg[i-1].top+2);out.push('「'+part+'」が「'+part.slice(0,at)+'/'+part.slice(at)+'」と割れる')}}}
  if(document.documentElement.scrollWidth>innerWidth+1)out.push('はみ出す');return [...new Set(out)].slice(0,4)},fs);
 for(const x of r)if(fs||/はみ出す|見つからない/.test(x))errs.push(tag+x);
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
