// 設備カルテの「履歴」：修理・異常・作業・時系列が各30件でも、先頭の8件だけ出て画面が長くなりすぎない（4000px 以内）。
// 「ほか○件を表示」で全部出て、「先頭の8件だけにする」で戻る。画面だけの状態で保存は変えない。390px ではみ出さない。
// usage: node hozen/tools/eqmanycheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const T=TODAY;S.equipment=[{id:'e1',code:'E-1',name:'非常用発電機 1号',place:'A棟',kind:'発電機',status:'稼働',importance:'A',photos:[],docs:[],health:[],repairs:[...Array(30)].map((_,i)=>({id:'r'+i,date:addD(T,-i*7),kind:'修理',content:'修理内容 '+i,vendor:'業者',cost:1000,photos:[]}))}];
  S.issues=[...Array(30)].map((_,i)=>({id:'i'+i,date:addD(T,-i),title:'異常 '+i,place:'',status:i%3?'完了':'対応中',equipId:'e1',urgency:'中',detail:'',action:'',cause:''}));
  S.tasks=[...Array(30)].map((_,i)=>({id:'t'+i,date:addD(T,-i),time:'',kind:'臨時',cat:S.settings.cats[0],title:'作業 '+i,place:'',staff:'',attend:'',status:'完了',result:'良',note:'',photos:[],equipId:'e1'}));
  save();go('equipDetail',{eq:'e1',eqTab:'rec'})});await p.waitForTimeout(400);
 const pane=()=>p.evaluate(()=>{const pn=[...document.querySelectorAll('.tabpane')].find(x=>x.style.display!=='none');return {h:Math.round(pn.getBoundingClientRect().height),n:pn.querySelectorAll('.item').length,btn:[...pn.querySelectorAll('button')].filter(b=>/ほか|先頭の8件/.test(b.textContent)).length,sw:document.documentElement.scrollWidth}});
 let r=await pane();if(r.n!==32)bad.push('先頭の件数 '+r.n+'（時系列8＋修理8＋異常8＋作業8）');if(r.h>4000)bad.push('画面が長い '+r.h);if(r.btn!==4)bad.push('「ほか○件」のボタンが '+r.btn);if(r.sw>392)bad.push('はみ出す '+r.sw);
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 await p.evaluate(()=>{[...document.querySelectorAll('.tabpane button')].find(b=>/ほか22件/.test(b.textContent)).click()});await p.waitForTimeout(200);
 r=await pane();if(r.n<32+22)bad.push('広げても増えない '+r.n);
 await p.evaluate(()=>{[...document.querySelectorAll('.tabpane button')].find(b=>/先頭の8件/.test(b.textContent)).click()});await p.waitForTimeout(200);r=await pane();if(r.n!==32)bad.push('戻らない '+r.n);
 // 少ない設備では出ない
 await p.evaluate(()=>{S.equipment[0].repairs=S.equipment[0].repairs.slice(0,3);S.issues=S.issues.slice(0,3);S.tasks=S.tasks.slice(0,3);V.eqMore={};render()});await p.waitForTimeout(200);
 r=await pane();if(r.btn!==1)bad.push('少ないのにボタンが '+r.btn+'（時系列だけ30件のはず）');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
