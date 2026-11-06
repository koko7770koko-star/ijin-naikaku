// ホームの印刷（朝礼で配る）：異常 8 件・今日の予定 5 件・今日の作業 5 件・盤 10 面・申し送り 3 行の日に A4 1 枚に収まる。
// たたんだ一覧の見出し・「写真で入力」の札は紙に出さない。画面の見た目は変わらない（hz-v-home-print-a4）
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:718,height:900}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const d=TODAY;S.issues=[];for(let i=0;i<8;i++)S.issues.push({id:'hpi'+i,title:'異常'+i+' 受変電設備の盤内で発熱',status:'未対応',urgency:'高',date:addD(d,-20-i),equipId:'',place:'',detail:'',action:'',photos:[],approvals:[]});
  S.tasks=S.tasks||[];for(let i=0;i<5;i++)S.tasks.push({id:'hpt'+i,date:d,time:'1'+i+':00',kind:'月次',cat:'',title:'試しの点検'+i+' 受変電設備の外観点検',place:'',staff:'担当',attend:'',status:'予定',result:'',note:'',photos:[]});
  for(let i=0;i<7;i++)S.tasks.push({id:'hpu'+i,date:addD(d,1+i),time:'10:00',kind:'月次',cat:'',title:'先の点検'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]});
  S.works=S.works||[];for(let i=0;i<5;i++)S.works.push({id:'hpw'+i,no:'W-'+i,title:'試しの作業'+i+' 照明器具の交換',kind:'修理',status:'予定',date:d,endDate:'',start:'13:00',end:'15:00',equipIds:[],staff:['職員1'],vendor:'',vendorStaff:'',outage:{on:false},cost:'',approvals:[],content:'',result:'',place:'',pre:[],post:[],photos:[],hist:[]});
  const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});const L=[mk('hb1','棟1','建屋',''),mk('hf1','階1','階','hb1')];for(let i=0;i<10;i++)L.push(mk('hp'+i,'盤'+i,'盤','hf1'));S.locs=L;
  S.handover=S.handover||{};S.handover[d]={text:'申し送り1行目\n2行目\n3行目',by:'',at:Date.now()};
  go('home')});await p.waitForTimeout(500);
 const scr=await p.evaluate(()=>{const t=document.querySelector('#app .tile');return t?getComputedStyle(t).paddingTop:''});
 if(scr!=='9px')bad.push('画面の数字の札の余白が変わった '+scr);
 await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
 const r=await p.evaluate(()=>{const vis=e=>{const q=e.getBoundingClientRect();return q.width>0&&q.height>0};
  return {fold:[...document.querySelectorAll('#app details.fold:not([open])')].filter(vis).length,quick:[...document.querySelectorAll('#app .quick')].filter(vis).length,
   rowH:Math.max(0,...[...document.querySelectorAll('#app .item')].filter(vis).map(e=>e.getBoundingClientRect().height))}});
 if(r.fold)bad.push('たたんだ一覧の見出しが紙に出る '+r.fold);
 if(r.quick)bad.push('「写真で入力」などの札が紙に出る '+r.quick);
 if(r.rowH>48)bad.push('予定の行が高い（1行になっていない） '+Math.round(r.rowH)+'px');
 const buf=await p.pdf({format:'A4'});const n=(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
 if(n!==1)bad.push('A4 '+n+' 枚になる（1枚に収まらない）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
