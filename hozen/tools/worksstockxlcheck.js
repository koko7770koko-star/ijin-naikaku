// 文字「大」「特大」：作業管理の行の担当者名（「職員3」）・予備品の「最低 2個」が言葉の途中で割れない（hz-l-review-4）。
// 1つのまとまり（.hv）が2行にならないこと、横にはみ出さないこと。直す前は落ちる。
// usage: node hozen/tools/worksstockxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[390,'l'],[360,'xl'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:844}});const p=await c.newPage();const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 for(const v of ['works','stock']){
  const r=await p.evaluate(([v,f])=>{
   S.works=[...Array(6)].map((_,i)=>({id:'wm'+i,no:'W-'+(100+i),title:'高圧受電設備 年次点検に伴う停電作業（A棟 受変電室）第'+(i+1)+'回',kind:'点検',status:'予定',date:addD(TODAY,i),endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:['職員1','職員2','職員3'],vendor:'○○電気工事株式会社',vendorStaff:'',needN:1,needQuals:[],outage:{on:false,range:''},cost:'',approvals:[],pre:[],post:[],checks:{pre:[],post:[]}}));
   S.parts=[...Array(6)].map((_,i)=>({id:'pm'+i,code:'P-'+(1000+i),name:'端子台 M6 3極',spec:'定格 6.6kV',maker:'',place:'予備品庫 第3棚',unit:'個',qty:5,min:2,price:0,equipIds:[],note:''}));
   S.settings.fscale=f;save();applyFScale();go(v,v==='stock'?{stTab:'parts'}:undefined);
   const hv=[...document.querySelectorAll('#app .item .meta .hv')];const lh=parseFloat(getComputedStyle(document.querySelector('#app .item .meta')).lineHeight)||20;
   return {n:hv.length,split:hv.filter(e=>e.getBoundingClientRect().height>lh*1.6).map(e=>e.textContent),sw:document.documentElement.scrollWidth}},[v,fs]);
  await p.waitForTimeout(200);
  if(!r.n)errs.push(tag+v+'：まとまりが見つからない');if(fs&&r.split.length)errs.push(tag+v+'：「'+r.split[0]+'」が割れる');if(r.sw>w+2)errs.push(tag+v+'：はみ出す')}
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
