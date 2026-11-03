// ホーム：通信が取れず古い天気しか無いとき、今の物に見えない（「○時間前の古い情報です」・1行に取得時刻）。新しい天気には出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 const setWx=ageMin=>p.evaluate(a=>{S.settings.wx={on:true,lat:35,lng:135,pref:'',label:'○○総合病院'};save();
  const t=[];const d0=new Date();d0.setMinutes(0,0,0);for(let i=-2;i<30;i++){const d=new Date(d0.getTime()+i*3600000);t.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':00')}
  const z=v=>t.map(()=>v);
  localStorage.setItem(WX_KEY,JSON.stringify({at:Date.now()-a*60000,lat:35,lng:135,pref:'',data:{current:{temperature_2m:20,weather_code:0,relative_humidity_2m:50,wind_speed_10m:2,wind_direction_10m:90},hourly:{time:t,weather_code:z(0),temperature_2m:z(20),precipitation_probability:z(10),wind_speed_10m:z(2),relative_humidity_2m:z(50)}}}));
  WX_ERR='';go('home')},ageMin);
 const get=()=>p.evaluate(()=>({card:(document.querySelector('#wxCard')||{}).innerText||'',stale:!!document.querySelector('#wxCard .wxstale'),line:(document.querySelector('.wxline')||{}).innerText||'',sw:document.documentElement.scrollWidth}));
 await setWx(5);await p.waitForTimeout(400);let r=await get();
 if(r.stale)bad.push('新しい天気に古い知らせが出る');if(/の情報/.test(r.line))bad.push('新しい天気の1行に取得時刻が出る '+r.line);
 await setWx(300);await p.waitForTimeout(400);r=await get();
 if(!r.stale||!/古い情報/.test(r.card))bad.push('古い天気の知らせが出ない '+r.card.slice(0,80));if(!/\d+:\d\d.*情報/.test(r.line))bad.push('1行に取得時刻が無い '+r.line);if(r.sw>392)bad.push('横にはみ出す');
 await p.evaluate(()=>{S.settings.wx.on=false;save();go('home')});await p.waitForTimeout(300);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
