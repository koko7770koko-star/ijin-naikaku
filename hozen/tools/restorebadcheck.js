// 設定→バックアップの「復元」に、別のアプリの JSON・絵・CSV・古い版（SCHEMA 1・2）の記録を渡したとき、
// 分かる言葉で止まり、端末の記録（hospElecSched_v1・kinmuhyo_v1）が1文字も変わらないこと／古い版は読めて足りない項目が補われることを確かめる（hz-restore-bad-file）。
// 途中で切れた JSON・空・配列・書き換えは backupcheck.js が見ているので、ここでは足りない分だけ。
// usage: node hozen/tools/restorebadcheck.js   （外部への通信は止める）
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
const KEY='hospElecSched_v1',SKEY='kinmuhyo_v1';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rb-'));const put=(n,c)=>{const f=path.join(tmp,n);fs.writeFileSync(f,c);return f};
const REFUSE=[
 ['別のアプリの JSON {"a":1}',put('other.json','{"a":1}')],
 ['別のアプリの JSON（入れ子）',put('other2.json',JSON.stringify({name:'x',list:[1,2],config:{a:true}}))],
 ['数だけの JSON',put('num.json','42')],
 ['null の JSON',put('null.json','null')],
 ['文字列の JSON',put('str.json','"abc"')],
 ['絵（PNG）',put('pic.png',PNG)],
 ['CSV',put('list.csv','﻿日付,件名,場所\n2026-11-01,月次点検,A棟\n')],
 ['シフト表が壊れたバックアップ',put('badshift.json',JSON.stringify({settings:{},tasks:[],shift:{settings:{},members:'abc'}}))],
];
const T0='2026-11-05';
const OLD=[
 {name:'SCHEMA 1 の記録（apiKey 入り・schema 無し）',d:{settings:{name:'OLD1',apiKey:'sk-ant-OLDTESTKEY000000'},tasks:[{id:'t1',date:T0,title:'点検1'}],daily:{[T0]:{c:{noise:'○'}}}},
  test:s=>s.schema===3&&s.tasks.some(t=>t.title==='点検1')&&!('apiKey' in s.settings)&&Array.isArray(s.issues)&&Array.isArray(s.items)&&s.daily[T0]&&s.daily[T0].done==='移行'},
 {name:'SCHEMA 2 の記録（設備・不具合あり、v16 の項目無し）',d:{schema:2,settings:{name:'OLD2'},tasks:[{id:'t2',date:T0,title:'点検2'}],issues:[{id:'i2',date:T0,title:'不具合2'}],equipment:[{id:'e2',name:'設備2'}],daily:{[T0]:{c:{noise:'○'}}}},
  test:s=>s.schema===3&&s.tasks.some(t=>t.title==='点検2')&&s.issues.some(i=>i.title==='不具合2'&&Array.isArray(i.log)&&Array.isArray(i.photos))&&(s.equipment||[]).some(e=>e.name==='設備2')&&s.daily[T0].done==='移行'},
];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{S.tasks.push({id:'tkNow',date:'2026-11-01',time:'',kind:'月次',cat:'',title:'今の記録',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});save()});
 await p.waitForTimeout(800);
 const raw=()=>p.evaluate(([a,b])=>[localStorage.getItem(a),localStorage.getItem(b)],[KEY,SKEY]);
 const pick=async f=>{await p.evaluate(()=>{PENDING_RESTORE=null;closeModal(true);go('set')});await p.waitForTimeout(250);await p.setInputFiles('input[onchange^="restore("]',f,{timeout:5000});await p.waitForTimeout(700);return p.evaluate(()=>{const m=document.querySelector('#modal');return m?m.innerText:''})};
 for(const [n,f] of REFUSE){const r0=await raw();const t=await pick(f);
  ok(/復元できません/.test(t),n+'：「復元できません」が出ない（'+t.slice(0,60).replace(/\n/g,' ')+'）');
  ok(!/復元の確認/.test(t),n+'：復元の確認まで進んでしまう');
  ok(/。/.test(t.replace(/^復元できません/,''))||t.length>12,n+'：理由が書かれていない');
  await p.evaluate(()=>{PENDING_RESTORE=null;closeModal(true)});await p.waitForTimeout(300);
  const r1=await raw();ok(r0[0]===r1[0]&&r0[1]===r1[1],n+'：端末の記録が変わった');}
 for(const c of OLD){const f=put('old.json',JSON.stringify(c.d));const t=await pick(f);
  ok(/復元の確認/.test(t),c.name+'：復元の確認が出ない（'+t.slice(0,60).replace(/\n/g,' ')+'）');
  ok(/上書き/.test(t),c.name+'：「今のデータは上書きされます」の確かめが無い');
  await p.evaluate(()=>applyRestore());await p.waitForTimeout(1500);await p.evaluate(()=>closeModal(true));
  const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  ok(s&&c.test(s),c.name+'：読めない・足りない項目が補われない '+JSON.stringify(s&&{schema:s.schema,daily:s.daily}).slice(0,300));
  ok(!JSON.stringify(s).includes('OLDTESTKEY'),c.name+'：API キーが本体の記録に残った');
  for(const v of ['home','day','equip','issues','set']){await p.evaluate(v=>{try{go(v)}catch(e){console.error(v+' '+e.message)}},v);await p.waitForTimeout(80)}}
 console.log([...errs,...bad].slice(0,20).join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
