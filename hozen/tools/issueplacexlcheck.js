// 文字「大」「特大」・360px：異常・修理の一覧で、題のあとの場所「（A棟 › 1階 › 第1電気室 › 動力盤-1）」「（A棟 1階 第1電気室）」が
// 段の途中（「動力／盤-1」「第1／電気室」）で割れないこと、ページが横にはみ出さないことを確かめる（hz-l-issues-list）。名前は「動力盤-1」の形だけ。
// usage: node hozen/tools/issueplacexlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['xl',360],['l',360],['l',390]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{const T=TODAY;const U=['緊急','高','中','低'];
   S.issues=[...Array(8)].map((_,i)=>({id:'qi'+i,date:addD(T,-i*3),title:i===0?'不具合1：分電盤の端子に変色があり、増し締めと熱画像での確認が必要（再発）':'不具合'+(i+1)+'：端子の変色',place:i%2?'A棟 › 1階 › 第1電気室 › 動力盤-1':'A棟 1階 第1電気室',detail:'',status:'発見',urgency:U[i%4],due:addD(T,-2),action:'',photos:[],log:[]}));
   S.settings.fscale=fs;save();applyFScale();go('issues');
   const o=[];const words=['動力盤-1','第1電気室','A棟','1階'];
   document.querySelectorAll('#app .item .ti').forEach(t=>{if(!/[（(]/.test(t.innerText))return;
    if(!t.querySelector('.nwl'))o.push('場所に区切りが無い 「'+t.innerText.slice(0,40)+'」');
    t.querySelectorAll('.nwl').forEach(n=>{if(words.includes(n.innerText)&&n.getClientRects().length>1)o.push('場所の段が割れる 「'+n.innerText+'」');
     const fsz=parseFloat(getComputedStyle(n).fontSize);if(words.includes(n.innerText)&&n.getBoundingClientRect().height>fsz*2)o.push('場所の段が割れる 「'+n.innerText+'」')})});
   if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)o.push('ページが横にはみ出す');
   return [...new Set(o)]},fs);
  r.forEach(x=>errs.push(fs+W+' '+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
