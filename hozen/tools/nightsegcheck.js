// 設定「画面の明るさ」の標準／夜間：2つのボタンが同じ幅・1行（390px 標準・360px 特大）。夜間の押し替えと保存が今までどおり。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[390,''],[360,'xl'],[390,'xl']]){
  const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale&&applyFScale();go('set')},fs);await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const g=document.querySelector('[aria-label="画面の明るさ"]');if(!g)return null;const bs=[...g.querySelectorAll('button')].map(x=>{const q=x.getBoundingClientRect();const lh=parseFloat(getComputedStyle(x).lineHeight)||parseFloat(getComputedStyle(x).fontSize)*1.3;return {w:q.width,h:q.height,lh,nw:getComputedStyle(x).whiteSpace==='nowrap',cut:x.scrollWidth>x.clientWidth+1}});return {bs,sw:document.documentElement.scrollWidth}});
  const t=`${w}px/${fs||'標準'}`;
  if(!r){bad.push(t+'：欄が無い');continue}
  if(r.bs.length!==2)bad.push(t+'：ボタンが2つでない');
  else{if(Math.abs(r.bs[0].w-r.bs[1].w)>4)bad.push(t+'：幅の差 '+Math.round(r.bs[0].w)+' / '+Math.round(r.bs[1].w));
   for(const x of r.bs)if(!x.nw||x.cut)bad.push(t+'：文字が割れる・切れる');}
  if(r.sw>w+2)bad.push(t+'：横にはみ出す');
  if(fs===''){await p.click('[aria-label="画面の明るさ"] button:nth-child(2)');await p.waitForTimeout(200);
   if(!await p.evaluate(()=>S.settings.night==='on'))bad.push('夜間にならない');
   await p.click('[aria-label="画面の明るさ"] button:nth-child(1)');await p.waitForTimeout(200);
   if(!await p.evaluate(()=>!S.settings.night))bad.push('標準に戻らない')}
  if(errs.length)bad.push(errs.join(';'));await c.close()}
 await b.close();console.log(bad.length?bad.join('\n'):'NO ERRORS');process.exit(bad.length?1:0)})();
