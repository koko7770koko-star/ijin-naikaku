// ホーム：警報が出ているとき、警報の下に「非常用発電機の確認へ」（今月の未入力の台数つき）と「停電時の資料へ」（「停電」を含む資料があるときだけ）が出る。
// 44px以上・押すと発電機の確認／資料の検索「停電」へ。警報が無いときは出さない。390px で横にはみ出さない。記録は変えない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join('|')));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const setWx=(list,gens,lib)=>p.evaluate(([list,gens,lib])=>{S.settings.wx={on:true,lat:35,lng:135,pref:'',label:'○○総合病院'};
  S.equipment=[...Array(gens)].map((_,i)=>({id:'g'+i,code:'',name:'発電機'+(i+1),kind:'発電機',place:'',locId:'',maker:'',status:''}));S.meas=[];
  S.library=lib?[{id:'l1',title:'停電時の対応手順',tags:'',text:'',file:'',type:'',equipIds:[]}]:[{id:'l2',title:'受電設備の点検',tags:'',text:'',file:'',type:'',equipIds:[]}];save();
  const t=[];const d0=new Date();d0.setMinutes(0,0,0);for(let i=-2;i<30;i++){const d=new Date(d0.getTime()+i*3600000);t.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':00')}
  const z=v=>t.map(()=>v);
  localStorage.setItem(WX_KEY,JSON.stringify({at:Date.now()-5*60000,lat:35,lng:135,pref:'',warn:{pref:'○○県',list,at:Date.now()},data:{current:{temperature_2m:20,weather_code:0,relative_humidity_2m:50,wind_speed_10m:2,wind_direction_10m:90},hourly:{time:t,weather_code:z(0),temperature_2m:z(20),precipitation_probability:z(10),wind_speed_10m:z(2),relative_humidity_2m:z(50)}}}));
  WX_ERR='';go('home')},[list,gens,lib]);
 const get=()=>p.evaluate(()=>{const e=document.querySelector('#wxCard .warnlinks');const bs=e?[...e.querySelectorAll('button')]:[];return {has:!!e,t:bs.map(x=>x.textContent),h:bs.map(x=>x.getBoundingClientRect().height),sw:document.documentElement.scrollWidth,iw:innerWidth}});
 // 警報あり・発電機2台未入力・停電の資料あり
 await setWx(['大雨警報'],2,true);await p.waitForTimeout(400);let r=await get();
 ok(r.has&&r.t.length===2,'2つのボタンが出ない '+JSON.stringify(r));ok(r.t[0]&&/発電機の確認/.test(r.t[0])&&/2台/.test(r.t[0]),'発電機のボタンの言葉 '+r.t[0]);ok(/停電時の資料/.test(r.t[1]||''),'資料のボタンの言葉');ok(r.h.every(h=>h>=44),'ボタンが小さい');ok(r.sw<=r.iw,'横にはみ出す');
 const before=await p.evaluate(()=>JSON.stringify([S.equipment,S.library,S.meas]));
 await p.click('#wxCard .warnlinks button:nth-child(2)');await p.waitForTimeout(400);
 const v=await p.evaluate(()=>({view:V.view,q:V.libQ}));ok(v.view==='lib'&&v.q==='停電','資料の検索「停電」が開かない '+JSON.stringify(v));
 await p.evaluate(()=>go('home'));await p.waitForTimeout(300);
 await p.click('#wxCard .warnlinks button:nth-child(1)');await p.waitForTimeout(500);
 const g=await p.evaluate(()=>({view:V.view,tab:V.dgTab}));ok(g.view==='diag'&&g.tab==='meas','発電機の確認へ行かない '+JSON.stringify(g));
 ok(await p.evaluate(()=>JSON.stringify([S.equipment,S.library,S.meas]))===before,'記録が変わった');
 // 発電機1台だけ未入力 → その台の入力へ
 await setWx(['暴風警報'],1,false);await p.waitForTimeout(400);r=await get();ok(r.has&&r.t.length===1&&/1台/.test(r.t[0]),'資料が無いのに資料のボタンが出る／1台 '+JSON.stringify(r.t));
 await p.click('#wxCard .warnlinks button');await p.waitForTimeout(500);ok(await p.evaluate(()=>!!document.querySelector('#modal')&&document.querySelector('#modal').innerText.length>10),'1台のとき入力の窓が開かない');await p.evaluate(()=>closeModal(true));
 // 警報なし → 出ない
 await setWx([],2,true);await p.waitForTimeout(400);r=await get();ok(!r.has,'警報が無いのにボタンが出る');
 // 発電機も資料も無い → 出ない
 await p.evaluate(()=>{S.equipment=[];S.library=[];save()});await setWx(['大雨警報'],0,false);await p.waitForTimeout(400);r=await get();ok(!r.has,'押せる物が無いのに枠が出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
