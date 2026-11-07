// 設備台帳：500 台（長い名前・棟 6・点検項目 60・異常 100）で、一覧が 1 秒以内に出て、最後の 1 台まで並び、探す欄・種類・棟の絞り込みが効き、390px・文字「標準」「特大」ではみ出さないか。
// 見ただけで記録は変えない（hz-v-eq-list-many）。usage: node hozen/tools/eqlistmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const K=['変圧器','遮断器','分電盤','発電機','蓄電池'];
  S.locs=[...Array(6)].map((_,i)=>({id:'bl'+i,name:'ABCDEF'[i]+'棟',type:'建屋',parent:'',note:'',pos:{}}));
  S.equipment=[...Array(500)].map((_,i)=>({id:'eqm'+i,code:'EQ-'+String(i).padStart(4,'0'),name:'試しの設備'+i+'（高圧受変電設備 第'+i+'系統の長い名前）',kind:K[i%5],locId:'bl'+(i%6),status:'稼働',importance:'',repairs:[]}));
  S.items=[...Array(60)].map((_,i)=>({id:'itm'+i,name:'点検'+i,cat:'受変電',cycle:'年1回',base:addD(TODAY,-300),who:'委託',track:true,legal:'',equipId:'eqm'+i}));
  S.issues=[...Array(100)].map((_,i)=>({id:'ism'+i,date:addD(TODAY,-i),title:'異常'+i,place:'',status:i%2?'完了':'対応中',equipId:'eqm'+i,action:'',closed:i%2?TODAY:'',detail:''}));save()},fs);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.equipment));
 const cnt=()=>p.evaluate(()=>({n:[...document.querySelectorAll('#app .item')].filter(x=>/試しの設備\d+/.test(x.textContent)).length,last:/試しの設備499（/.test(document.querySelector('#app').textContent),sw:document.documentElement.scrollWidth}));
 for(const sort of ['code','name','',]){
  const ms=await p.evaluate(s=>{applyFScale();V.eqQ='';V.eqKind='';V.eqImp='';V.eqLoc='';V.eqAll=false;V.eqSort=s||undefined;const t=performance.now();go('equip');return performance.now()-t},sort);await p.waitForTimeout(200);
  if(ms>1000)bad.push(tag+'並び '+(sort||'初め')+'：出るまで '+Math.round(ms)+'ms');
  const r=await cnt();if(r.n!==500)bad.push(tag+'並び '+(sort||'初め')+'：500台並ばない '+r.n);if(!r.last)bad.push(tag+'最後の1台が無い');if(r.sw>392)bad.push(tag+'はみ出す '+r.sw)}
 await p.evaluate(()=>{V.eqQ='第123系統';render()});await p.waitForTimeout(150);let r=await cnt();if(r.n!==1)bad.push(tag+'探す欄で絞れない '+r.n);
 await p.evaluate(()=>{V.eqQ='';V.eqKind='発電機';render()});await p.waitForTimeout(150);r=await cnt();if(r.n!==100)bad.push(tag+'種類で絞れない '+r.n);
 await p.evaluate(()=>{V.eqKind='';V.eqLoc='bl2';render()});await p.waitForTimeout(150);r=await cnt();if(r.n!==Math.ceil((500-2)/6))bad.push(tag+'棟で絞れない '+r.n);
 const after=await p.evaluate(()=>JSON.stringify(S.equipment));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
