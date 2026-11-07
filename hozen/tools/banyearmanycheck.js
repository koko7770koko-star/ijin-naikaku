// 盤の点検：盤 3000 面（6 棟×10 階×5 室×10 面）・1 年分（12 か月）の ◯● の記録で、盤の点検の画面・棟の切り替え・月の切り替え（前の月へ）・
// 「この階を全部 ●」（1 階 50 面）・元に戻す がそれぞれ 1 秒以内で、数が正しく、banChk の形が変わらないか（hz-v-ban-year-many）。
// usage: node hozen/tools/banyearmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.banChk={};const ym0=TODAY.slice(0,7);const bs=L.filter(l=>l.type==='盤');
  for(let m=1;m<=12;m++){const d=new Date(+ym0.slice(0,4),+ym0.slice(5,7)-1-m,1);const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');S.banChk[ym]={};bs.forEach((b,i)=>{S.banChk[ym][b.id]=[i%5?'済':'○',i%7?'済':'延','済']})}
  save()});
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 let s=Date.now();await p.evaluate(()=>{V.banB='lb0';V.banYm=TODAY.slice(0,7);go('ban')});await raf();tm.open=Date.now()-s;
 s=Date.now();await p.evaluate(()=>{V.banB='lb3';render()});await raf();tm.bldg=Date.now()-s;
 s=Date.now();await p.evaluate(()=>banMove(-1));await raf();tm.prevMonth=Date.now()-s;
 const ym1=await p.evaluate(()=>V.banYm);
 await p.evaluate(()=>banMove(1));await raf();
 const n0=await p.evaluate(()=>banCount(V.banYm,banBoards('lb3f2')));
 s=Date.now();await p.evaluate(()=>banAll('lb3f2'));await raf();tm.all=Date.now()-s;
 const n1=await p.evaluate(()=>{const ym=V.banYm,bs=banBoards('lb3f2');let d=0;bs.forEach(b=>{for(let k=0;k<3;k++)if(banVal(ym,b.id,k)==='済')d++});return {d,n:bs.length}});
 if(n1.n!==50||n1.d!==150)bad.push('この階を全部 ● の後 '+JSON.stringify(n1));
 s=Date.now();await p.evaluate(()=>document.querySelector('#undobar button').click());await raf();tm.undo=Date.now()-s;
 const n2=await p.evaluate(()=>{const ym=V.banYm,bs=banBoards('lb3f2');let d=0;bs.forEach(b=>{for(let k=0;k<3;k++)if(banVal(ym,b.id,k)==='済')d++});return d});if(n2!==0)bad.push('元に戻した後の ● '+n2);
 const past=await p.evaluate(ym=>Object.keys(S.banChk[ym]||{}).length,ym1);if(past!==3000)bad.push('前の月の記録 '+past);
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 await p.waitForTimeout(400);const sv=await p.evaluate(()=>{const o=JSON.parse(localStorage.getItem('hospElecSched_v1'));return Object.keys(o.banChk).length});if(sv<12)bad.push('保存の月 '+sv);
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
