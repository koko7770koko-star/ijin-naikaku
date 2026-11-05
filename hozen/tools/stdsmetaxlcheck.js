// 文字「大」「特大」・360px：作業標準（stds）の一覧の下の行「SOP-…・作業前8項目（必須4）・作業後4項目」が言葉の途中（「必／須4」）で割れず、
// 行が「・」から始まらないことを確かめる（hz-l-stds）。名前は「作業標準1」「職員1」の形だけ。
// usage: node hozen/tools/stdsmetaxlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['xl',360],['l',360],['l',390]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY;
   S.stds=[...Array(4)].map((_,i)=>({id:'sd'+i,name:'作業標準'+(i+1),docNo:'SOP-ELE-'+(1000+i),ver:'3.2',kinds:[],pre:[...Array(8)].map((_,k)=>({text:'作業前の確認'+(k+1),req:k%2===0})),post:[...Array(4)].map((_,k)=>({text:'作業後の確認'+(k+1),req:true})),note:'',hist:[],approvedBy:'',approvedRole:'',approvedDate:''}));
   S.settings.fscale=fs;save();applyFScale();go('stds');const o=[];
   document.querySelectorAll('#app .item .meta').forEach(m=>{if(!m.querySelector('.nwl'))o.push('区切りのまとまりが無い 「'+m.innerText+'」');
    m.querySelectorAll('.nwl').forEach(n=>{const fsz=parseFloat(getComputedStyle(n).fontSize);if(n.getBoundingClientRect().height>fsz*2)o.push('言葉の途中で割れる 「'+n.innerText+'」')});
    const w=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let x,prev=null;while(x=w.nextNode()){for(let i=0;i<x.textContent.length;i++){const rg=document.createRange();rg.setStart(x,i);rg.setEnd(x,i+1);const q=rg.getClientRects()[0];if(!q)continue;const t=Math.round(q.top);if(prev!=null&&t>prev+3&&x.textContent[i]==='・')o.push('行が「・」から始まる');prev=t}}});
   if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)o.push('ページが横にはみ出す');
   return [...new Set(o)]},fs);
  r.forEach(x=>errs.push(fs+W+' '+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
