// 日報：今日に予定 80・異常 30・作業 20・測定 40 件、ほかに予定 6000・異常 3000・測定 5000・作業 1000 があるとき、
// 日報が 1 秒以内に出て、前後の日へ移るたびに 1 秒以内、今日の件数が出て、A4 の印刷が作れ、はみ出さないか（標準・特大。保存しない。hz-v-dailyrep-month-many）。
// usage: node hozen/tools/dailyrepmanycheck.js
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
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i,kind:'変圧器',locId:'',status:'稼働',repairs:[],photos:[],docs:[]}));
  S.tasks=[...Array(6080)].map((_,i)=>({id:'tk'+i,date:i<80?TODAY:addD(TODAY,-(i%700)-1),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+i+' 高圧受電盤の外観・発熱',place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:i%3?'良':'',note:'',photos:[],equipId:'eq'+(i%500)}));
  S.issues=[...Array(3030)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:i<30?TODAY:addD(TODAY,-(i%900)-1),title:'異常'+i+' 真空遮断器の異音',detail:'',place:'',status:i%3?'完了':'対応中',urgency:'中',equipId:'eq'+(i%500),action:'',cause:'',closed:'',photos:[],log:[]}));
  S.works=[...Array(1020)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:i<20?TODAY:addD(TODAY,-(i%300)-1),endDate:'',title:'作業'+i,kind:'点検',status:'完了',equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',outage:{on:false},result:'異常なし'}));
  S.meas=[...Array(5040)].map((_,i)=>({id:'ms'+i,at:'',date:i<40?TODAY:addD(TODAY,-(i%1095)-1),type:'絶縁抵抗',tplId:'',name:'測定'+i,equipId:'eq'+(i%500),by:'○○',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]}));
  for(let i=0;i<365;i++)S.daily[addD(TODAY,-i)]={note:'メモ'+i};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','issues','equipment','meas','works','daily'])S[x]=m[x]}DL_CACHE=null},fs);
 const tm={};tm.open=Math.round(await p.evaluate(()=>{applyFScale();const s=performance.now();go('dailyRep',{day:TODAY});return performance.now()-s}));
 const txt=await p.evaluate(()=>document.querySelector('#app').innerText);if(!/点検0 /.test(txt)||!/異常0 /.test(txt))bad.push(tag+'今日の点検・異常が日報に出ない');
 let sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'横にはみ出す '+sw);
 const turns=[];for(let k=1;k<=3;k++)turns.push(Math.round(await p.evaluate(k=>{const s=performance.now();go('dailyRep',{day:addD(TODAY,-k)});return performance.now()-s},k)));tm.turn=Math.max(...turns);
 for(const k in tm)if(tm[k]>LIM)bad.push(tag+k+' '+tm[k]+'ms');
 if(fs==='m'){await p.evaluate(()=>go('dailyRep',{day:TODAY}));const s=Date.now();const buf=await p.pdf({format:'A4'}).catch(e=>{bad.push(tag+'印刷が作れない '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push(tag+'印刷が空')}
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
