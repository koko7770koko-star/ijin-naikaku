// 印刷（A4 の紙の幅）：使う人が入れる文に空白の無い長い英数字（60 字）があるとき、日報・月報・年報・作業表・盤の点検表・年間計画・設備の詳しく・点検履歴を
// 印刷の形（print、幅 794px）にして、紙の幅から横にはみ出さず、文が箱から右へはみ出さないか（hz-v-longword-paper）。保存の形は変えない。usage: node hozen/tools/longwordpapercheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const PAGES=[['dailyRep',{day:'TODAY'}],['report',{}],['report',{rpY:1}],['workSheet',{}],['ban',{banRoom:'lr'}],['year',{}],['equipDetail',{eq:'e1',eqTab:'ov'}],['equipDetail',{eq:'e1',eqTab:'hist'}],['hist',{hRange:'all'}],['issues',{isF:'all'}],['works',{wkF:'all'}],['stock',{stTab:'parts'}],['stock',{stTab:'tools'}]];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:794,height:1123}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
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
  S.meas=[{id:'m1',date:T,type:'絶縁抵抗',name:W('MN'),equipId:'e1',by:W('MB'),note:W('MT'),rows:[{name:W('RN'),unit:'MΩ',min:10,max:'',v:100}]}];S.daily[T]={note:W('DN'),c:{},by:W('BY')};S.banChk={[ym]:{lp:['済','済','']}};S.handover={[T]:{text:W('HO'),by:W('HB'),at:''}};S.dnotes={[T]:W('DT')};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','works','locs','parts','tools','daily','stds','drawings','handover','dnotes','meas'])if(m[x])S[x]=m[x]}
  window.save=()=>{};S.settings.fscale=fs;applyFScale()},'m');await p.emulateMedia({media:'print'});
 for(const [v,ex] of PAGES){const r=await p.evaluate(([v,ex])=>{for(const k in ex)if(ex[k]==='TODAY')ex[k]=TODAY;Object.assign(V,ex);try{go(v,ex)}catch(e){return {err:e.message}}
   window.dispatchEvent(new Event('beforeprint'));const sw=document.documentElement.scrollWidth;
   const sp=[...document.querySelectorAll('#app *')].filter(e=>e.offsetParent!==null&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible').map(e=>e.tagName+'.'+e.className+' '+(e.textContent||'').trim().slice(0,24));
   window.dispatchEvent(new Event('afterprint'));return {sw,sp:sp.slice(-3)}},[v,ex]);
  if(r.err)bad.push(v+' を開けない '+r.err);else if(r.sw>796||r.sp.length)bad.push(v+JSON.stringify(ex)+'：紙からはみ出す '+r.sw+' '+r.sp.join(' | '))}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
