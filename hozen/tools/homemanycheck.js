// ホームの確認：今日の予定・異常・期限・作業が各20件以上ある日でも、上の「お知らせ」「今日」が最初の画面近くに見え、各一覧は数件＋「ほか○件」で長くなりすぎず、
// 390px で横にはみ出さない・ボタンが44px以上であることを確かめる。usage: node hozen/tools/homemanycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{
  S.items=[...Array(25)].map((_,i)=>({id:'it'+i,name:'法定点検'+i+'（名前の長い項目 受変電設備）',cat:'受変電',cycle:'年1回',base:addD(TODAY,-340+i),who:'委託',track:true,legal:'法定'}));
  S.tasks=[...Array(22)].map((_,i)=>({id:'t'+i,date:i<22?TODAY:TODAY,time:'09:'+String(i).padStart(2,'0'),kind:'月次',cat:'',title:'今日の点検'+i+'（名前の長い作業 受変電設備の点検）',place:'A棟',staff:'職員'+i,attend:'',status:'予定',result:'',note:'',photos:[]}))
   .concat([...Array(20)].map((_,i)=>({id:'o'+i,date:addD(TODAY,-1-i),time:'',kind:'月次',cat:'',title:'期限切れの点検'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]})))
   .concat([...Array(20)].map((_,i)=>({id:'u'+i,date:addD(TODAY,1+i%6),time:'',kind:'月次',cat:'',title:'先の予定'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]})));
  S.issues=[...Array(24)].map((_,i)=>({id:'is'+i,date:addD(TODAY,-i),title:'異常の試し'+i+'（受変電設備の発熱）',place:'A棟 1F',status:'対応中',urgency:i%3?'中':'緊急',action:'',closed:'',detail:'',due:i%2?addD(TODAY,-2):''}));
  S.works=[...Array(20)].map((_,i)=>({no:'W'+i,title:'作業'+i,kind:'点検',status:'実施中',date:TODAY,start:'09:00',endDate:'',end:'17:00',equipIds:[],locId:'',place:'',staff:[],vendor:'',vendorStaff:'',needQuals:[],needN:0,content:'',outage:{on:false,range:'',from:'',to:'',affect:'',contact:''},ky:[],kyBy:'',pre:[],post:[],stdId:'',stdVer:'',stdName:'',result:'',cost:'',photos:[],docs:[],approvals:[],hist:[],issueId:'',id:'w'+i}));
  AL_CACHE=null;save();go('home')});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#app > .card, #app > details')];const H=document.documentElement.scrollHeight;
  const find=re=>{const e=cards.find(c=>re.test((c.querySelector('h2')||{}).textContent||''));return e?e.getBoundingClientRect().top+scrollY:-1};
  const items=sel=>[...document.querySelectorAll(sel)].length;const small=[...document.querySelectorAll('#app button, #app .btn')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<40&&!/linkbtn|alchip/.test(e.className)).length;
  return {H,alert:find(/お知らせ/),today:find(/今日/),sw:document.documentElement.scrollWidth,items:[...document.querySelectorAll('#app .item')].filter(e=>e.offsetParent&&!e.closest('details:not([open])')).length,more:[...document.querySelectorAll('#app .linkbtn')].filter(e=>/ほか\s*\d+件を表示/.test(e.textContent)).length,alerts:document.querySelectorAll('#app .al').length,small}});
 console.log(JSON.stringify(r));console.log(await p.evaluate(()=>[...document.querySelectorAll('#app > .card, #app > details')].map(c=>((c.querySelector('h2')||{}).textContent||'?').slice(0,14)+':'+[...c.querySelectorAll('.item')].filter(e=>e.offsetParent).length).join(' | ')));
 if(r.sw>392)bad.push('横にはみ出す '+r.sw);if(r.alert<0)bad.push('お知らせが出ない');if(r.alert>520)bad.push('お知らせが下すぎる '+r.alert);
 if(r.alerts>9)bad.push('お知らせが多すぎる（上に出る数が長い）'+r.alerts);if(r.H>5200)bad.push('ホームが長すぎる '+r.H+'px');if(r.items>30)bad.push('ホームで見える一覧の行が多すぎる '+r.items);if(r.more<3)bad.push('「ほか○件を表示」が出ない '+r.more);
 await p.evaluate(()=>{const c=[...document.querySelectorAll('#app > .card')].find(c=>/今日/.test((c.querySelector('h2')||{}).textContent||''));[...c.querySelectorAll('.linkbtn')].find(e=>/ほか\s*\d+件を表示/.test(e.textContent)).click()});await p.waitForTimeout(200);
 const r2=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(e=>e.offsetParent&&!e.closest('details:not([open])')).length);if(r2<=r.items)bad.push('ほか○件を押しても増えない');
 if(process.argv[2])await p.screenshot({path:process.argv[2],fullPage:false});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
