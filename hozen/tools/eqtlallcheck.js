// 設備カルテの「設備の時系列」：点検300・修理50でも「ほか○件を表示」で最後の1件まで辿れ、1秒以内で出る。保存の形は変えない。
// usage: node hozen/tools/eqtlallcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const info=await p.evaluate(()=>{const T=TODAY;S.equipment=[{id:'e1',code:'E-1',name:'テスト設備',place:'',kind:'発電機',status:'稼働',importance:'A',photos:[],docs:[],health:[],repairs:[...Array(50)].map((_,i)=>({id:'r'+i,date:addD(T,-i*3-1),kind:'修理',content:'修理内容 '+i,vendor:'',cost:0}))}];
  S.issues=[];S.tasks=[...Array(300)].map((_,i)=>({id:'t'+i,date:addD(T,-i),time:'',kind:'臨時',cat:S.settings.cats[0],title:'作業 '+i,place:'',staff:'',attend:'',status:'完了',result:'良',note:'',photos:[],equipId:'e1'}));
  save();const n=eqTimeline(S.equipment[0]).length;const t0=performance.now();go('equipDetail',{eq:'e1',eqTab:'rec'});return {n,ms:Math.round(performance.now()-t0)}});await p.waitForTimeout(400);
 const cnt=()=>p.evaluate(()=>{const bt=[...document.querySelectorAll('.tabpane button')].filter(b=>/^ほか\d+件/.test(b.textContent.trim()));return bt.map(x=>x.textContent.trim())});
 const bts=await cnt();const big=Math.max(0,...bts.map(t=>+t.match(/\d+/)[0]));
 if(info.n<300)bad.push('時系列が少ない '+info.n);
 if(big!==info.n-8)bad.push('「ほか」の件数 '+big+'（'+(info.n-8)+' のはず）');
 const t0=Date.now();
 await p.evaluate(n=>{[...document.querySelectorAll('.tabpane button')].find(b=>new RegExp('ほか'+(n-8)+'件').test(b.textContent)).click()},info.n);await p.waitForTimeout(200);
 const ms=Date.now()-t0;if(ms>1000)bad.push('広げるのが遅い '+ms);
 const shown=await p.evaluate(()=>{const pn=[...document.querySelectorAll('.tabpane')].find(x=>x.style.display!=='none');return {titles:[...pn.querySelectorAll('.item .ti')].filter(t=>/^(作業|点検|修理)/.test(t.textContent)).length,sw:document.documentElement.scrollWidth}});
 if(shown.titles<info.n)bad.push('最後まで出ない '+shown.titles+'/'+info.n);if(shown.sw>392)bad.push('はみ出す '+shown.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS '+JSON.stringify({info,shown}));await b.close();process.exit(errs.length||bad.length?1:0)})();
