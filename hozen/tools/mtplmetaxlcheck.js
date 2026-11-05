// 文字「大」「特大」・360px：測定のひな形（mtpl）の一覧の下の行「絶縁抵抗（高圧）（100〜MΩ）・接地抵抗（A種）（〜10Ω）・…・周期 12か月」が
// 言葉の途中（「接／地抵抗」「基準／未設定」）で割れず、行が「・」から始まらないことを確かめる（hz-l-mtpl-mset）。名前は「ひな形1」の形だけ。
// usage: node hozen/tools/mtplmetaxlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['xl',360],['l',360],['l',390]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY;
   S.mtpl=[...Array(3)].map((_,i)=>({id:'mt'+i,type:MEAS_TYPES[0],name:'ひな形'+(i+1),cycleM:12,kind:'変圧器',rows:[{name:'絶縁抵抗（高圧）',unit:'MΩ',min:100,max:''},{name:'接地抵抗（A種）',unit:'Ω',min:'',max:10},{name:'電圧',unit:'kV',min:6.3,max:6.9},{name:'周波数',unit:'Hz',min:'',max:''},{name:'外観',unit:'',min:'',max:'',ck:true}]}));
   S.settings.fscale=fs;save();applyFScale();go('mtpl');const o=[];
   document.querySelectorAll('#app .item .meta').forEach(m=>{if(!m.querySelector('.nwl'))o.push('区切りのまとまりが無い 「'+m.innerText+'」');
    m.querySelectorAll('.nwl').forEach(n=>{const fsz=parseFloat(getComputedStyle(n).fontSize);if(n.getBoundingClientRect().height>fsz*2)o.push('言葉の途中で割れる 「'+n.innerText+'」')});
    const w=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let x,prev=null;while(x=w.nextNode()){for(let i=0;i<x.textContent.length;i++){const rg=document.createRange();rg.setStart(x,i);rg.setEnd(x,i+1);const q=rg.getClientRects()[0];if(!q)continue;const t=Math.round(q.top);if(prev!=null&&t>prev+3&&x.textContent[i]==='・')o.push('行が「・」から始まる');prev=t}}});
   if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)o.push('ページが横にはみ出す');
   return [...new Set(o)]},fs);
  r.forEach(x=>errs.push(fs+W+' '+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
