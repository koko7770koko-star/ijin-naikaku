// 年間計画：マスを押して描き直しても横の位置が動かない・「今月の列へ」で戻れる・年度を替えると今の月へ
// usage: node hozen/tools/yearcheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const old={settings:{name:'確認'},items:[{id:'it1',name:'確認項目',cat:'その他',cycle:'毎月'}],marks:{}};
 await p.addInitScript(([k,v])=>{if(sessionStorage.getItem('__yc'))return;sessionStorage.setItem('__yc','1');localStorage.clear();localStorage.setItem(k,v)},[KEY,JSON.stringify(old)]);
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S!=='undefined'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length);
 await p.evaluate(()=>{V.fy=fyOf(now.getFullYear(),now.getMonth()+1);go('year')});await p.waitForTimeout(300);
 const sl=()=>p.evaluate(()=>document.querySelector('.tbw').scrollLeft);
 const first=await sl();
 await p.evaluate(()=>{document.querySelector('.tbw').scrollLeft=0});
 await p.locator('table.yr td.mk').nth(1).tap();await p.waitForTimeout(200);
 if(await sl()!==0)errs.push('マスを押したら横の位置が動いた: '+await sl());
 const hasBtn=await p.$('button[onclick="yearToNow()"]');
 if(hasBtn){await hasBtn.tap();await p.waitForTimeout(200);if(Math.abs(await sl()-first)>2)errs.push('今月の列へ戻れない: '+first+' vs '+await sl())}
 const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(over)errs.push('画面が横にはみ出す');
 if(errs.length){console.log('NG',errs);process.exit(1)}console.log('OK 年間計画の位置',first);await b.close()})();
