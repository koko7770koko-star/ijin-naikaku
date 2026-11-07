// 設備カルテ：1 台に点検 1000・測定 500・異常 200・修理 100 件が集中し、ほかに設備 500 台・予定 6000・測定 5000 があるとき、
// カルテの 4 つのタブがそれぞれ 1 秒以内に出て、横にはみ出さず、印刷（A4）が作れるか（標準・特大。保存しない。hz-v-eqdetail-hist-many）。
// usage: node hozen/tools/eqdetailheavycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const cats=S.settings.cats;
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i+'（高圧受変電設備 第'+i+'系統の長い名前）',kind:'変圧器',locId:'',status:'稼働',importance:'A',installed:'2005-04-01',life:'20',run:{meters:[]},docs:[],health:[],photos:[],
   repairs:i?[]:[...Array(100)].map((_,k)=>({id:'r'+k,date:addD(TODAY,-k*10),kind:'修理',content:'修理'+(k+1)+'：端子の交換と締め直し',vendor:'○○電気',cost:'30000',photos:[]}))}));
  S.items=[...Array(200)].map((_,i)=>({id:'it'+i,name:'点検'+i,cat:cats[i%cats.length],cycle:'毎月',base:addD(TODAY,-300),who:'自社',track:true,legal:'',equipId:'eq'+(i%5)}));
  S.tasks=[...Array(6000)].map((_,i)=>({id:'tk'+i,date:addD(TODAY,-(i%2000)),time:'',kind:'点検',cat:cats[i%cats.length],title:'点検記録'+i,place:'',staff:'',attend:'',status:'完了',result:'良',note:'',photos:[],equipId:i%6===0?'eq0':'eq'+(i%500)}));
  S.meas=[...Array(5000)].map((_,i)=>({id:'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'',name:'測定'+i,equipId:i%10===0?'eq0':'eq'+(i%500),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]}));
  S.issues=[...Array(2000)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:addD(TODAY,-(i%900)),title:'異常'+i,detail:'',place:'',status:i%3?'完了':'対応中',urgency:'中',failure:i%4===0,equipId:i%10===0?'eq0':'eq'+(i%500),action:'',cause:'',closed:'',photos:[],log:[],downH:'2'}));
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','meas'])S[x]=m[x]}DL_CACHE=null},fs);
 const tm={};
 for(const t of ['ov','rec','insp','rel']){const ms=await p.evaluate(t=>{applyFScale();const s=performance.now();go('equipDetail',{eq:'eq0',eqTab:t});return performance.now()-s},t);await p.waitForTimeout(150);tm[t]=Math.round(ms);
  if(ms>LIM)bad.push(tag+'タブ '+t+' が出るまで '+Math.round(ms)+'ms');const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'タブ '+t+' で横にはみ出す '+sw)}
 if(fs==='m'){const s=Date.now();const buf=await p.pdf({format:'A4'}).catch(e=>{bad.push(tag+'印刷が作れない '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push(tag+'印刷が空')}
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
