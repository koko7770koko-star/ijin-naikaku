// 全画面と編集の窓：名前や内容に ' " < > & \\ を含む記録があるとき、押す所（onclick など）の命令が壊れず（組み立てて書き方の誤りが無い）、
// 画面に <b> などがそのままの文字で出る（太字にならない）か（hz-v-quote-names）。保存の形は変えない。外への通信は止める。usage: node hozen/tools/quotecheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const MODALS=["editEquip('e1')","editIssue('i1')","editWork('w1')","editPart('p1')","editTool('t1')","editLoc('lr')","editTask('k1')","editItem('it1')","editStd('s1')","editDwg('d1')","editMeas('m1')"];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(fs=>{const W=k=>k+"の'名前\"<b>&amp;\\",T=TODAY,ym=T.slice(0,7);
  S.locs=[{id:'lb',name:W('B'),type:'建屋',parent:''},{id:'lf',name:W('F'),type:'階',parent:'lb'},{id:'lr',name:W('R'),type:'電気室',parent:'lf'},{id:'lp',name:W('P'),type:'盤',parent:'lr'}];
  S.equipment=[{id:'e1',code:W('C'),name:W('E'),place:W('PL'),maker:W('M'),model:W('MD'),serial:W('S'),kind:'変圧器',status:'稼働',locId:'lr',repairs:[{id:'r1',date:T,kind:'修理',content:W('RC'),vendor:W('V')}]}];
  S.issues=[{id:'i1',date:T,title:W('IT'),detail:W('ID'),place:W('IP'),action:W('IA'),cause:W('IC'),status:'対応中',urgency:'高',equipId:'e1',due:T}];
  S.works=[{id:'w1',no:W('N'),date:T,title:W('WT'),content:W('WC'),place:W('WP'),vendor:W('WV'),status:'承認待ち',equipIds:['e1'],staff:[W('ST')]}];
  S.parts=[{id:'p1',code:W('PC'),name:W('PN'),spec:W('PS'),maker:W('PM'),place:W('PP'),qty:0,min:2}];
  S.tools=[{id:'t1',code:W('TC'),name:W('TN'),model:W('TM'),serial:W('TS'),maker:W('TK'),place:W('TP'),kind:'測定器',calDue:T}];
  S.tasks=[{id:'k1',date:T,time:'',kind:'定期',cat:S.settings.cats[0],title:W('KT'),place:W('KP'),staff:W('KS'),status:'予定',note:W('KN'),equipId:'e1'}];
  S.items=[{id:'it1',name:W('ITM'),cat:S.settings.cats[0],cycle:'毎月',base:addD(T,-40),who:'自社',track:true,equipId:'e1'}];
  S.stds=[{id:'s1',name:W('SN'),docNo:W('SD'),kinds:[]}];S.drawings=[{id:'d1',name:W('DN'),kind:'単線結線図',locId:'lr',vers:[]}];
  S.meas=[{id:'m1',date:T,type:'絶縁抵抗',name:W('MN'),equipId:'e1',by:W('MB'),note:W('MT'),rows:[{name:W('RN'),unit:'MΩ',min:10,max:'',v:100}]}];S.daily[T]={note:W('DN'),c:{}};S.handover={[T]:{text:W('HO'),by:W('HB'),at:''}};S.dnotes={[T]:W('DT')};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','works','locs','parts','tools','daily','stds','drawings','handover','dnotes','meas'])if(m[x])S[x]=m[x]}
  window.save=()=>{};S.settings.fscale=fs;applyFScale()},'m');
 const scan=`(()=>{const o=[];document.querySelectorAll('*').forEach(e=>{for(const a of e.attributes){if(!/^on/.test(a.name))continue;try{new Function(a.value)}catch(x){o.push(a.name+'='+a.value.slice(0,90)+' → '+x.message)}}});
   const bold=[...document.querySelectorAll('#app b,#modal b')].filter(b=>/^&amp;/.test(b.textContent)||b.textContent==='&amp;\\\\').length;return {o:o.slice(0,4),bold}})()`;
 const views=await p.evaluate(()=>Object.keys(VIEWS));
 const extra=[['equipDetail',{eq:'e1',eqTab:'ov'}],['equipDetail',{eq:'e1',eqTab:'hist'}],['stock',{stTab:'tools'}],['ban',{banRoom:'lr'}],['dwg',{dwg:'d1'}],['printDoc',{doc:{t:'issue',id:'i1'}}],['printDoc',{doc:{t:'work',id:'w1'}}]];
 for(const [v,ex] of [...views.filter(v=>!['equipDetail','dwg'].includes(v)).map(v=>[v,null]),...extra]){
  const r=await p.evaluate(([v,ex,scan])=>{try{if(ex)Object.assign(V,ex);go(v,ex||undefined)}catch(e){return {err:e.message}}return eval(scan)},[v,ex,scan]);
  if(r.err)bad.push(v+' を開けない '+r.err);else{r.o.forEach(x=>bad.push(v+'：押す所が壊れる '+x));if(r.bold)bad.push(v+'：名前の <b> が太字になる（esc 漏れ）')}}
 for(const m of MODALS){const r=await p.evaluate(([m,scan])=>{try{go('home');eval(m)}catch(e){return {err:e.message}}const x=eval(scan);try{closeModal(true)}catch(e){}return x},[m,scan]);
  if(r.err)bad.push(m+' を開けない '+r.err);else{r.o.forEach(x=>bad.push(m+'：押す所が壊れる '+x));if(r.bold)bad.push(m+'：名前の <b> が太字になる')}}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
