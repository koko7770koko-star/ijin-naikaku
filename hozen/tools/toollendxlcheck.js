// 工具の窓（貸出・校正履歴）・貸出の窓・校正を記録の窓：文字「大」「特大」・360px・貸出と校正3回ずつで、横にはみ出さない・ボタンが44px以上・ボタンが見出しや履歴と重ならない（hz-l-tool-lend）
// usage: node hozen/tools/toollendxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}
  const L=[...Array(3)].map((_,i)=>({id:'l'+i,to:'職員'+(i+1)+'（長い貸出先の名前のテスト）',out:addD(TODAY,-30+i),due:'',back:addD(TODAY,-20+i),note:''}));
  L.push({id:'l9',to:'職員9（長い貸出先の名前のテスト）',out:addD(TODAY,-2),due:addD(TODAY,5),back:'',note:''});
  S.tools=[{id:'t1',code:'T-001',name:'絶縁抵抗計（長い名称のテスト・高圧用）',kind:'測定器',maker:'',model:'',serial:'',place:'',calDue:addD(TODAY,10),calCycleM:12,note:'',
   calHist:[...Array(3)].map((_,i)=>({date:addD(TODAY,-300+i),by:'校正機関（長い名前のテスト）',result:'合格・成績書No.12345-'+i,next:addD(TODAY,60+i)})),loans:L}];save();go('stock')},fs);await p.waitForTimeout(300);
 const chk=async nm=>{const r=await p.evaluate(()=>{const M=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
   if(M.scrollWidth>M.clientWidth+1)o.push('modal横スクロール '+M.scrollWidth+'>'+M.clientWidth);
   for(const e of M.querySelectorAll('button,input,select,.meta')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));
    if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height));if(e.scrollWidth>e.clientWidth+1&&e.tagName!=='INPUT')o.push('文が出る '+e.textContent.trim().slice(0,10))}
   for(const g of M.querySelectorAll('.grp')){const bs=g.querySelector('b'),bt=g.querySelector('button');if(!bs||!bt)continue;const a=bs.getBoundingClientRect(),c=bt.getBoundingClientRect();
    if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)o.push('見出しとボタンが重なる '+bs.textContent.trim().slice(0,6))}
   return o});for(const x of r)errs.push(w+'px・'+fs+'・'+nm+'：'+x)};
 await p.evaluate("editTool('t1')");await p.waitForTimeout(300);await chk('工具の窓');
 await p.evaluate("closeModal(true);toolLoan('t1')");await p.waitForTimeout(300);await chk('貸出の窓');
 await p.evaluate("closeModal(true);toolCal('t1')");await p.waitForTimeout(300);await chk('校正の窓');
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
