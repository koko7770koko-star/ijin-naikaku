// 窓（編集・詳しく）と印刷の帳票：使う人が入れる文に空白の無い長い英数字（60 字：製造番号・貼り付けたアドレスなど）があるとき、
// 390px の標準・特大で窓・画面が、印刷では紙の幅（794px）から横にはみ出さないか（hz-v-longword-modal）。はみ出したら、文が箱からはみ出している要素を出す。
// 保存の形は変えない。外への通信は止める。usage: node hozen/tools/longwordmodalcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const MODALS=["editEquip('e1')","editIssue('i1')","editWork('w1')","editPart('p1')","editTool('t1')","editLoc('lr')","editTask('k1')","editItem('it1')","editStd('s1')","editDwg('d1')","editMeas('m1')"];
const DOCS=[{t:'issue',id:'i1'},{t:'issueList'},{t:'work',id:'w1'},{t:'meas',id:'m1'},{t:'std',id:'s1'}];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
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
  S.meas=[{id:'m1',date:T,type:'絶縁抵抗',name:W('MN'),equipId:'e1',by:W('MB'),note:W('MT'),rows:[{name:W('RN'),unit:'MΩ',min:10,max:'',v:100}]}];S.daily[T]={note:W('DN'),c:{}};S.handover={[T]:{text:W('HO'),by:W('HB'),at:''}};S.dnotes={[T]:W('DT')};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','works','locs','parts','tools','daily','stds','drawings','handover','dnotes','meas'])if(m[x])S[x]=m[x]}
  window.save=()=>{};S.settings.fscale=fs;applyFScale()},fs);
 const spill=`[...document.querySelectorAll('ROOT *')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible').map(e=>e.tagName+'.'+e.className+' '+(e.textContent||'').trim().slice(0,24)).slice(-2).join(' | ')`;
 for(const m of MODALS){const r=await p.evaluate(([m,spill])=>{try{go('home');eval(m)}catch(e){return {err:e.message}}const md=document.querySelector('#modal');const sw=document.documentElement.scrollWidth,ms=md?md.scrollWidth-md.clientWidth:0;
   const out={sw,ms};if(sw>392||ms>2)out.el=eval(spill.replace('ROOT','#modal'));try{closeModal(true)}catch(e){}return out},[m,spill]);
  if(r.err)bad.push(tag+m+' を開けない '+r.err);else if(r.sw>392||r.ms>2)bad.push(tag+m+' の窓が横にはみ出す '+r.sw+'/'+r.ms+'：'+r.el)}
 for(const d of DOCS){const r=await p.evaluate(([d,spill])=>{try{go('printDoc',{doc:d})}catch(e){return {err:e.message}}const sw=document.documentElement.scrollWidth;return {sw,el:sw>392?eval(spill.replace('ROOT','#app')):''}},[d,spill]);
  if(r.err)bad.push(tag+'帳票 '+d.t+' を開けない '+r.err);else if(r.sw>392)bad.push(tag+'帳票 '+d.t+' が横にはみ出す '+r.sw+'：'+r.el)}
 if(fs==='m'){await p.emulateMedia({media:'print'});await p.setViewportSize({width:794,height:1123});
  for(const d of DOCS){const r=await p.evaluate(([d,spill])=>{go('printDoc',{doc:d});const sw=document.documentElement.scrollWidth;return {sw,el:sw>796?eval(spill.replace('ROOT','#app')):''}},[d,spill]);if(r.sw>796)bad.push('紙の幅・帳票 '+d.t+' が紙からはみ出す '+r.sw+'：'+r.el)}}
 await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
