// 月報・年報：予定 6000・点検項目 2000・設備 500・異常 3000・測定 5000・作業 1000・日常点検 365 日（全部の項目つきの形）で、
// 月報と年報が 1 秒以内に出て、月・年を替えるたびに 1 秒以内、印刷（A4）が作れ、390px・文字「標準」「特大」ではみ出さないか（hz-v-report-many）。
// 記録は端末の保存の上限を超えるので保存せず、画面の中だけで確かめる。usage: node hozen/tools/reportmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{window.save=()=>{};S.settings.fscale=f;const cats=S.settings.cats,U=['緊急','高','中','低'];
  S.locs=[...Array(60)].map((_,i)=>({id:'lc'+i,name:(i<6?'ABCDEF'[i]+'棟':'第'+i+'電気室'),type:i<6?'建屋':'電気室',parent:i<6?'':'lc'+(i%6),note:'',pos:{}}));
  S.equipment=[...Array(500)].map((_,i)=>({id:'eq'+i,code:'EQ-'+i,name:'設備'+i+'（高圧受変電 第'+i+'系統）',kind:i<10?'発電機':'変圧器',locId:'lc'+(6+i%54),status:'稼働',importance:'',repairs:[],photos:[],docs:[]}));
  S.items=[...Array(2000)].map((_,i)=>({id:'it'+i,name:'点検'+i+' 高圧受電盤の外観',cat:cats[i%cats.length],cycle:['毎月','3か月','年1回'][i%3],base:addD(TODAY,-300),who:'自社',track:true,legal:i%10?'':'電気事業法',equipId:'eq'+(i%500)}));
  S.tasks=[...Array(6000)].map((_,i)=>({id:'tk'+i,date:addD(TODAY,-(i%700)+30),time:'',kind:'定期',cat:cats[i%cats.length],title:'点検'+(i%2000)+' 高圧受電盤の外観',place:'',staff:'',attend:'',status:i%3?'完了':'予定',result:i%3?'異常なし':'',note:'',photos:[],equipId:'eq'+(i%500)}));
  S.issues=[...Array(3000)].map((_,i)=>({id:'is'+i,src:'manual:'+i,date:addD(TODAY,-(i%900)),title:'異常'+i+' 真空遮断器の異音',detail:'詳細',place:'',status:i%3?'完了':'対応中',urgency:U[i%4],failure:i%7===0,equipId:'eq'+(i%500),action:'交換',cause:'',closed:i%3?addD(TODAY,-(i%900)+3):'',photos:[],log:[],cost:i%5?'':'12000'}));
  S.meas=[...Array(5000)].map((_,i)=>({id:'ms'+i,at:'',date:addD(TODAY,-(i%1095)),type:'絶縁抵抗',tplId:i<360?'mt_gen':'',name:'測定'+i,equipId:'eq'+(i<360?i%10:i%500),by:'○○',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:i%50?100:5}]}));
  S.works=[...Array(1000)].map((_,i)=>({id:'wk'+i,no:'W-'+i,date:addD(TODAY,-(i%300)),endDate:'',title:'作業'+i,kind:'点検',status:i%2?'完了':'予定',equipId:'',place:'',staff:[],needQuals:[],steps:[],approvals:[],hist:[],issueId:'',note:'',cost:i%4?'':'50000'}));
  for(let i=0;i<365;i++)S.daily[addD(TODAY,-i)]={note:'日常メモ'+i};
  const v=validateData(clone(S));if(v.ok){const m=migrate(v.data,true);for(const x of ['tasks','items','issues','equipment','meas','works','locs','daily'])S[x]=m[x]}
  DL_CACHE=null},fs);
 const tm={};
 tm.month=await p.evaluate(()=>{applyFScale();V.rmode='m';V.ry=now.getFullYear();V.rm=now.getMonth()+1;const s=performance.now();go('report');return performance.now()-s});
 let sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'月報が横にはみ出す '+sw);
 const has=await p.evaluate(()=>/異常/.test(document.querySelector('#app').innerText)&&document.querySelector('#app').innerText.length>500);if(!has)bad.push(tag+'月報の中身が出ない');
 const turns=[];for(let k=0;k<3;k++)turns.push(await p.evaluate(()=>{const s=performance.now();shiftYM('ry','rm',-1);return performance.now()-s}));tm.monthTurn=Math.max(...turns);
 tm.year=await p.evaluate(()=>{V.rmode='y';const s=performance.now();render();return performance.now()-s});
 sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+'年報が横にはみ出す '+sw);
 tm.yearTurn=await p.evaluate(()=>{const btn=[...document.querySelectorAll('#app button')].find(x=>/‹|前/.test(x.textContent)&&/onclick/.test(x.outerHTML));const s=performance.now();if(btn)btn.click();else{V.ry--;render()}return performance.now()-s});
 for(const k in tm){if(tm[k]>LIM)bad.push(tag+k+' '+Math.round(tm[k])+'ms');tm[k]=Math.round(tm[k])}
 if(fs==='m'){await p.evaluate(()=>{V.rmode='m';V.ry=now.getFullYear();V.rm=now.getMonth()+1;render()});const s=Date.now();const buf=await p.pdf({format:'A4'}).catch(e=>{bad.push(tag+'月報の印刷が作れない '+e.message);return null});tm.pdf=Date.now()-s;if(buf&&buf.length<5000)bad.push(tag+'月報の印刷が空');if(tm.pdf>15000)bad.push(tag+'月報の印刷に '+tm.pdf+'ms')}
 console.log(tag+JSON.stringify(tm));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
