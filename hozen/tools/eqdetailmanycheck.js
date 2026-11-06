// 設備の詳細：点検の記録 300 件・修理 50 件・写真 20 枚の設備を 390px で開いて 1 秒以内に出て、どのタブも横にはみ出さず、
// 古い記録も「ほか N 件を表示」で最後（いちばん古い物）まで辿れる（保存の形は変えない。hz-v-eqdetail-many）
// usage: node hozen/tools/eqdetailmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[],errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 const ms=await p.evaluate(()=>{const d0=new Date(TODAY+'T00:00:00');const ds=i=>{const d=new Date(d0);d.setDate(d.getDate()-i*3);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  S.equipment=[{id:'e1',code:'E-1',name:'設備1',kind:'',status:'稼働',locId:'',place:'',importance:'',run:{meters:[]},docs:[],health:[],
   photos:Array.from({length:20},(_,i)=>'ph'+i),repairs:Array.from({length:50},(_,i)=>({id:'r'+i,date:ds(i*2),kind:'修理',content:'修理'+(i+1)+'：端子の交換',vendor:'',cost:'',photos:[]}))}];
  S.tasks=Array.from({length:300},(_,i)=>({id:'t'+i,date:ds(i),title:'点検記録'+(i+1)+'号',status:'完了',kind:'点検',cat:'',time:'',place:'',staff:'',attend:'',result:'良',note:'',equipId:'e1'}));save();
  const t0=performance.now();go('equipDetail',{eq:'e1',eqTab:'ov'});return performance.now()-t0});
 if(ms>1000)bad.push('開くまで '+Math.round(ms)+'ms（1 秒超）');console.log('開くまで '+Math.round(ms)+'ms');
 for(const tab of ['ov','rec','insp','rel']){await p.evaluate(t=>{V.eqTab=t;render()},tab);await p.waitForTimeout(150);
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>390)bad.push('タブ '+tab+'：横にはみ出す '+sw)}
 // 履歴のタブ：作業・点検の実績を「ほか N 件」で最後まで
 await p.evaluate(()=>{V.eqTab='rec';render()});await p.waitForTimeout(150);
 const cardSel=()=>p.evaluate(()=>{const cd=[...document.querySelectorAll('#app .card')].find(c=>(c.querySelector('h2')||{}).textContent?.includes('作業・点検の実績'));if(!cd)return null;
   const b=[...cd.querySelectorAll('button')].find(x=>/ほか\d+件/.test(x.textContent));return{n:cd.querySelectorAll('.item').length,more:b?b.textContent:'',last:cd.textContent.includes('点検記録300号')}});
 let r=await cardSel();if(!r)bad.push('作業・点検の実績のカードが無い');
 else{for(let i=0;i<10&&r.more&&!r.last;i++){await p.evaluate(()=>{const cd=[...document.querySelectorAll('#app .card')].find(c=>(c.querySelector('h2')||{}).textContent?.includes('作業・点検の実績'));[...cd.querySelectorAll('button')].find(x=>/ほか\d+件/.test(x.textContent)).click()});await p.waitForTimeout(150);r=await cardSel()}
  if(!r.last)bad.push('いちばん古い点検の記録（300 件目）まで辿れない（出ているのは '+r.n+' 件）')}
 const rp=await p.evaluate(()=>{const cd=[...document.querySelectorAll('#app .card')].find(c=>(c.querySelector('h2')||{}).textContent?.includes('故障・修理履歴'));const b=cd&&[...cd.querySelectorAll('button')].find(x=>/ほか\d+件/.test(x.textContent));if(b)b.click();return 1});await p.waitForTimeout(150);
 if(!await p.evaluate(()=>document.querySelector('#app').textContent.includes('修理50：')))bad.push('いちばん古い修理（50 件目）まで辿れない');
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>390)bad.push('全部出した後に横にはみ出す '+sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
