// 電気設備 総合保全管理：手で直された・古い版から来た「欠けた」記録で全画面と各件の窓を開き、エラーが出ないこと、
// 記録が消えないことを確かめる（hz-robust-views。oldcheck.js と重ならない欠け方だけ）。
// 不具合の date が無い件は validateData が外す決まり（原本はバックアップ履歴に残る）なので、ここでは date を入れる。
// usage: node hozen/tools/robustviewscheck.js   （外部への通信はすべて止めて確かめる）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
const KEY='hospElecSched_v1';const MARK='ROBUST_MARK';
const T='2026-11-05';
const CASES=[
 {name:'① 日常点検の数値が文字（"30"・空・null）',d:{settings:{name:MARK},daily:{[T]:{c:{a:'ok'},'電圧':'30','電流':'',温度:null,note:5,done:'x'},'2026-11-04':'abc','2026-11-03':null}}},
 {name:'② 設備に repairs・photos・docs が無い／形が違う',d:{settings:{name:MARK},equipment:[{id:'e1',name:MARK},{id:'e2',name:'設備2',repairs:'abc',photos:5,docs:{}},{id:'e3',name:'設備3',repairs:[null,{}],photos:[null],docs:[null]}]},keep:o=>(o.equipment||[]).some(e=>e.name===MARK)},
 {name:'③ 場所の parent が消えた id（孤児の盤・階）',d:{settings:{name:MARK},locs:[{id:'lp',name:MARK,type:'盤',parent:'gone'},{id:'lf',name:'1階',type:'階',parent:'gone2'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf'}],equipment:[{id:'e1',name:'設備1',locId:'lp'}],banChk:{'2026-11':{lp:'済'}}},keep:o=>(o.locs||[]).some(l=>l.name===MARK)},
 {name:'④ 不具合に log・photos が無い／形が違う',d:{settings:{name:MARK},issues:[{id:'i1',date:T,title:MARK},{id:'i2',date:T,title:'不具合2',log:'abc',photos:{},status:'対応中',due:'2026-01-01'},{id:'i3',date:T,title:'不具合3',log:[null,{}],photos:[null],prio:'へんな値'}]},keep:o=>(o.issues||[]).some(i=>i.title===MARK)},
 {name:'⑤ 作業に staff・outage が無い／形が違う',d:{settings:{name:MARK},works:[{id:'w1',title:MARK,date:T},{id:'w2',title:'作業2',date:T,staff:'abc',outage:'x'},{id:'w3',title:'作業3',staff:[null],outage:{},approve:5}]},keep:o=>(o.works||[]).some(w=>w.title===MARK)},
 {name:'⑥ 点検項目の cycle が空・へんな値',d:{settings:{name:MARK},items:[{id:'it1',name:MARK,cycle:''},{id:'it2',name:'項目2',cycle:null},{id:'it3',name:'項目3',cycle:'abc'},{id:'it4',name:'項目4',cycle:-3,last:'x'}]},keep:o=>(o.items||[]).some(i=>i.name===MARK)},
];
const ready=p=>p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
(async()=>{const b=await chromium.launch();const bad=[];
 for(const c of CASES){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text())});
  p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await ready(p);
  await p.waitForFunction(()=>localStorage.getItem('kinmuhyo_v1')!=null,null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(([k,v])=>{localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify({schema:3,...c.d})]);
  await p.reload();await ready(p);await p.waitForTimeout(500);
  await p.evaluate(()=>{try{closeModal(true)}catch(e){}});
  const views=await p.evaluate(()=>Object.keys(VIEWS));
  for(const v of views){if(v==='equipDetail')continue;await p.evaluate(v=>{try{go(v)}catch(e){console.error('go '+v+' '+e.message)}},v);await p.waitForTimeout(40)}
  // 各件の窓・詳しい画面
  await p.evaluate(()=>{const tr=(n,f)=>{try{f()}catch(e){console.error(n+' '+e.message)}finally{try{closeModal(true)}catch(e){}}};
   (S.equipment||[]).forEach(e=>{tr('equipDetail '+e.id,()=>go('equipDetail',{eq:e.id}));tr('editEquip '+e.id,()=>editEquip(e.id))});
   (S.issues||[]).forEach(i=>tr('editIssue '+i.id,()=>editIssue(i.id)));
   (S.works||[]).forEach(w=>tr('editWork '+w.id,()=>editWork(w.id)));
   (S.items||[]).forEach(i=>tr('editItem '+i.id,()=>editItem(i.id)));
   (S.locs||[]).forEach(l=>tr('editLoc '+l.id,()=>editLoc(l.id)));
   ['ban','locs','works','issues','day','month','year','report','hist','dailyRep','home'].forEach(v=>tr('go '+v,()=>go(v)));
  });await p.waitForTimeout(600);
  for(const v of ['home','month','day','shift','menu']){await p.click(`#nav button[data-v="${v}"]`,{timeout:2500,force:true}).catch(()=>errs.push('下のボタン '+v+' が押せない'));await p.waitForTimeout(150)}
  await p.evaluate(()=>{try{save()}catch(e){console.error('save '+e.message)}});await p.waitForTimeout(600);
  await p.reload();await ready(p);await p.waitForTimeout(400);
  if(c.keep){let o=null;try{o=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),KEY))}catch(e){}if(!o||!c.keep(o))errs.push('記録が消えた／変わった')}
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w+'px');
  console.log((errs.length?'NG ':'OK ')+c.name+(errs.length?'\n   '+[...new Set(errs)].slice(0,8).join('\n   '):''));if(errs.length)bad.push(c.name);
  await ctx.close();
 }
 console.log(bad.length?'FAILED '+bad.length+' 件':'ALL OK');await b.close();process.exit(bad.length?1:0)})();
