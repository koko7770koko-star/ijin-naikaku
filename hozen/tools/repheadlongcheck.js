// 報告書（月報・年報・日報）の上の表：施設名・宛名・担当が長くても390pxで横にはみ出さず、日付は途中で折れない・保存の形は変わらない
// usage: node hozen/tools/repheadlongcheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 const keys0=await p.evaluate(()=>Object.keys(S.settings).sort().join());
 await p.evaluate(()=>{S.settings.name='○○総合病院 本院 電気設備保全管理部門 第二電気室付属施設';S.settings.to='○○総合病院 院長 殿 施設管理部 電気保安担当';S.settings.dept='施設管理課 電気保安グループ 第二係';S.settings.reporter='担当者名ながながながながながな';save()});
 for(const [n,fn] of [['月報',()=>{V.ry=now.getFullYear();V.rm=now.getMonth()+1;V.rmode='m';go('report')}],['年報',()=>{V.rmode='y';go('report')}],['日報',()=>{go('dailyRep',{day:TODAY})}]]){
  await p.evaluate(fn);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const t=[...document.querySelectorAll('.rep .head td')].find(x=>/\d{4}\/\d+\/\d+/.test(x.innerText));return{sw:document.documentElement.scrollWidth,date:t?t.getBoundingClientRect().height:0,lh:t?parseFloat(getComputedStyle(t).lineHeight)||16:16,has:document.querySelectorAll('.rep .head').length}});
  if(!r.has)bad.push(n+'：上の表が無い');if(r.sw>392)bad.push(n+'：横にはみ出す '+r.sw);if(r.date>r.lh*2.2+8)bad.push(n+'：期間・日付が3行以上に折れる '+r.date)}
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 if(await p.evaluate(()=>Object.keys(S.settings).sort().join())!==keys0)bad.push('設定の項目が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
