// 文字「大」「特大」・360px：作業指示書の窓（editWork）の担当者・資格・作業前後チェックの札と、不具合の窓（editIssue）の状態ボタンが、漢字・かなの間（「職/員」「必/須」「対応/中」）で割れない・窓からはみ出さない。標準 390px は「必須」の札と状態ボタンだけ見る（標準の2列の資格名の折り返しは対象外）。
// usage: node hozen/tools/modalxlwordcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale()},fs);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 for(const [open,sel] of [['editWork()','#wk_staff label,#wk_quals label,#wk_pre label,#wk_post label'],['editIssue(null,{})','#is_steps button']]){
  await p.evaluate(f=>{closeModal(true);eval(f)},open);await p.waitForTimeout(300);
  const r=await p.evaluate(sel=>{const CJK=/[\u3040-\u30fa\u30fc-\u30ff\u4e00-\u9fff]/;/* 「・」の後ろで割れるのはよい */const out=[];let n=0;const m=document.querySelector('#modal').getBoundingClientRect();
   document.querySelectorAll(sel).forEach(x=>{n++;const bx=x.getBoundingClientRect();if(bx.width&&bx.right>m.right+1)out.push('「'+x.textContent.trim().slice(0,16)+'」が窓からはみ出す');
    const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
    while(t=tw.nextNode()){if(t.parentElement.closest('small'))continue;const s=t.textContent;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
     if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i])&&(t.parentElement.closest('.pill')||x.tagName==='BUTTON'||(document.documentElement.dataset.fs&&(/^職員\d/.test(x.textContent.trim())||x.closest('#wk_quals')))))out.push('「'+x.textContent.trim().slice(0,16)+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
   return {n,out:[...new Set(out)]}},sel);
  if(r.n<3)errs.push(tag+' '+open+'：対象が見つからない（'+r.n+'）');
  for(const x of r.out)errs.push(tag+' '+open+'：'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
