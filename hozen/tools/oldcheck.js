// 電気設備 総合保全管理：古い形・空・壊れた記録を localStorage に入れて開き、エラーが出ない・記録が消えないことを確かめる。
// usage: node hozen/tools/oldcheck.js   （外部への通信はすべて止めて確かめる）
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
const KEY='hospElecSched_v1',SKEY='kinmuhyo_v1';
const MARK='OLDCHECK_MARK';
const CASES=[
 {name:'空（何も入っていない）',ls:{}},
 {name:'最小の古い記録（settings だけ）',ls:{[KEY]:JSON.stringify({settings:{name:MARK}})},keep:o=>o.settings&&o.settings.name===MARK},
 {name:'空のオブジェクト',ls:{[KEY]:'{}'}},
 {name:'項目が欠けた記録（予定・異常に項目が足りない）',ls:{[KEY]:JSON.stringify({settings:{name:MARK},tasks:[{id:'t1',date:'2026-11-03',title:MARK}],issues:[{id:'i1',title:MARK}],daily:{'2026-11-03':{}},items:[{id:'it1',name:MARK}]})},
  keep:o=>JSON.stringify(o).includes(MARK)&&(o.tasks||[]).some(t=>t.title===MARK)},
 {name:'JSON が壊れたメイン記録',ls:{[KEY]:'{"settings":{"name":"'+MARK+'"'},rawKeep:'"name":"'+MARK+'"'},
 {name:'JSON が壊れたシフト表の記録',ls:{[SKEY]:'{"members":[{"name":"'+MARK},rawKeep:MARK},
 {name:'配列でない値（tasks が文字列）',ls:{[KEY]:JSON.stringify({settings:{name:MARK},tasks:'abc',issues:5,daily:[]})}},
 // 2026-11-03 に足した物（場所の4段・並べ替えの ord・盤の ⚠・燃料の時間・作業の畳み）を、項目が欠けた／おかしい記録で開く（hz-old-today）
 {name:'今日足した物の項目が欠けた記録（locs の type・parent・pos・ord が無い／おかしい・spec 無し・works の staff/needQuals 無し・banChk 無し・図面の pins 無し）',
  ls:{[KEY]:JSON.stringify({settings:{name:MARK},
   locs:[{id:'la',name:'A棟',type:'建屋'},{id:'lf',name:'1階',type:'階',parent:'la',ord:'x'},{id:'lr',name:'第1電気室',type:'電気室',parent:'lf',ord:2},{id:'lp',name:'動力盤-1',type:'盤',parent:'lr',pos:null},{id:'lq',name:'動力盤-2',type:'へんな段',parent:'lr'},{id:'lz',name:'親が無い盤',type:'盤',parent:'nonexist'},{id:'lc1',name:'輪1',type:'電気室',parent:'lc2'},{id:'lc2',name:'輪2',type:'階',parent:'lc1'},{name:'id の無い場所',type:'棟'}],
   equipment:[{id:'e1',name:'非常用発電機',kind:'発電機',locId:'lp'},{id:'e2',name:MARK,locId:'nonexist',spec:'abc'}],
   meas:[{id:'m1',equipId:'e1',date:'2026-11-01',rows:[{name:'燃料残量',v:50}]},{id:'m2',equipId:'e1',date:'2026-11-02',rows:'abc'}],
   works:[{id:'w1',title:MARK,date:'2026-11-03'}],
   issues:[{id:'i1',title:'盤の異常',place:'A棟 › 1階 › 第1電気室 › 動力盤-1'},{id:'i2',title:'場所なし',place:null}],
   drawings:[{id:'d1',name:'図面',vers:[]}],
   banChk:{'2026-11':{lp:['済'],lq:'abc',lz:null}}})},
  keep:o=>JSON.stringify(o).includes(MARK)&&(o.locs||[]).some(l=>l.id==='lp'&&l.name==='動力盤-1')&&(o.equipment||[]).some(e=>e.id==='e1'),
  extra:true},
];
(async()=>{const b=await chromium.launch();const bad=[];
 for(const c of CASES){
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push('CONSOLE '+m.text())});
  p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  // 起動直後のシフト表の save()（250ms 遅れ）が入れ替えの後に走ると、入れた壊れた記録を初期値で上書きしてしまう（テスト側の競合。hz-tool-flaky3）。保存が済むまで待ってから入れ替える
  await p.waitForFunction(()=>localStorage.getItem('kinmuhyo_v1')!=null,null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(400);
  await p.evaluate(ls=>{localStorage.clear();for(const k in ls)localStorage.setItem(k,ls[k])},c.ls);await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(500);
  const views=await p.evaluate(()=>Object.keys(VIEWS));
  for(const v of views){if(v==='equipDetail')continue;await p.evaluate(v=>{try{go(v)}catch(e){console.error('go '+v+' '+e.message)}},v);await p.waitForTimeout(40)} // 描き直しはその場で終わるので短く（遅い確かめの道具を短く：hz-tools-slow）
  if(c.extra){// 今日足した画面と操作を、その記録で1つずつ開く（エラーが出ないこと）
   await p.evaluate(()=>{const tr=(n,f)=>{try{f()}catch(e){console.error(n+' '+e.message)}};const L=S.locs||[],E=S.equipment||[];
    tr('locs',()=>{go('locs');locFold(true)});L.forEach(l=>{tr('locMenu '+l.id,()=>{locMenu(l.id);closeModal(true)});tr('locEquip '+l.id,()=>{locEquip(l.id);closeModal(true)});tr('locAdd '+l.id,()=>{locAdd(l.id);closeModal(true)})});
    tr('ban',()=>go('ban'));banBldgs().forEach(b=>tr('ban '+b.id,()=>{V.banB=b.id;render()}));L.filter(l=>l.type==='盤').forEach(l=>tr('banIssue',()=>{banIssue(l.id);closeModal(true)}));
    tr('banEdit',()=>{V.banEdit=true;render();V.banEdit=false;render()});tr('bldgWizard',()=>{bldgWizard();closeModal(true)});tr('banAddWizard',()=>{banAddWizard();closeModal(true)});
    E.forEach(e=>tr('equipDetail '+e.id,()=>go('equipDetail',{eq:e.id})));(S.drawings||[]).forEach(d=>tr('dwg',()=>go('dwg',{dwg:d.id})));
    (S.meas||[]).forEach(m=>tr('editMeas '+m.id,()=>{editMeas(m.id)}));setTimeout(()=>closeModal(true),300)});await p.waitForTimeout(700);
   // 親が見つからない場所・輪になった場所も、設備の場所の木に出る（消えて見えなくならない）
   const vis=await p.evaluate(()=>{go('locs');locFold(true);return [...document.querySelectorAll('.locn[data-loc]')].map(e=>e.dataset.loc)});
   ['lz','lc1','lc2','lp'].forEach(id=>{if(!vis.includes(id))errs.push('場所 '+id+' が木に出ない（'+vis.join()+'）')});if(new Set(vis).size!==vis.length)errs.push('木に同じ場所が2回出る');
  }
  for(const v of ['home','month','day','shift','menu']){await p.click(`#nav button[data-v="${v}"]`,{timeout:2500,force:true}).catch(()=>errs.push('下のボタン '+v+' が押せない'));await p.waitForTimeout(150)}
  await p.evaluate(()=>{try{save()}catch(e){console.error('save '+e.message)}});await p.waitForTimeout(600);
  await p.reload();await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(500);
  const dump=await p.evaluate(async()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}
   try{const dbs=await indexedDB.databases();o.__idb=JSON.stringify(dbs)}catch(e){}return o});
  if(c.keep){let o=null;try{o=JSON.parse(dump[KEY])}catch(e){}if(!o||!c.keep(o))errs.push('記録が消えた／変わった: '+c.name)}
  if(c.rawKeep){const all=Object.values(dump).join('\n');let inIdb=false;
   try{inIdb=await p.evaluate(async(m)=>{const dbs=await indexedDB.databases();for(const d of dbs){const db=await new Promise((ok,ng)=>{const r=indexedDB.open(d.name);r.onsuccess=()=>ok(r.result);r.onerror=ng});for(const s of [...db.objectStoreNames]){const all=await new Promise(ok=>{const r=db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>ok([])});if(JSON.stringify(all).includes(m.replace(/"/g,'\\"'))||JSON.stringify(all).includes(m))return true}}return false},c.rawKeep)}catch(e){}
   if(!all.includes(c.rawKeep)&&!inIdb)errs.push('壊れた記録の原本がどこにも残っていない: '+c.name)}
  const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)errs.push('横にはみ出す '+w+'px');
  console.log((errs.length?'NG ':'OK ')+c.name+(errs.length?'\n   '+errs.slice(0,6).join('\n   '):''));if(errs.length)bad.push(c.name);
  await ctx.close();
 }
 console.log(bad.length?'FAILED '+bad.length+' 件':'ALL OK');await b.close();process.exit(bad.length?1:0)})();
