// 日報の特記事項の下書き：未完了の異常（件数・内容と場所）・今夜〜明朝の作業（件数・件名）・出ている警報が1行ずつ入る。無い物は出さない。手で消せる（書いた文は消さない）。
// 完了した異常・完了した作業・来週の作業は入らない。記録の形は変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);

 const WKSRC="(id,title,st,d)=>({id,no:'W'+id,title,kind:'点検',status:st,date:d,start:'22:00',endDate:'',end:'23:00',equipIds:[],locId:'',place:'',staff:[],vendor:'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:''})";
 await p.evaluate(src=>{const wk=eval(src);S.dnotes={};S.daily={};S.tasks=[];
  S.issues=[{id:'i1',date:TODAY,title:'漏水',status:'未対応',place:'地下1階',action:''},{id:'i2',date:TODAY,title:'球切れ',status:'対応中',place:'',action:''},{id:'i3',date:TODAY,title:'済んだ異常',status:'完了',closed:TODAY,place:'',action:''}];
  S.works=[wk('1','夜間の切替点検','承認済み',TODAY),wk('2','翌朝の確認','起案',addD(TODAY,1)),wk('3','終わった作業','完了',TODAY),wk('4','来週の作業','承認済み',addD(TODAY,7))];
  const t=[];const d0=new Date();d0.setMinutes(0,0,0);for(let i=-2;i<30;i++){const d=new Date(d0.getTime()+i*3600000);t.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':00')}const z=v=>t.map(()=>v);
  localStorage.setItem(WX_KEY,JSON.stringify({at:Date.now()-60000,lat:35,lng:135,pref:'',warn:{pref:'○○県',list:['大雨警報','雷注意報'],at:Date.now()},data:{current:{temperature_2m:20,weather_code:0,relative_humidity_2m:50,wind_speed_10m:2,wind_direction_10m:90},hourly:{time:t,weather_code:z(0),temperature_2m:z(20),precipitation_probability:z(10),wind_speed_10m:z(2),relative_humidity_2m:z(50)}}}));
  save();go('dailyRep',{day:TODAY})},WKSRC);await p.waitForTimeout(300);
 await p.evaluate(()=>S.dnotes[TODAY]='手で書いた文');
 const before=await p.evaluate(()=>JSON.stringify([S.issues,S.works]));
 await p.evaluate(()=>{render()});await p.click('#dnDraft');await p.waitForTimeout(300);
 const v=await p.evaluate(()=>S.dnotes[TODAY]||'');const L=v.split('\n');
 ok(L[0]==='手で書いた文','書いた文が消えた '+v);
 ok(L.some(l=>/^未完了の異常 2件：.*漏水（地下1階）.*球切れ/.test(l)),'未完了の異常の行 '+v);ok(!/済んだ異常.*未完了|未完了の異常 3/.test(v),'完了した異常が未完了に入る');
 ok(L.some(l=>/^今夜〜明朝の作業 2件：.*夜間の切替点検.*翌朝の確認/.test(l)),'今夜〜明朝の作業の行 '+v);ok(!/終わった作業|来週の作業/.test(v.split('今夜〜明朝')[1]||''),'完了・来週の作業が入る');
 ok(L.some(l=>/^警報：大雨警報、雷注意報/.test(l)),'警報の行 '+v);
 ok(await p.evaluate(()=>JSON.stringify([S.issues,S.works]))===before,'異常・作業の記録が変わった');
 // 手で消せる
 await p.evaluate(()=>setDnote(TODAY,''));ok(await p.evaluate(()=>!S.dnotes[TODAY]),'消せない');
 // 無い物は出さない：異常も作業も警報も無い（日常点検の記録だけ）
 await p.evaluate(()=>{S.issues=[];S.works=[];localStorage.removeItem(WX_KEY);S.daily[TODAY]={done:true,by:'試験'};save();render()});
 const t2=await p.evaluate(()=>dnoteDraftText(TODAY));ok(!/未完了の異常|今夜〜明朝|警報/.test(t2),'無いのに行が出る '+t2);
 // 昨日の日報には警報を入れない
 await p.evaluate(()=>{S.issues=[];S.works=[]});const t3=await p.evaluate(()=>dnoteDraftText(addD(TODAY,-1)));ok(!/警報/.test(t3),'昨日に警報が入る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
