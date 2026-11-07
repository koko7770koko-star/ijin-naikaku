// 保全計画：点検項目 2000（法定・社内・自主）・予定 6000・更新計画 500 件・設備 500 台（耐用年数つき）・測定 5000 件（ひな形つき 300 台）で、
// 3 つのタブ（点検期限・更新計画・測定の周期）がそれぞれ 1 秒以内に出て、件数が合い、390px・文字「標準」「特大」ではみ出さないか（hz-v-plan-many）。
// 記録は保存せず画面の中だけで確かめる。usage: node hozen/tools/planmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const cats=S.settings.cats,LG=['法定','社内','自主',''];
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i+'（高圧受変電設備 第'+i+'系統の長い名前）',kind:'変圧器',locId:'',status:'稼働',importance:'',installed:(2000+i%25)+'-04-01',life:'20',renewCost:i%3?'':String(1000000*(i%9+1)),repairs:[],photos:[],docs:[]}));
  S.items=[...Array(2000)].map((_,i)=>({id:'it'+i,name:'点検'+i+' 高圧受電盤の外観・発熱',cat:cats[i%cats.length],cycle:['毎月','3か月','年1回'][i%3],base:addD(TODAY,-300+i%200),who:'自社',track:true,legal:LG[i%4],equipId:'eq'+(i%500)}));
  S.tasks=[...Array(6000)].map((_,i)=>({id:'tk'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+(i%2000)+' 高圧受電盤の外観・発熱',place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:'',note:'',photos:[]}));
  S.plans=[...Array(500)].map((_,i)=>({id:'pl'+i,title:'更新計画'+i+' 受変電設備の更新工事（長い件名の例）',equipId:'eq'+(i%500),year:fyNow()+(i%14)-2,kind:'更新',cost:String(500000*(i%7+1)),status:['計画','予算化','実施済み','見送り'][i%4],note:''}));
  if(!Array.isArray(S.mtpl))S.mtpl=[];const T=[...Array(5)].map((_,k)=>({id:'mtx'+k,type:'絶縁抵抗',name:'ひな形'+k,cycleM:12,kind:'',rows:[{name:'R相',unit:'MΩ',min:10,max:''}]}));S.mtpl.push(...T);
  S.meas=[...Array(5000)].map((_,i)=>({id:'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:'mtx'+(Math.floor(i/300)%5),name:'測定'+i,equipId:'eq'+(i%300),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:100}]}));
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','equipment','meas','plans','mtpl'])S[x]=m[x]}DL_CACHE=null},fs);
 const tm={};
 for(const t of ['legal','renew','measdue']){const ms=await p.evaluate(t=>{applyFScale();const s=performance.now();go('plan',{plTab:t});return performance.now()-s},t);await p.waitForTimeout(150);tm[t]=Math.round(ms);
  if(ms>LIM)bad.push(tag+'タブ「'+t+'」が出るまで '+Math.round(ms)+'ms');
  const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cut:[...document.querySelectorAll('#app .item')].filter(x=>x.getBoundingClientRect().right>391).length,n:document.querySelectorAll('#app .item').length}));
  if(r.sw>392)bad.push(tag+t+' で横にはみ出す '+r.sw);if(r.cut)bad.push(tag+t+' で行がはみ出す '+r.cut);
  if(t==='legal'){const w=await p.evaluate(()=>deadlines().length);if(r.n<w)bad.push(tag+'点検期限の行が足りない '+r.n+'/'+w)}
  if(t==='measdue'&&r.n<300*5)bad.push(tag+'測定の周期の行が足りない '+r.n+'/1500')}
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
