// 点検履歴：絞り込みで 0 件になったとき「条件を外して全期間を見る」がすぐ押せ（44px以上）、押すと項目・期間・キーワード・異常だけが外れて記録が出る。
// 記録が1件も無いときは出さない（日常点検の案内を出す）。記録は変えない。390px で横にはみ出さない。通信は止める。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const ok=(c,m)=>{if(!c)bad.push(m)};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const nd=numDefs();S.daily={};const d=addD(TODAY,-3);S.daily[d]={c:{},note:'確認'};nd.forEach(n=>{S.daily[d][n.id]='100'});save();
  V.hRange='m0';V.hItem=nd[0]?nd[0].id:'';V.hKw='ありえない言葉';V.hNg=true;go('hist');return JSON.stringify(S.daily)});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const e=document.getElementById('hClearBtn');if(!e)return null;const x=e.getBoundingClientRect();return {h:x.height,w:x.width,iw:innerWidth,sw:document.documentElement.scrollWidth,vis:x.top<innerHeight*4}});
 ok(!!r,'0件なのに「条件を外す」が出ない');
 if(r){ok(r.h>=44,'ボタンが小さい '+r.h);ok(r.sw<=r.iw,'横にはみ出す');
  await p.click('#hClearBtn');await p.waitForTimeout(300);
  const a=await p.evaluate(()=>({hRange:V.hRange,hItem:V.hItem,hKw:V.hKw,hNg:V.hNg,rows:document.querySelectorAll('#app .item').length,btn:!!document.getElementById('hClearBtn'),txt:document.querySelector('#app').innerText}));
  ok(a.hRange==='all'&&a.hItem===''&&a.hKw===''&&a.hNg===false,'条件が外れない '+JSON.stringify(a));ok(!/該当する記録はありません/.test(a.txt),'外しても記録が出ない');ok(!a.btn,'外した後もボタンが残る');
  ok(await p.evaluate(()=>JSON.stringify(S.daily))===before,'記録が変わった')}
 // 記録が1件も無い → ボタンは出さず、日常点検を入力する案内
 await p.evaluate(()=>{S.daily={};V.hRange='30';V.hKw='';V.hNg=false;V.hItem='';go('home');go('hist')});await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!document.getElementById('hClearBtn')),'記録が無いのに「条件を外す」が出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
