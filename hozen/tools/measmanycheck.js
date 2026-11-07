// 測定記録：記録 5000 件（3 年分・設備 300 台・発電機 10 台の月次点検を含む）で、診断の4つのタブ（健全度・推奨・故障分析・測定記録）が
// それぞれ 1 秒以内に出て、測定記録の件数・種類と設備の絞り込みが正しく、「さらに100件」で増え、記録の窓（前回値つき）が 1 秒以内に開き、
// 数字を入れて保存するのも 1 秒以内、390px・文字「標準」「特大」ではみ出さないか（hz-v-meas-many）。usage: node hozen/tools/measmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=5000,LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(([f,N])=>{S.settings.fscale=f;
  S.locs=[...Array(6)].map((_,i)=>({id:'bl'+i,name:'ABCDEF'[i]+'棟',type:'建屋',parent:'',note:'',pos:{}}));
  S.equipment=[...Array(300)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+String(i).padStart(4,'0'),name:'試しの設備'+i+'（高圧受変電設備 第'+i+'系統）',kind:i<10?'発電機':'変圧器',locId:'bl'+(i%6),status:'稼働',importance:i%5?'':'A',repairs:[]}));
  const T=MEAS_TYPES.filter(t=>t!=='電圧・電流・電力');const M=[];
  for(let i=0;i<10;i++)for(let k=0;k<36;k++)M.push({id:'mg'+i+'_'+k,at:'',date:addD(TODAY,-k*30-1),type:'電圧・電流・電力',tplId:'mt_gen',name:GEN_TPL.name,equipId:'eqm'+i,by:'',note:'',rows:GEN_TPL.rows.map((r,j)=>({...r,v:200+j}))});
  for(let i=M.length;i<N;i++)M.push({id:'mm'+i,at:'',date:addD(TODAY,-(i%1095)),type:T[i%T.length],tplId:'',name:'試しの測定'+i,equipId:'eqm'+(10+i%290),by:'',note:'',rows:[{name:'R相',unit:'MΩ',min:10,max:'',v:i%50===0?5:100+i%40},{name:'S相',unit:'MΩ',min:10,max:'',v:120},{name:'T相',unit:'MΩ',min:10,max:'',v:130}]});
  S.meas=M;save()},[fs,N]);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.meas.slice(0,50)));
 const tms={};
 for(const t of ['health','rec','fail','meas']){const ms=await p.evaluate(t=>{applyFScale();V.msType='';V.measEq='';V.msMore=0;const s=performance.now();go('diag',{dgTab:t});return performance.now()-s},t);await p.waitForTimeout(150);
  tms[t]=Math.round(ms);if(ms>LIM)bad.push(tag+'診断「'+t+'」が出るまで '+Math.round(ms)+'ms');
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push(tag+t+' ではみ出す '+sw)}
 const cnt=()=>p.evaluate(()=>{const h=[...document.querySelectorAll('#app .card')].map(x=>x.textContent).find(t=>/測定記録/.test(t))||'';const m=h.match(/測定記録\s*(\d+)件/);return {n:m?+m[1]:-1,rows:[...document.querySelectorAll('#app .item')].filter(x=>/試しの測定\d+|非常用発電機 月次/.test(x.textContent)&&x.getAttribute('onclick')&&/editMeas/.test(x.getAttribute('onclick'))).length}});
 let r=await cnt();if(r.n!==N)bad.push(tag+'測定記録の件数が違う '+r.n+'/'+N);if(r.rows!==100)bad.push(tag+'最初の100件が並ばない '+r.rows);
 let ms=await p.evaluate(()=>{V.msType='接地抵抗';const s=performance.now();render();return performance.now()-s});const wT=await p.evaluate(()=>S.meas.filter(m=>m.type==='接地抵抗').length);r=await cnt();
 if(ms>LIM)bad.push(tag+'種類で絞る '+Math.round(ms)+'ms');if(r.n!==wT)bad.push(tag+'種類で絞れない '+r.n+'/'+wT);
 ms=await p.evaluate(()=>{V.msType='';V.measEq='eqm3';const s=performance.now();render();return performance.now()-s});r=await cnt();
 if(ms>LIM)bad.push(tag+'設備で絞る '+Math.round(ms)+'ms');if(r.n!==36)bad.push(tag+'設備で絞れない '+r.n+'/36');
 await p.evaluate(()=>{V.measEq='';render()});const mb=await p.$('#app button:has-text("さらに100件")');if(!mb)bad.push(tag+'「さらに100件」が無い');else{await mb.click();await p.waitForTimeout(200);r=await cnt();if(r.rows!==200)bad.push(tag+'さらに表示で増えない '+r.rows)}
 // 発電機の窓（前回値つき）を開いて数字を入れて保存
 ms=await p.evaluate(()=>{const s=performance.now();genStart('eqm2');return performance.now()-s});await p.waitForTimeout(300);
 if(ms>LIM)bad.push(tag+'発電機の記録の窓が開くまで '+Math.round(ms)+'ms');
 const open=await p.evaluate(()=>document.querySelector('#mask').classList.contains('on'));if(!open)bad.push(tag+'記録の窓が開かない');
 else{await p.waitForSelector('#ms_rows input[data-mv]');const ins=p.locator('#ms_rows input[data-mv]');const k=await ins.count();for(let i=0;i<k;i++)await ins.nth(i).fill(String(100+i));await p.fill('#ms_by','確認者');
  const filled=await p.evaluate(()=>{const mw=document.querySelector('#modal');return {ov:mw?mw.scrollWidth>mw.clientWidth+1:false}});filled.n=k;
  if(!filled.n)bad.push(tag+'数字の欄が無い');if(filled.ov)bad.push(tag+'記録の窓が横にはみ出す');
  const n0=await p.evaluate(()=>S.meas.length);
  const sbtn=await p.$('#modal button:text-is("保存")');if(!sbtn)bad.push(tag+'保存ボタンが無い');else{const s0=Date.now();await sbtn.click();await p.waitForFunction(n=>S.meas.length>n,n0,{timeout:5000}).catch(()=>bad.push(tag+'保存されない'));const sm=Date.now()-s0;if(sm>LIM+300)bad.push(tag+'保存に '+sm+'ms');}
  await p.waitForTimeout(300);await p.evaluate(()=>{if(document.querySelector('#mask').classList.contains('on'))closeModal(true)})}
 await p.reload();await p.waitForFunction(READY,null,{timeout:15000});const kept=await p.evaluate(n=>S.meas.length,N);if(kept!==N+1)bad.push(tag+'読み直すと保存した記録が無い '+kept);
 const after=await p.evaluate(()=>JSON.stringify(S.meas.filter(m=>/^m[mg]/.test(m.id)).slice(0,50)));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 console.log(tag+'診断 '+JSON.stringify(tms));
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
