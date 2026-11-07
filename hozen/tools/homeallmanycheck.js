// ホーム：全画面が数千件ずつ（予定 6000・点検項目 2000・盤 3000 面と今月の印・異常 3000・測定 5000・作業 1000・発電機 60 台・予備品 300・工具 300）
// のとき、ホームが 1 秒以内に出て、下のボタン（ホーム・カレンダー・日常点検・シフト・メニュー）で移るたびに 1 秒以内、はみ出さないか。
// 保存せず画面の中だけで確かめる（標準・特大。hz-v-home-allmany）。usage: node hozen/tools/homeallmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const cats=S.settings.cats,U=['緊急','高','中','低'],ym=TODAY.slice(0,7);
  const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;const pans=L.filter(x=>x.type==='盤'),rooms=L.filter(x=>x.type==='電気室');S.banChk={[ym]:{}};pans.slice(0,1500).forEach((x,i)=>S.banChk[ym][x.id]=['済',i%2?'○':'済','']);
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:(i<60?'非常用発電機':'設備')+i,kind:i<60?'発電機':'変圧器',locId:rooms[i%rooms.length].id,status:'稼働',importance:i%5?'':'A',installed:'2005-04-01',life:'20',repairs:[],photos:[],docs:[],run:{meters:[]},health:[]}));
  S.items=[...Array(2000)].map((_,i)=>({id:'it'+i,name:'点検'+i+' 外観',cat:cats[i%cats.length],cycle:['毎月','3か月','年1回'][i%3],base:addD(TODAY,-300+i%200),who:'自社',track:true,legal:['法定','社内','自主',''][i%4],equipId:'eq'+(i%500)}));
  S.tasks=[...Array(6000)].map((_,i)=>({id:'tk'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+(i%2000)+' 外観',place:'',staff:'',attend:'',status:addD(TODAY,-(i%700)+30)<TODAY&&i%5?'完了':'予定',result:'',note:'',photos:[],equipId:'eq'+(i%500)}));
  S.issues=[...Array(3000)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:addD(TODAY,-(i%900)),title:'異常'+i,detail:'',place:'',status:i%3?'完了':'対応中',urgency:U[i%4],failure:i%7===0,due:i%3?'':addD(TODAY,(i%9)-4),equipId:'eq'+(i%500),action:'',cause:'',closed:'',photos:[],log:[]}));
  const M=[];for(let g=0;g<60;g++)for(let k=1;k<36;k++)M.push({id:'mg'+g+'_'+k,at:'',date:addM(ym+'-05',-k),type:'電圧・電流・電力',tplId:'mt_gen',name:GEN_TPL.name,equipId:'eq'+g,by:'',note:'',rows:GEN_TPL.rows.map((r,j)=>({...r,v:200+j}))});
  for(let i=M.length;i<5000;i++)M.push({id:'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'',name:'測定'+i,equipId:'eq'+(i%500),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]});S.meas=M;
  S.works=[...Array(1000)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:addD(TODAY,(i%60)-30),endDate:'',title:'作業'+i,kind:'点検',status:['完了','承認待ち','承認済み','実施中'][i%4],equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',outage:{on:false}}));
  S.parts=[...Array(300)].map((_,i)=>({id:'pt'+i,code:'P-'+i,name:'部品'+i,spec:'',maker:'',place:'',unit:'個',qty:i%5,min:2,price:0,equipIds:[],note:''}));
  S.tools=[...Array(300)].map((_,i)=>({id:'tl'+i,code:'T-'+i,name:'工具'+i,kind:'測定器',maker:'',model:'',serial:'',place:'',calDue:addD(TODAY,(i%120)-30),calCycleM:'12',calHist:[],loans:[],note:''}));
  for(let i=0;i<365;i++)S.daily[addD(TODAY,-i)]={note:'メモ'+i};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','meas','works','locs','parts','tools','daily'])S[x]=m[x]}DL_CACHE=null;AL_CACHE=null},fs);
 const tm={};tm.home=Math.round(await p.evaluate(()=>{applyFScale();const s=performance.now();go('home');return performance.now()-s}));
 let sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'ホームが横にはみ出す '+sw);
 for(const v of ['month','day','shift','menu','home']){const s=Date.now();await p.click(`#nav button[data-v="${v}"]`);await p.waitForTimeout(30);tm[v]=Date.now()-s-30;sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+v+' で横にはみ出す '+sw)}
 for(const k in tm)if(tm[k]>LIM)bad.push(tag+k+' '+tm[k]+'ms');
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
