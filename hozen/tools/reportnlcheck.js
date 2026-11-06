// 月報の異常案件の表（内容・処置・経過）と日報の異常案件の表（処置）：入れた改行が画面でも印刷でも消えない（white-space:pre-wrap）・横にはみ出さない（hz-v-report-nl）
// usage: node hozen/tools/reportnlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:720,height:1000}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const d={settings:{name:'x'},issues:[{id:'i1',title:'異常1',date:TODAY,status:'対応中',urgency:'中',detail:'内容NLa\n内容NLb',action:'処置NLa\n処置NLb'}]};
  const v=validateData(d);S=migrate(v.data);syncDefs();save()});
 for(const media of ['screen','print']){await p.emulateMedia({media});
  for(const [nm,js] of [['月報',"go('report')"],['日報',"go('dailyRep',{day:TODAY})"]]){
   await p.evaluate(js);await p.waitForTimeout(150);
   const r=await p.evaluate(()=>{const o=[];const w=document.createTreeWalker(document.querySelector('#app'),NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(/(内容|処置)NLa\s*\n(内容|処置)NLb/.test(n.textContent)){const e=n.parentElement;o.push({t:n.textContent.slice(0,3),ws:getComputedStyle(e).whiteSpace,vis:e.getBoundingClientRect().height>0})}}
    return {o:o.filter(x=>x.vis),sw:document.documentElement.scrollWidth,w:document.documentElement.clientWidth}});
   if(!r.o.length)errs.push(media+'・'+nm+'：改行入りの文が表に出ていない');
   r.o.forEach(x=>{if(!/pre/.test(x.ws))errs.push(media+'・'+nm+'：「'+x.t+'」の改行が消える（white-space:'+x.ws+'）')});
   if(r.sw>r.w+1)errs.push(media+'・'+nm+'：横にはみ出す '+r.sw)}}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
