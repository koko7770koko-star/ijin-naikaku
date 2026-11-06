// 盤を消しても点検の記録は消えない（hz-v-loc-del-keep）：盤・電気室を消したあとも S.banChk（◯●）と S.banAt（実施日）は残り、
// 保存→読み直しでも残る。「元に戻す」で盤が戻れば、また表に出る。消した後に点検の画面（盤・月報・履歴・月）を開いてもエラーなし。通信は止める。
// usage: node hozen/tools/locdelkeepcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&Array.isArray(S.locs)&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{x:'',y:'',z:'',floor:''}});
  S.locs=[mk('b','A棟','建屋',''),mk('f','1階','階','b'),mk('r','第1電気室','電気室','f'),mk('x','動力盤-1','盤','r'),mk('y','動力盤-2','盤','r')];
  const ym=TODAY.slice(0,7);S.banChk={[ym]:{x:['済','済','済'],y:['済','','']}};S.banAt={[ym]:{x:TODAY}};save()});
 for(const [what,id] of [['盤','x'],['電気室','r']]){
  await p.evaluate(i=>delLoc(i),id);await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const ym=TODAY.slice(0,7);return {live:JSON.stringify(S.banChk[ym]),at:JSON.stringify(S.banAt[ym]),raw:JSON.stringify(JSON.parse(localStorage.getItem('hospElecSched_v1')).banChk[ym])}});
  ok(r.live===JSON.stringify({x:['済','済','済'],y:['済','','']}),what+'を消したら◯●が変わった '+r.live);
  ok(r.at&&/x/.test(r.at),what+'を消したら実施日が消えた '+r.at);
  ok(r.raw===r.live,what+'：保存された記録が違う');
  for(const v of ['ban','report','hist','month']){await p.evaluate(v=>go(v),v);await p.waitForTimeout(250)}
  await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(300);
  const back=await p.evaluate(()=>S.locs.map(l=>l.id).join());ok(back==='b,f,r,x,y','元に戻すで場所が戻らない '+back);
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
