// 文字「特大」・360px：残りの入力の窓（作業標準・保全計画・図面・測定のひな形・場所・予算・項目・修理・資格）で、
// ①ボタン・札の文字が漢字・かなの間で割れない ②窓の外へはみ出さない ③下の保存・キャンセルが画面内で 44px 以上 ④数字・日付の入力欄が狭すぎない（80px 以上）を確かめる。
// usage: node hozen/tools/modalrestxlcheck.js   （PROBE=1 で絵を scratch に撮る）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l']]){
 const c=await b.newContext({viewport:{width:w,height:740}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;(S.equipment=S.equipment||[]).push({id:'e_probe',name:'○○受変電設備',place:'',repairs:[]});save();applyFScale()},fs);
 const tag=w+'px・'+({xl:'特大',l:'大'})[fs];
 const opens=["editStd('')","editPlan('')","editDwg('')","editMtpl('')","editLoc('')","editBudget('')","editItem('')","editRepair('e_probe','')","editQual('職員1')"];
 for(const open of opens){
  try{await p.evaluate(f=>{closeModal(true);eval(f)},open)}catch(e){errs.push(tag+' '+open+'：開けない '+e.message);continue}
  await p.waitForTimeout(250);
  if(process.env.PROBE){await p.screenshot({path:process.env.PROBE+'/'+fs+'-'+open.replace(/\W/g,'')+'.png'})}
  const r=await p.evaluate(()=>{const CJK=/[぀-ヺー-ヿ一-鿿]/;const out=[];const m=document.querySelector('#modal');if(!m)return['窓が無い'];const mr=m.getBoundingClientRect();
   m.querySelectorAll('button,label.chkl,.pill').forEach(x=>{const bx=x.getBoundingClientRect();if(!bx.width)return;if(bx.right>mr.right+1)out.push('「'+x.textContent.trim().slice(0,14)+'」が窓からはみ出す');
    const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
    while(t=tw.nextNode()){if(t.parentElement.closest('small'))continue;const s=t.textContent;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
     if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i]))out.push('「'+x.textContent.trim().slice(0,14)+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
   m.querySelectorAll('input[type=number],input[type=date],input[type=time],input[inputmode=numeric],input[inputmode=decimal]').forEach(x=>{const bx=x.getBoundingClientRect();if(bx.width&&bx.width<80)out.push('入力欄が狭い '+Math.round(bx.width)+'px '+(x.id||x.name||''))});
   const f=m.querySelector('.mfoot');if(!f)out.push('下のボタンの帯が無い');else f.querySelectorAll('button').forEach(x=>{const bx=x.getBoundingClientRect();if(bx.height<44)out.push('「'+x.textContent.trim()+'」が低い '+Math.round(bx.height)+'px');if(bx.bottom>innerHeight+1)out.push('「'+x.textContent.trim()+'」が画面の外');if(bx.right>innerWidth+1)out.push('「'+x.textContent.trim()+'」が横にはみ出す')});
   if(document.documentElement.scrollWidth>innerWidth+2)out.push('横にはみ出す '+document.documentElement.scrollWidth);
   return[...new Set(out)]});
  for(const x of r)errs.push(tag+' '+open+'：'+x)}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
