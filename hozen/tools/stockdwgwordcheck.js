// 文字「大」「特大」：予備品の品番（P-1004）・図面の「版 3（日付）」「設備の印 0」が途中で割れず、横にはみ出さない。hz-l-stock-dwg
// usage: node hozen/tools/stockdwgwordcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[390,'l'],[360,'l'],[360,'xl']]){
  const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();const tag=w+'px・'+fs;
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
  await p.evaluate(f=>{S.settings.fscale=f;applyFScale();
   S.parts=[...Array(4)].map((_,i)=>({id:'pm'+i,code:'P-'+(1000+i),name:'予備品'+(i+1)+' 端子台 M6 3極',spec:'定格 6.6kV',maker:'○○電機',place:'予備品庫 第3棚',unit:'個',qty:5,min:2,price:1200,equipIds:[],note:''}));
   S.parts.push({id:'pmL',code:'ABCDEFGHIJ-1234567890-XYZ',name:'予備品L',spec:'',maker:'',place:'',unit:'個',qty:1,min:'',price:'',equipIds:[],note:''}); // 長い品番でも横にはみ出さない（カナメ：取り込みで足した）
   S.drawings=[...Array(3)].map((_,i)=>({id:'d'+i,name:'図面'+(i+1)+' 受変電設備 単線結線図（高圧側・低圧側）',kind:'単線結線図',locId:'',vers:[{id:'v1',ver:'3',date:'2026-11-03',note:'',by:'',file:'',type:'image/png'}],pins:[]}));save()},fs);
  for(const [v,sel,min] of [['stock','#app .item .ti .nwl',4],['dwgs','#app .item .meta .nwl',6]]){
   await p.evaluate(v=>go(v),v);await p.waitForTimeout(400);
   const r=await p.evaluate(sel=>{const e=[...document.querySelectorAll(sel)];return {n:e.length,split:e.filter(x=>x.getClientRects().length>1).length,sw:document.documentElement.scrollWidth}},sel);
   if(r.n<min)errs.push(tag+'：'+v+' の対象が '+r.n+' 個しかない');if(r.split)errs.push(tag+'：'+v+' で '+r.split+' 個が途中で割れる');if(r.sw>w+2)errs.push(tag+'：'+v+' が横にはみ出す');}
  await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
