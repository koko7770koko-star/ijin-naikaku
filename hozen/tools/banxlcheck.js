// 文字「大」「特大」・360px：盤の点検表で、盤の名前（動力盤-1・電灯分電盤-1）が1字ずつ折れず、◯●のボタンに重ならず、
// 1つの盤のボタン4つ（盤内発熱・端子および碍子・その他異常・⚠）が1行に並び 44px 以上で、見出しの列とボタンの列がそろうことを確かめる（hz-l-ban）。
// 標準の文字（390px）では名前とボタンが同じ行のまま（前と同じ形）であることも見る。名前は「動力盤-1」の形だけ。
// usage: node hozen/tools/banxlcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [fs,W] of [['',390],['xl',360],['l',360]]){
  const c=await b.newContext({viewport:{width:W,height:780}});const p=await c.newPage();p.on('dialog',d=>d.dismiss().catch(()=>{}));p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);
  const r=await p.evaluate(fs=>{
   S.locs=[{id:'L1',type:'建屋',name:'A棟',parent:''},{id:'L2',type:'階',name:'1階',parent:'L1'},{id:'L3',type:'電気室',name:'第1電気室',parent:'L2'},{id:'L5',type:'電気室',name:'第2電気室',parent:'L2'}];
   for(let i=1;i<=12;i++)S.locs.push({id:'P'+i,type:'盤',name:'動力盤-'+i,parent:'L3'});
   for(let i=1;i<=5;i++)S.locs.push({id:'Q'+i,type:'盤',name:'電灯分電盤-'+i,parent:'L5'});
   S.settings.fscale=fs;save();applyFScale();go('ban');
   const o=[],R=e=>e.getBoundingClientRect(),hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
   const rows=[...document.querySelectorAll('#app .banrow:not(.bh)')].filter(x=>x.querySelector(':scope>.bn'));
   if(!rows.length)o.push('盤の行が無い');
   rows.forEach(row=>{const bn=row.querySelector(':scope>.bn'),nm=bn.firstChild&&bn.firstChild.textContent||'';
    const btn=[...row.querySelectorAll(':scope>.bm')];
    if(btn.length!==4)o.push(nm+'：ボタンが4つでない '+btn.length);
    const rg=document.createRange();rg.selectNodeContents(bn.firstChild);const tops=new Set([...rg.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top)));
    if(fs&&tops.size>1)o.push(nm+'：名前が折れる（'+tops.size+'行）');
    btn.forEach(x=>{const a=R(x);if(a.height<43.5||a.width<43.5)o.push(nm+'：ボタンが小さい '+Math.round(a.width)+'x'+Math.round(a.height));if(hit(R(bn),a))o.push(nm+'：名前がボタンに重なる')});
    if(new Set(btn.map(x=>Math.round(R(x).top))).size>1)o.push(nm+'：ボタンが1行に並ばない');
    if(!fs&&btn[0]&&Math.abs(R(bn).top-R(btn[0]).top)>30)o.push(nm+'：標準の文字で名前とボタンが別の行になった')});
   // 見出しの列（盤内発熱・端子・その他）の真ん中が、すぐ下の盤のボタンの真ん中とそろう
   const hd=document.querySelector('#app .banrow.bh');if(hd&&fs){const hb=[...hd.querySelectorAll(':scope>.bi')].slice(0,3);const row=hd.nextElementSibling&&hd.nextElementSibling.matches('.banrow')?hd.nextElementSibling:rows[0];
    const bb=[...row.querySelectorAll(':scope>.bm')].slice(0,3);hb.forEach((h,i)=>{if(!bb[i])return;const d=Math.abs((R(h).left+R(h).right)/2-(R(bb[i]).left+R(bb[i]).right)/2);if(d>8)o.push('見出し「'+h.innerText.replace(/\s/g,'')+'」がボタンの列とずれる '+Math.round(d)+'px')})}
   if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)o.push('ページが横にはみ出す');
   return [...new Set(o)]},fs);
  r.forEach(x=>errs.push((fs||'標準')+W+' '+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
