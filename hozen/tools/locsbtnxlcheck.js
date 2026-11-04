// 設備の場所（locs）の下のボタン（＋棟を足す・棟と階をまとめて足す・設置場所の文字から階層を提案・QRラベル）：文字「大」「特大」・360px と標準 390px で、漢字・かなの間（「文/字」など）で行が割れない・はみ出さない。
// usage: node hozen/tools/locsbtnxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();go('locs')},fs);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const CJK=/[぀-ヿ一-鿿]/;const out=[];let n=0;
  [...document.querySelectorAll('#app button')].filter(x=>x.offsetParent&&/suggestLocs|bldgWizard|go\('qr'\)|locAdd\(/.test(x.getAttribute('onclick')||'')&&!x.closest('.emptyg,.empty')).forEach(x=>{n++;
   const bx=x.getBoundingClientRect();if(bx.right>innerWidth+0.5)out.push('「'+x.textContent.trim()+'」がはみ出す');
   const tw=document.createTreeWalker(x,NodeFilter.SHOW_TEXT);let t,prev=null,pt=null;
   while(t=tw.nextNode()){const s=t.textContent;for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const q=[...rg.getClientRects()].find(q=>q.width>0);if(!q)continue;const top=Math.round(q.top);
    if(pt!==null&&Math.abs(top-pt)>3&&CJK.test(prev)&&CJK.test(s[i]))out.push('「'+x.textContent.trim()+'」が「'+prev+'/'+s[i]+'」で割れる');prev=s[i];pt=top}}});
  return {n,out}});
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs];
 if(r.n<4)errs.push(tag+'：ボタンが足りない（'+r.n+'）');
 for(const x of r.out)errs.push(tag+'：'+x);
 await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
