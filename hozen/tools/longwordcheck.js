// 全画面：使う人が入れる文（設備・異常・作業・予備品・工具・場所・予定・点検項目・作業標準・図面・メモ・申し送り）に、空白の無い長い英数字（60 字：製造番号・貼り付けたアドレスなど）を
// 入れたとき、390px の標準・特大で横にはみ出す画面が無いか（hz-v-longword-all）。はみ出したら、いちばん右に出ている要素を出す。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/longwordcheck.js（幅と文字の大きさは VW=360 FS=l,xl で変えられる）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const VW=+(process.env.VW||390),FSL=(process.env.FS||'m,xl').split(',');
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const fs of FSL){const tag=({m:'標準',l:'大',xl:'特大'}[fs]||fs)+'・'+VW+'px・';
 const c=await b.newContext({viewport:{width:VW,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(fs=>{const W=k=>(k+'ABC123xyz').repeat(8).slice(0,60),T=TODAY,ym=T.slice(0,7);
  S.locs=[{id:'lb',name:W('B'),type:'建屋',parent:''},{id:'lf',name:W('F'),type:'階',parent:'lb'},{id:'lr',name:W('R'),type:'電気室',parent:'lf'},{id:'lp',name:W('P'),type:'盤',parent:'lr'}];
  S.equipment=[{id:'e1',code:W('C'),name:W('E'),place:W('PL'),maker:W('M'),model:W('MD'),serial:W('S'),kind:'変圧器',status:'稼働',locId:'lr',repairs:[{id:'r1',date:T,kind:'修理',content:W('RC'),vendor:W('V')}]}];
  S.issues=[{id:'i1',date:T,title:W('IT'),detail:W('ID'),place:W('IP'),action:W('IA'),cause:W('IC'),status:'対応中',urgency:'高',equipId:'e1',due:T}];
  S.works=[{id:'w1',no:W('N'),date:T,title:W('WT'),content:W('WC'),place:W('WP'),vendor:W('WV'),status:'承認待ち',equipIds:['e1'],staff:[W('ST')]}];
  S.parts=[{id:'p1',code:W('PC'),name:W('PN'),spec:W('PS'),maker:W('PM'),place:W('PP'),qty:0,min:2}];
  S.tools=[{id:'t1',code:W('TC'),name:W('TN'),model:W('TM'),serial:W('TS'),maker:W('TK'),place:W('TP'),kind:'測定器',calDue:T}];
  S.tasks=[{id:'k1',date:T,time:'',kind:'定期',cat:S.settings.cats[0],title:W('KT'),place:W('KP'),staff:W('KS'),status:'予定',note:W('KN'),equipId:'e1'}];
  S.items=[{id:'it1',name:W('ITM'),cat:S.settings.cats[0],cycle:'毎月',base:addD(T,-40),who:'自社',track:true,equipId:'e1'}];
  S.stds=[{id:'s1',name:W('SN'),docNo:W('SD'),kinds:[]}];S.drawings=[{id:'d1',name:W('DN'),kind:'単線結線図',locId:'lr',vers:[]}];
  S.daily[T]={note:W('DN'),c:{}};S.handover={[T]:{text:W('HO'),by:W('HB'),at:''}};S.dnotes={[T]:W('DT')};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','works','locs','parts','tools','daily','stds','drawings','handover','dnotes'])if(m[x])S[x]=m[x]}
  window.save=()=>{};S.settings.fscale=fs;applyFScale()},fs);
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 const extra=[['equipDetail',{eq:'e1',eqTab:'ov'}],['equipDetail',{eq:'e1',eqTab:'hist'}],['stock',{stTab:'tools'}],['stock',{stTab:'budget'}],['ban',{banRoom:'lr'}],['dwg',{dwg:'d1'}],['dailyRep',{day:'TODAY'}],['printDoc',{doc:{t:'issueList'}}]];
 for(const [v,ex] of [...views.filter(v=>!['equipDetail','dwg'].includes(v)).map(v=>[v,null]),...extra]){
  const r=await p.evaluate(([v,ex])=>{try{if(ex){for(const k in ex)if(ex[k]==='TODAY')ex[k]=TODAY;Object.assign(V,ex)}go(v,ex||undefined)}catch(e){return {err:e.message}}
   const sw=document.documentElement.scrollWidth;if(sw<=(typeof VW!=='undefined'?VW:innerWidth)+2)return {sw};let w=null,mx=0;document.querySelectorAll('#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>mx&&e.children.length===0){mx=r.right;w=e}});
   return {sw,el:w?(w.tagName+'.'+w.className+' '+(w.textContent||'').slice(0,20)):''}},[v,ex]);
  if(r.err)bad.push(tag+v+' を開けない '+r.err);else if(r.sw>(typeof VW!=='undefined'?VW:innerWidth)+2)bad.push(tag+v+(ex?JSON.stringify(ex):'')+' で横にはみ出す '+r.sw+'px：'+r.el)}
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
