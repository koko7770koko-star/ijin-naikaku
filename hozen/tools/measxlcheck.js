// 測定記録の窓（editMeas）：文字「特大」「大」・360px で、測定値の欄が細くならない（hz-xl-meas-modal）
// ①測定値の欄が幅 120px 以上 ②単位・下限・上限の欄が 60px 以上で例の文字が切れない ③横にはみ出さない
// ④場所の木の設備の行の名前の欄が 8 文字ぶん近く取れる（「非常用発/電機1」と割れない）
// usage: node hozen/tools/measxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  await p.evaluate(f=>{S.settings.fscale=f;save();applyFScale();editMeas(null,{rows:[{name:'絶縁抵抗',unit:'MΩ',min:'',max:'',ck:false,v:''}]})},fs);
  await p.waitForSelector('#ms_rows input[data-mv]');
  const r=await p.evaluate(()=>{const o=[];const row=document.querySelector('#ms_rows input[data-mv]').parentElement;const ins=[...row.querySelectorAll('input')];
   const wd=ins.map(i=>Math.round(i.getBoundingClientRect().width));
   if(wd[0]<120)o.push('測定値の欄が細い '+wd[0]+'px');
   if(innerWidth<=360)wd.slice(1).forEach((x,i)=>{if(x<60)o.push('単位・下限・上限の欄が細い '+x+'px（'+(i+1)+'番）')});
   if(document.documentElement.scrollWidth>innerWidth+1)o.push('はみ出す');return o});
  if(fs){const q=await p.evaluate(()=>{S.locs=[{id:'L0',name:'A棟',type:'建屋',parent:'',note:'',pos:{}},{id:'L1',name:'1階',type:'階',parent:'L0',note:'',pos:{}},{id:'L2',name:'第1電気室',type:'電気室',parent:'L1',note:'',pos:{}}];
   S.equipment=[{id:'G1',code:'G-1',name:'非常用発電機1',kind:'発電機',locId:'L2',importance:'A',status:'稼働',place:'',photos:[],docs:[],repairs:[],health:[]}];closeModal(true);go('locs');locFold(true);
   const i=[...document.querySelectorAll('.locn .item')].find(x=>!x.querySelector(':scope>.row')&&/発電機/.test(x.textContent));const t=i&&i.querySelector('.ti');return t?Math.round(t.getBoundingClientRect().width/parseFloat(getComputedStyle(t).fontSize)):-1});
   if(q<8)r.push('設備の行の名前の欄が細い（'+q+'文字ぶん）')}
  const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';r.forEach(x=>errs.push(tag+x));await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
