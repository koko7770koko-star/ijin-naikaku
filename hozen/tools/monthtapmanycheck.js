// カレンダー：予定 6000 件（今月に 1 日 30 件の日を含む）・点検項目 2000 で、カレンダーが 1 秒以内に出て、月を替えるたびに 1 秒以内、
// 一覧の「● 実施済みにする」（quickDone）とその日の「まとめて ●」（dayAllDone）が 1 秒以内で、年間計画の印（●）も付き、
// 「元に戻す」で戻り、390px・文字「標準」「特大」ではみ出さないか（hz-v-month-tap-many）。
// 記録は保存せず画面の中だけで確かめる。usage: node hozen/tools/monthtapmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const cats=S.settings.cats;
  S.items=[...Array(2000)].map((_,i)=>({id:'it'+i,name:'点検'+i+' 高圧受電盤の外観・発熱',cat:cats[i%cats.length],cycle:'毎月',base:addD(TODAY,-300),who:'自社',track:true,legal:'',equipId:''}));
  S.tasks=[...Array(6000)].map((_,i)=>{const d=i<30?TODAY:addD(TODAY,-(i%700)+30);return {id:'tk'+i,date:d,time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+(i%2000)+' 高圧受電盤の外観・発熱',place:'',staff:'',attend:'',status:i<30||d>=TODAY?'予定':i%3?'完了':'予定',result:'',note:'',photos:[]}});
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items'])S[x]=m[x]}DL_CACHE=null},fs);
 const tm={};
 tm.open=await p.evaluate(()=>{applyFScale();const s=performance.now();go('month',{y:now.getFullYear(),m:now.getMonth()+1,sel:TODAY});return performance.now()-s});
 let r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,btn:[...document.querySelectorAll('#app button')].filter(x=>/実施済みにする/.test(x.textContent)).length}));
 if(r.sw>392)bad.push(tag+'横にはみ出す '+r.sw);if(r.btn<30)bad.push(tag+'今日の予定の「実施済みにする」が足りない '+r.btn);
 // 1 件ずつ
 const q=await p.evaluate(()=>{const it=itemOf(S.tasks[0].title),fy=fyOf(now.getFullYear(),now.getMonth()+1);const s=performance.now();quickDone('tk0');const ms=performance.now()-s;const mk=((S.marks[fy]||{})[it.id]||[])[idxOf(now.getMonth()+1)];return {ms,st:S.tasks[0].status,mk}});
 tm.quick=q.ms;if(q.st!=='完了')bad.push(tag+'実施済みにならない');if(q.mk!=='済')bad.push(tag+'年間計画の印が ● にならない '+q.mk);
 const u=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/元に戻す/.test(x.textContent));if(!b)return 'なし';b.click();return S.tasks[0].status});if(u!=='予定')bad.push(tag+'元に戻すで戻らない '+u);
 // その日をまとめて
 const a=await p.evaluate(()=>{const s=performance.now();dayAllDone(TODAY);return {ms:performance.now()-s,left:S.tasks.filter(t=>t.date===TODAY&&t.status==='予定').length}});
 tm.dayAll=a.ms;if(a.left)bad.push(tag+'まとめて ● で残る '+a.left);
 const turns=[];for(let k=0;k<3;k++)turns.push(await p.evaluate(k=>{const d=new Date(now.getFullYear(),now.getMonth()-1-k,1);const s=performance.now();go('month',{y:d.getFullYear(),m:d.getMonth()+1,sel:ymd(d)});return performance.now()-s},k));tm.turn=Math.max(...turns);
 r=await p.evaluate(()=>document.documentElement.scrollWidth);if(r>392)bad.push(tag+'月を替えるとはみ出す '+r);
 for(const k in tm){tm[k]=Math.round(tm[k]);if(tm[k]>LIM)bad.push(tag+k+' '+tm[k]+'ms')}
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
