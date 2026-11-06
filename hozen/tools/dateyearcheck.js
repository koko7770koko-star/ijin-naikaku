// 一覧の日付の年（hz-v-date-noyear-k1・k2・k3）：異常の一覧（issueRow）・工事の一覧（workRow）・設備の詳細の日常点検の記録・在庫の入出庫履歴・予定の一覧（taskRow）・点検履歴の一覧とその印刷で、今年でない日付には年が付き、今年の日付には付かない。
// 文字「特大」「大」・360px で横にはみ出さず、日付の欄が 2 行に割れない
// usage: node hozen/tools/dateyearcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['xl','l','m']){
  const c=await b.newContext({viewport:{width:360,height:900}});const p=await c.newPage();
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
  await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
  const tag='360px・'+({xl:'特大',l:'大',m:'標準'})[fs]+'・';
  const r=await p.evaluate(async f=>{const o=[];const y=+TODAY.slice(0,4),last=(y-1)+TODAY.slice(4),now=TODAY;
   S.issues=[{id:'i1',date:last,title:'去年の異常（受変電設備の発熱）',place:'',status:'対応中',action:'',closed:'',detail:'',photos:[]},{id:'i2',date:now,title:'今年の異常',place:'',status:'対応中',action:'',closed:'',detail:'',photos:[]}];
   const wk=(id,date,title)=>({id,no:id,title,kind:'工事',status:'承認済み',date,endDate:'',start:'09:00',end:'17:00',equipIds:[],locId:'',place:'',staff:[],vendor:'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''});
   S.works=[wk('w1',last,'去年の工事'),wk('w2',now,'今年の工事')];S.settings.fscale=f;save();applyFScale();
   const look=(nm,a,bb,card)=>{const root=card?[...document.querySelectorAll('#app .card')].find(c=>(c.querySelector('h2')||{}).textContent?.includes(card)):document.querySelector('#app');if(!root)return o.push(nm+'：カードが無い');const items=[...root.querySelectorAll('.item')];
    const A=items.find(e=>e.textContent.includes(a)),B=items.find(e=>e.textContent.includes(bb));if(!A||!B)return o.push(nm+'：行が無い');
    const da=A.querySelector('.dt'),db=B.querySelector('.dt');
    if(!da.textContent.includes(String(y-1)+'/'))o.push(nm+'：去年の日付に年が無い「'+da.textContent+'」');
    if(db.textContent.includes(String(y)+'/'))o.push(nm+'：今年の日付に年が付く「'+db.textContent+'」');
    const yr=da.querySelector('.yr');if(yr){const q=yr.getBoundingClientRect(),m=da.firstChild&&da.getBoundingClientRect();if(q.bottom>m.top+30)o.push(nm+'：日付の欄が 2 行に割れる')}
    if(da.scrollWidth>da.clientWidth+1)o.push(nm+'：日付の欄から文字が出る');
    if(document.documentElement.scrollWidth>innerWidth+1)o.push(nm+'：横にはみ出す')};
   go('issues');look('異常の一覧','去年の異常','今年の異常');
   go('works');look('工事の一覧','去年の工事','今年の工事');
   // k2：設備の詳細（日常点検の記録）
   S.equipment=[{id:'e1',code:'E-1',name:'設備1',kind:'',status:'稼働',locId:'',place:'',importance:'',run:{meters:[]},repairs:[],docs:[],photos:[],health:[]}];
   S.settings.dnums=[{id:'dny1',name:'去年今年の電圧',short:'電圧',unit:'V',equip:'e1',min:'',max:''}];
   S.daily[last]={dny1:101};S.daily[now]={dny1:202};save();
   go('equipDetail',{eq:'e1',eqTab:'insp'});look('設備の詳細の日常点検','101','202');
   // k2：在庫の入出庫履歴
   S.parts=[{id:'p1',code:'',name:'部品1',spec:'',maker:'',place:'',unit:'個',qty:2,min:'',price:'',equipIds:[]}];
   S.moves=[{id:'m1',partId:'p1',date:last,type:'入庫',qty:1,after:1,by:'',ref:'',note:'去年の入庫'},{id:'m2',partId:'p1',date:now,type:'入庫',qty:1,after:2,by:'',ref:'',note:'今年の入庫'}];save();
   go('stock',{stTab:'parts'});look('入出庫履歴','去年の入庫','今年の入庫');
   // k3：予定の一覧（taskRow。設備の詳細の「作業・点検の実績」）
   const tk=(id,date,title)=>({id,date,title,status:'完了',kind:'点検',cat:'',time:'',place:'',staff:'',attend:'',result:'良',note:'',equipId:'e1'});
   S.tasks=[tk('t1',last,'去年の点検'),tk('t2',now,'今年の点検')];save();
   go('equipDetail',{eq:'e1',eqTab:'rec'});look('予定の一覧（taskRow）','去年の点検','今年の点検','作業・点検の実績');
   // k3：点検履歴の一覧（全期間）
   go('hist',{hRange:'all'});look('点検履歴の一覧','電圧 101','電圧 202');
   return o},fs);
  r.forEach(x=>errs.push(tag+x));
  // k3：点検履歴の印刷（A4 縦の紙の幅 794px で、去年の行に年が付き、日付の欄が割れない）
  if(fs==='m'){await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});
   const q=await p.evaluate(()=>{const y=+TODAY.slice(0,4);const o=[];const rows=[...document.querySelectorAll('.hprint table.hpt tbody tr')];
    const A=rows.find(e=>e.textContent.includes('101'));if(!A)return ['印刷：行が無い'];const da=A.querySelector('td');
    if(!da.textContent.includes(String(y-1)+'/'))o.push('印刷：去年の日付に年が無い「'+da.textContent+'」');
    const rg=document.createRange();rg.selectNodeContents(da);const tops=new Set([...rg.getClientRects()].map(x=>Math.round(x.top)));if(tops.size>1)o.push('印刷：日付の欄が 2 行に割れる「'+da.textContent+'」');return o});
   q.forEach(x=>errs.push('A4・'+x));await p.emulateMedia({media:'screen'})}
  await c.close()}

 console.log([...new Set(errs)].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
