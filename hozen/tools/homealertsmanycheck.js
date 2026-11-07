// ホームの知らせが 30 件以上（期限切れの点検・校正切れ・緊急の異常・予定日を過ぎた作業・在庫不足・資格）あるとき、要対応（赤）が上に来て、最初は 3 件＋「ほか N 件を表示」にたたまれて画面が知らせで埋まらず、
// 開いた後のどの知らせを押しても、それぞれの画面・窓・カードへ行けるか。390px・文字「標準」「特大」。表示だけで保存の形は変えない（hz-v-home-alerts-many）。
// usage: node hozen/tools/homealertsmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const T=TODAY;
  S.items=[...Array(12)].map((_,i)=>({id:'it'+i,name:'法定点検'+i,cat:'受変電',cycle:'年1回',base:i<6?addD(T,-380-i):addD(T,-360+i),who:'委託',track:true,legal:'法定'}));
  S.tasks=[...Array(5)].map((_,i)=>({id:'o'+i,date:addD(T,-1-i),time:'',kind:'月次',cat:'',title:'期限切れの点検'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]}));
  S.tools=[...Array(6)].map((_,i)=>({id:'tl'+i,name:'測定器'+i,calDue:addD(T,i<4?-3-i:10+i),loans:[]}));
  S.issues=[...Array(4)].map((_,i)=>({id:'is'+i,date:addD(T,-2-i),title:'緊急の試し'+i,place:'',status:'対応中',urgency:i<3?'緊急':'高',due:i===3?addD(T,-1):'',action:'',closed:'',detail:''}));
  S.works=[...Array(5)].map((_,i)=>({id:'w'+i,title:'遅れた作業'+i,date:addD(T,-3-i),status:'承認済み'}));
  S.parts=[{id:'p1',name:'ヒューズ',qty:1,min:3,unit:'個',equipIds:[]},{id:'p2',name:'ランプ',qty:0,min:2,unit:'個',equipIds:[]}];S.moves=[];S.settings.lastBackup=T;
  save()},fs);await p.waitForTimeout(300);await p.reload();await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{applyFScale();V.moreAl=false;go('home')});await p.waitForTimeout(300);
 const info=await p.evaluate(()=>{const A=alerts(),card=[...document.querySelectorAll('#app .card')].find(x=>/お知らせ/.test((x.querySelector('h2')||{textContent:''}).textContent));
  return {n:A.length,lv:A.map(a=>a[0]),shown:card?card.querySelectorAll('.al').length:-1,btn:card?([...card.querySelectorAll('button')].map(x=>x.textContent).find(t=>/ほか/.test(t))||''):'',h:card?card.getBoundingClientRect().height:0,sw:document.documentElement.scrollWidth}});
 if(info.n<30)bad.push(tag+'知らせが30件にならない '+info.n);
 const rk={ng:0,warn:1,info:2};if(info.lv.some((v,i)=>i&&rk[v]<rk[info.lv[i-1]]))bad.push(tag+'重い順でない '+info.lv.join(','));
 if(info.lv.slice(0,3).some(v=>v!=='ng'))bad.push(tag+'上の3件が要対応でない');
 if(info.shown!==3)bad.push(tag+'たたんだときの件数 '+info.shown);if(!new RegExp('ほか '+(info.n-3)+'件').test(info.btn))bad.push(tag+'ほかN件のボタン '+info.btn);
 if(info.h>844*0.6)bad.push(tag+'たたんでも知らせが画面を埋める '+Math.round(info.h));if(info.sw>392)bad.push(tag+'はみ出す '+info.sw);
 // 開いて全部を1つずつ押す
 const N=info.n;let went=0;
 for(let i=0;i<N;i++){
  await p.evaluate(()=>{if(typeof closeModal==='function')closeModal(true);V.moreAl=true;go('home');scrollTo(0,0)});await p.waitForTimeout(80);
  const r=await p.evaluate(i=>{const card=[...document.querySelectorAll('#app .card')].find(x=>/お知らせ/.test((x.querySelector('h2')||{textContent:''}).textContent));const al=card.querySelectorAll('.al');
   if(al.length!==alerts().length)return {err:'開いた件数 '+al.length};if(i>=al.length)return {err:'押している間に知らせの数が変わった '+al.length+'：'+alerts().map(a=>a[1].slice(0,14)).join('｜')};const t=al[i].textContent.slice(0,30),y0=scrollY;window.__sy=y0;al[i].click();return {t}},i);
  if(r.err){bad.push(tag+r.err);break}
  await p.waitForTimeout(450);
  const s=await p.evaluate(()=>({view:V.view,modal:document.querySelector('#mask').classList.contains('on'),y:scrollY,y0:window.__sy}));
  if(s.view!=='home'||s.modal||s.y>s.y0+50)went++;else bad.push(tag+'押しても行かない：'+r.t);
 }
 if(went!==N&&!bad.length)bad.push(tag+'行けた '+went+'/'+N);
 const big=await p.evaluate(()=>{V.moreAl=true;go('home');return document.documentElement.scrollWidth});if(big>392)bad.push(tag+'開いてはみ出す '+big);
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
