// 予備品・工具：品名・型番・入出庫の担当とメモに空白の無い長い英数字（60 字）があるとき、幅 360px・特大で一覧と予備品の窓（入出庫の履歴つき）が
// 横にはみ出さず、印刷の形（A4 の紙の幅 794px）でも一覧が紙からはみ出さないか（hz-v-stock-print-longword）。保存の形は変えない。usage: node hozen/tools/stocklongwordcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:360,height:780}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 await p.evaluate(()=>{window.save=()=>{};const W=k=>(k+'ABC123xyz').repeat(8).slice(0,60),T=TODAY;
  S.parts=[{id:'p1',code:W('PC'),name:W('PN'),spec:W('PS'),maker:W('PM'),place:W('PP'),qty:3,unit:'個',min:5,price:100,equipIds:[],note:W('NT')}];
  S.tools=[{id:'t1',code:W('TC'),name:W('TN'),model:W('TM'),serial:W('TS'),maker:W('TK'),place:W('TP'),kind:'測定器',calDue:T,loans:[{by:W('LB'),at:T,back:''}]}];
  S.moves=[...Array(5)].map((_,i)=>({id:'mv'+i,partId:'p1',date:addD(T,-i),type:i%2?'出庫':'入庫',qty:1,after:3,ref:'',by:W('BY'),note:W('MN')}));
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['parts','tools','moves'])if(m[x])S[x]=m[x]}S.settings.fscale='xl';applyFScale()});
 const sp=`[...document.querySelectorAll('ROOT *')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible').map(e=>e.tagName+'.'+e.className+' '+(e.textContent||'').trim().slice(0,20)).slice(-2).join(' | ')`;
 for(const [lab,code,root] of [['予備品の一覧',"V.stTab='parts';go('stock')",'#app'],['工具の一覧',"V.stTab='tools';go('stock')",'#app'],['予備品の窓',"go('stock');editPart('p1')",'#modal']]){
  const r=await p.evaluate(([code,root,sp])=>{eval(code);const sw=document.documentElement.scrollWidth,m=document.querySelector('#modal');const ms=root==='#modal'&&m?m.scrollWidth-m.clientWidth:0;const o={sw,ms,hasMv:root==='#modal'?/MNABC123/.test((m||{}).innerText||''):true};if(sw>362||ms>2)o.el=eval(sp.replace('ROOT',root));try{closeModal(true)}catch(e){}return o},[code,root,sp]);
  if(!r.hasMv)bad.push(lab+'：入出庫の履歴が窓に出ていない（確かめの作りの誤り）');if(r.sw>362||r.ms>2)bad.push('360px・特大・'+lab+'：横にはみ出す '+r.sw+'/'+r.ms+'：'+r.el)}
 await p.evaluate(()=>{S.settings.fscale='m';applyFScale()});await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});
 for(const [lab,code] of [['予備品の一覧',"V.stTab='parts';go('stock')"],['工具の一覧',"V.stTab='tools';go('stock')"]]){
  const r=await p.evaluate(([code,sp])=>{eval(code);window.dispatchEvent(new Event('beforeprint'));const sw=document.documentElement.scrollWidth;const el=sw>796?eval(sp.replace('ROOT','#app')):'';window.dispatchEvent(new Event('afterprint'));return {sw,el}},[code,sp]);
  if(r.sw>796)bad.push('紙の幅・'+lab+'：紙からはみ出す '+r.sw+'：'+r.el)}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
