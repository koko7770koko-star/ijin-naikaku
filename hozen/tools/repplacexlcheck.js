// 日報（dailyRep）・報告書の月報/年報（report）の表：文字「大」「特大」・360px で、場所「A棟 › 1階 › 第1電気室 › 動力盤-1」が段の途中（「動力／盤-1」「第1／電気室」）で割れない。
// 画面だけ直す（印刷の見た目は変えない：printDoc の確かめは banprinta4check などが見る）。hz-rep-place-screen
// usage: node hozen/tools/repplacexlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['xl',360],['l',360],['',390]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY,PL='A棟 › 1階 › 第1電気室 › 動力盤-1',o=[];
   S.tasks=[...Array(3)].map((_,i)=>({id:'t'+i,title:'点検'+i,date:T,time:'09:0'+i,kind:'月次',place:PL,status:'完了',result:'良',staff:'職員1',equipId:''}));
   S.issues=[{id:'i1',title:'異常1',date:T,place:PL,status:'対応中',action:'',closed:''}];
   S.settings.fscale=fs;save();applyFScale();
   const words=['動力盤-1','第1電気室'];
   const scan=tag=>{const root=document.querySelector('#app');if(!fs)return;const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while(n=tw.nextNode()){const el=n.parentElement;if(!el||el.closest('input,textarea,select,option,script,style'))continue;
     for(const w of words){let i=n.data.indexOf(w);while(i>=0){const rg=document.createRange();rg.setStart(n,i);rg.setEnd(n,i+w.length);
      const tops=new Set([...rg.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top)));
      if(tops.size>1)o.push(tag+'：「'+w+'」が段の途中で割れる（'+el.tagName.toLowerCase()+'）');i=n.data.indexOf(w,i+1)}}}};
   go('dailyRep',{day:T});scan('日報');
   const y=now.getFullYear(),m=now.getMonth()+1;V.ry=y;V.rm=m;V.rfy=m>=4?y:y-1;
   V.rmode='m';go('report');scan('月報');V.rmode='y';go('report');scan('年報');
   return o},fs);
  r.forEach(x=>errs.push((fs||'標準')+'・'+W+'px・'+x));await c.close()}
 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
