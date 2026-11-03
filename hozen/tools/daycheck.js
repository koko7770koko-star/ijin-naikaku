// 日常点検：場所（棟・階）で絞り込める・絞っても記録が消えない・古い記録（場所なし）でも開ける
// usage: node hozen/tools/daycheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S!=='undefined'&&S&&document.querySelector('#app').children.length);
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('#app .grid3 .num').length);
 const total=await p.evaluate(()=>numDefs().length);
 // 古い形（場所なし）：絞り込みの選択は出ず、全項目が出る
 await p.evaluate(()=>{V.dayLoc='';go('day',{day:TODAY})});await p.waitForTimeout(200);
 if(await cnt()!==total)errs.push('場所なしで項目が減った');
 // 場所つき：A棟・B棟に設備を分け、項目を設備に結びつける
 await p.evaluate(()=>{S.locs=[{id:'la',type:'建屋',parent:'',name:'A棟',note:'',pos:{floor:'',x:'',y:'',z:''}},{id:'lb',type:'建屋',parent:'',name:'B棟',note:'',pos:{floor:'',x:'',y:'',z:''}}];
  S.equipment=[{id:'ea',name:'設備A',locId:'la',status:'稼働'},{id:'eb',name:'設備B',locId:'lb',status:'稼働'}];
  const n=S.settings.dnums;n[0].equip='ea';if(n[1])n[1].equip='eb';save();V.dayLoc='';render()});await p.waitForTimeout(200);
 const sel=p.locator('select[aria-label="場所で絞り込む"]');if(!await sel.count())errs.push('絞り込みの選択が出ない');
 else{await p.evaluate(()=>{V.dayLoc='la';render()});await p.waitForTimeout(200);
  const c=await cnt();if(c!==1)errs.push('A棟で1件のはずが '+c);
  const keep=await p.evaluate(()=>S.settings.dnums.length);if(keep!==total)errs.push('絞り込みで定義が消えた');
  const note=await p.evaluate(()=>document.querySelector('#app').innerText.includes('絞り込み中'));if(!note)errs.push('絞り込み中の案内が無い');
  const h=await sel.evaluate(e=>e.getBoundingClientRect().height);if(h<40)errs.push('選択が小さい '+h);
  await p.evaluate(()=>{V.dayLoc='';render()});await p.waitForTimeout(200);if(await cnt()!==total)errs.push('解除で戻らない')}
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))errs.push('横にはみ出す');
 if(errs.length){console.log('NG',errs);process.exit(1)}console.log('OK 日常点検の場所絞り込み');await b.close()})();
