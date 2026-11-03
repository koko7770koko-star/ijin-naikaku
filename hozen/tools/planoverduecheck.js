// 点検計画（点検期限）：期限超過→30日以内→それ以降→記録なし の順、超過は赤（ng）・30日以内は橙（warn）。記録は変えない。390px
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 const before=await p.evaluate(()=>{
  const mk=(id,name,base)=>({id,name,cat:'電気',cycle:'年1回',who:'自主',legal:'法定',base,track:true,note:''});
  const d=n=>addD(TODAY,n);
  // 前回実施日が分からない項目は base を期限に使う：順番をわざとばらす
  S.items=[mk('i_far','遠い',d(200)),mk('i_none','記録なし',''),mk('i_soon','もうすぐ',d(10)),mk('i_over','超過',d(-5)),mk('i_over2','大超過',d(-40))];
  S.marks={};DL_CACHE=null;go('plan',{plTab:'legal'});return JSON.stringify([S.items,S.marks])});
 await p.waitForTimeout(300);
 const r=await p.evaluate(()=>[...document.querySelectorAll('.item')].map(e=>({n:e.querySelector('.ti').textContent.trim().replace(/\s*法定$/,''),cls:e.querySelector('.pill').className,top:e.getBoundingClientRect().top,sw:document.documentElement.scrollWidth})));
 const names=r.map(x=>x.n).join(',');
 if(!/^大超過,超過,もうすぐ,遠い,記録なし/.test(names))bad.push('並びが違う '+names);
 const cls=Object.fromEntries(r.map(x=>[x.n,x.cls]));
 if(!/ng/.test(cls['大超過']||'')||!/ng/.test(cls['超過']||''))bad.push('超過が赤でない '+JSON.stringify(cls));
 if(!/warn/.test(cls['もうすぐ']||''))bad.push('30日以内が橙でない');
 if(/ng|warn/.test(cls['遠い']||''))bad.push('遠いのに色がつく');
 if(r.some(x=>x.sw>392))bad.push('はみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
