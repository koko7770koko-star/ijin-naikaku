// 資格の一覧（人員画面・期限の印つき）・資格の窓・資格の種類の窓：文字「大」「特大」・360px・長い資格名8種で、横にはみ出さない・行とボタンが44px以上・期限の札が行からはみ出さない（hz-l-qual-list）
// usage: node hozen/tools/qualxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}
  const Q=[...Array(8)].map((_,i)=>'第'+(i+1)+'種電気主任技術者・高圧ケーブル接続作業（長い名前のテスト）');S.qualList=Q;
  const d0=addD(TODAY,-3),d1=addD(TODAY,20);S.quals={};S.qualExp={};
  for(let k=1;k<=4;k++){S.quals['職員'+k]=Q.slice(0,k+1);S.qualExp['職員'+k]={[Q[0]]:k%2?d0:d1,[Q[1]]:d1}}
  save();go('staff')},fs);await p.waitForTimeout(300);
 const chk=async nm=>{const r=await p.evaluate(()=>{const M=document.querySelector('#modal'),on=document.querySelector('#mask.on'),root=on?M:document.querySelector('#app'),W=document.documentElement.clientWidth,o=[];
   if(document.documentElement.scrollWidth>W+1)o.push('ページ横スクロール '+document.documentElement.scrollWidth+'>'+W);
   if(on&&M.scrollWidth>M.clientWidth+1)o.push('modal横スクロール '+M.scrollWidth+'>'+M.clientWidth);
   const box=[];
   for(const e of root.querySelectorAll('button,input,select,textarea,.item')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));
    if((e.tagName==='BUTTON'||e.classList.contains('item'))&&q.height<44)o.push('<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height));}
   for(const e of root.querySelectorAll('.pill')){const q=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect();if(q.right>s.right+1)o.push('札が親からはみ出す '+e.textContent.trim().slice(0,12))}
   return o});for(const x of r)errs.push(w+'px・'+fs+'・'+nm+'：'+x)};
 await chk('一覧');
 await p.evaluate("editQual('職員4')");await p.waitForTimeout(300);await chk('資格の窓');await p.evaluate("closeModal(true)");
 await p.evaluate("editQualList()");await p.waitForTimeout(300);await chk('種類の窓');await p.evaluate("closeModal(true)");
 await c.close()}console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
