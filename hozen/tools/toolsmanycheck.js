// 工具・測定器：500 点（長い名前・校正期限の切れ／30 日内／先・貸出中を含む）・貸し出しの記録 3000 件で、工具のタブが 1 秒以内に出て、
// 全部並び、校正期限の近い順（切れた物が上）で、探す欄で名前・型式・番号から絞れ、390px・文字「標準」「特大」ではみ出さないか。
// 見ただけで記録は変えない（hz-v-tools-many）。usage: node hozen/tools/toolsmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
const N=500,LIM=1000;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(([f,N])=>{S.settings.fscale=f;
  S.tools=[...Array(N)].map((_,i)=>({id:'tm'+i,code:'T-'+String(i).padStart(4,'0'),name:'試しの測定器'+i+' 絶縁抵抗計 高電圧用 長い名前の例',kind:i%2?'測定器':'工具',maker:'○○計器株式会社',model:'MODEL-'+i+'X',serial:'SN'+i,place:'○○棟 電気室 工具棚',calDue:i%2?addD(TODAY,(i%200)-40):'',calCycleM:'12',calHist:[],
   loans:[...Array(6)].map((_,k)=>({id:'l'+i+'_'+k,out:addD(TODAY,-k*20-5),to:'○○電気工事株式会社 第二営業所',due:addD(TODAY,-k*20),back:k===0&&i%10===0?'':addD(TODAY,-k*20),note:''})),note:''}));save()},[fs,N]);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.tools));
 const rows=()=>p.evaluate(()=>{const R=[...document.querySelectorAll('#app .item')].filter(x=>/試しの測定器\d+/.test(x.textContent));
  return {n:R.length,first:R[0]?R[0].textContent.match(/試しの測定器(\d+)/)[1]:'',over:R.filter(x=>x.getBoundingClientRect().right>391||x.scrollWidth>x.clientWidth+1).length,pills:[...document.querySelectorAll('#app .item .pill')].filter(x=>x.getBoundingClientRect().right>391).length,sw:document.documentElement.scrollWidth}});
 const ms=await p.evaluate(()=>{applyFScale();V.tlQ='';const s=performance.now();go('stock',{stTab:'tools'});return performance.now()-s});await p.waitForTimeout(200);
 if(ms>LIM)bad.push(tag+'工具のタブが出るまで '+Math.round(ms)+'ms');
 let r=await rows();if(r.n!==N)bad.push(tag+'全部並ばない '+r.n+'/'+N);if(r.over)bad.push(tag+'行がはみ出す '+r.over);if(r.pills)bad.push(tag+'印が切れる '+r.pills);if(r.sw>392)bad.push(tag+'横にはみ出す '+r.sw);
 const wf=await p.evaluate(()=>S.tools.slice().sort((a,b)=>(a.calDue||'9').localeCompare(b.calDue||'9'))[0].name.match(/試しの測定器(\d+)/)[1]);if(r.first!==wf)bad.push(tag+'校正期限の近い順でない '+r.first+'/'+wf);
 const q=await p.$('#tlQ');if(!q)bad.push(tag+'探す欄が無い');else{
  for(const [w,n] of [['MODEL-123X',1],['T-0045',1],['試しの測定器123',1],['sn499',1]]){await p.fill('#tlQ',w);await p.waitForTimeout(600);r=await rows();if(r.n!==n)bad.push(tag+'探す欄「'+w+'」で絞れない '+r.n)}
  await p.fill('#tlQ','ありえない名前');await p.waitForTimeout(600);const clr=await p.$('#tlQClr');if(!clr)bad.push(tag+'見つからないときに「条件を外す」が無い');else{await clr.click();await p.waitForTimeout(200);r=await rows();if(r.n!==N)bad.push(tag+'条件を外しても戻らない '+r.n)}}
 const after=await p.evaluate(()=>JSON.stringify(S.tools));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 console.log(tag+'工具のタブ '+Math.round(ms)+'ms');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
