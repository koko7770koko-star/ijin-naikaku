// 日報：特記事項の下書き（AI を使わない dnoteDraftText）で、その日の作業 300 件・異常 500 件（うち未完了 300）のとき、
// 下書きが特記事項の上限（2000 字）に収まり、大事な行（未完了の異常・今夜〜明朝の作業）が切れずに残り、「ほか○件」で縮めたことが分かるか。
// 少ないときは今までどおり全部書くか。A4 の日報の印刷が幅に収まるか（hz-v-dailyrep-ai-big）。保存の形は変えない。usage: node hozen/tools/dnotedraftbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const T=TODAY;
  // 少ないとき
  S.tasks=[0,1].map(i=>({id:'ts'+i,date:T,time:'',kind:'定期',cat:S.settings.cats[0],title:'少点検'+i,place:'',staff:'',attend:'',status:'完了',result:'',note:'',photos:[]}));
  S.issues=[{id:'is0',date:T,title:'少異常0',status:'対応中',urgency:'中',closed:'',photos:[],log:[]}];S.works=[];
  const few=dnoteDraftText(T);
  // 多いとき
  S.tasks=[...Array(300)].map((_,i)=>({id:'t'+i,date:T,time:'',kind:'定期',cat:S.settings.cats[0],title:'点検作業その'+i,place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:i%40?'':'要観察',note:'',photos:[]}));
  S.issues=[...Array(500)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%30)),title:'異常案件その'+i,place:'電気室',status:i<300?'対応中':'完了',urgency:i%50?'中':'高',closed:i<300?'':T,photos:[],log:[]}));
  S.works=[{id:'w1',date:T,endDate:addD(T,1),title:'夜間の停電作業',status:'予定',kind:'点検',equipIds:[],staff:[],pre:[],post:[],approvals:[],ky:[],parts:[],needQuals:[],photos:[],outage:{on:false}}];
  const many=dnoteDraftText(T);setDnote(T,many);const saved=(S.dnotes||{})[T]||'';
  return {few,many,saved}});
 console.log('少ない '+r.few.length+' 字・多い '+r.many.length+' 字・保存 '+r.saved.length+' 字');
 if(!/少点検0/.test(r.few)||!/少点検1/.test(r.few)||!/少異常0/.test(r.few))bad.push('少ないときに全部書かれない');
 if(/ほか\d+件/.test(r.few))bad.push('少ないのに「ほか○件」と出る');
 if(r.many.length>2000)bad.push('多いときの下書きが上限 2000 字を超える '+r.many.length);
 if(!/未完了の異常 300件/.test(r.saved))bad.push('保存した特記事項に「未完了の異常」の行が残らない');
 if(!/夜間の停電作業/.test(r.saved))bad.push('保存した特記事項に「今夜〜明朝の作業」の行が残らない');
 if(!/ほか\d+件/.test(r.many))bad.push('縮めたことが「ほか○件」で分からない');
 // 日報の印刷（A4 の幅）
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.evaluate(()=>go('dailyRep'));await p.waitForTimeout(300);
 const w=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,W:innerWidth}));if(w.sw>w.W+1)bad.push('日報の印刷が A4 の幅からはみ出す '+w.sw);
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
