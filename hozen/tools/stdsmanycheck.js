// 作業標準：100 件（長い名前・前後のチェック 40 項目）で、一覧が 1 秒以内・全部並び・探す欄で絞れ、開いた窓が 390px・文字「標準」「特大」ではみ出さないか。記録は変えない（hz-v-stds-many）。
// usage: node hozen/tools/stdsmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;const ck=n=>[...Array(40)].map((_,k)=>({text:'確認項目'+k+'：高圧の検電器で三相とも無電圧を確かめ、接地を取り付けてから作業する（'+n+'）',req:k%2===0}));
  S.stds=[...Array(100)].map((_,i)=>({id:'sd'+i,name:'作業標準の試し'+i+'（高圧受変電設備 停電作業・検電・接地・復電確認 第'+i+'版の長い名前）',docNo:'DOC-'+String(i).padStart(4,'0')+'-ABCDEFGHIJKLMNOP',ver:'3',kinds:['停電作業'],pre:ck('前'),post:ck('後'),note:'',approvedBy:i%3?'責任者':'',approvedDate:i%3?'2026-04-01':'',hist:[]}));save()},fs);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify(S.stds));
 const ms=await p.evaluate(()=>{applyFScale();V.stdQ='';const t=performance.now();go('stds');return performance.now()-t});await p.waitForTimeout(200);if(ms>1000)bad.push(tag+'一覧が出るまで '+Math.round(ms)+'ms');
 let r=await p.evaluate(()=>({n:[...document.querySelectorAll('#app .item')].filter(x=>/作業標準の試し\d+/.test(x.textContent)).length,sw:document.documentElement.scrollWidth}));if(r.n!==100)bad.push(tag+'100件並ばない '+r.n);if(r.sw>392)bad.push(tag+'一覧がはみ出す '+r.sw);
 await p.evaluate(()=>{V.stdQ='DOC-0042';render()});await p.waitForTimeout(150);r=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>/作業標準の試し\d+/.test(x.textContent)).map(x=>x.textContent));if(r.length!==1||!/試し42（/.test(r[0]))bad.push(tag+'探す欄で絞れない '+r.length);
 await p.evaluate(()=>{V.stdQ='';render();editStd('sd7')});await p.waitForTimeout(400);
 r=await p.evaluate(()=>{const m=document.querySelector('#modal');const over=[...m.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.right>392}).length;return {open:document.querySelector('#mask').classList.contains('on'),over,sw:document.documentElement.scrollWidth}});
 if(!r.open)bad.push(tag+'窓が開かない');if(r.over)bad.push(tag+'窓の中ではみ出す '+r.over);if(r.sw>392)bad.push(tag+'窓ではみ出す '+r.sw);
 await p.evaluate(()=>closeModal(true));
 const after=await p.evaluate(()=>JSON.stringify(S.stds));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
