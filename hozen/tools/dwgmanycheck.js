// 図面：100 枚・1 枚に版 10 のとき、一覧が 1 秒以内に出て 100 枚とも並び、探す欄で絞れ、図面を開くと版の選び方に 10 版が新しい順で並び、いちばん古い版も選べて「古い版」の知らせが出るか。
// 390px・文字「標準」「特大」ではみ出さない。見ただけで記録は変えない（hz-v-dwg-many）。
// usage: node hozen/tools/dwgmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();
  S.drawings=Array.from({length:100},(_,i)=>({id:'dm'+i,name:(i%2?'単線結線図':'配置図')+'の長い名前の図面（受変電設備 第'+i+'系統）',kind:i%2?'単線結線図':'配置図',locId:'',note:'',
   vers:Array.from({length:10},(_,k)=>({id:'dm'+i+'v'+k,ver:'第'+(k+1)+'版',date:addD(TODAY,-(10-k)*100),type:'application/pdf',file:'',note:'変更'+k})),pins:[]}));V.dwgQ='';save()},fs);
 const before=await p.evaluate(()=>JSON.stringify(S.drawings));
 const ms=await p.evaluate(()=>{const t=performance.now();go('dwgs');return performance.now()-t});await p.waitForTimeout(250);if(ms>1000)bad.push(tag+'一覧が出るまで '+Math.round(ms)+'ms');
 let r=await p.evaluate(()=>({n:[...document.querySelectorAll('#app .item')].filter(x=>/の長い名前の図面/.test(x.textContent)).length,last:/第99系統/.test(document.querySelector('#app').textContent),ver:/第10版/.test(document.querySelector('#app .item').textContent),sw:document.documentElement.scrollWidth}));
 if(r.n!==100)bad.push(tag+'100枚並ばない '+r.n);if(!r.last)bad.push(tag+'最後の図面が無い');if(!r.ver)bad.push(tag+'一覧に最新の版が出ない');if(r.sw>392)bad.push(tag+'一覧がはみ出す '+r.sw);
 await p.evaluate(()=>{V.dwgQ='第42系統';render()});await p.waitForTimeout(150);
 r=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].map(x=>x.textContent));if(r.length!==1||!/第42系統/.test(r[0]))bad.push(tag+'探す欄で絞れない '+r.length);
 await p.evaluate(()=>{V.dwgQ='';go('dwg',{dwg:'dm7',dwgZ:1,dwgVer:''})});await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const s=document.querySelector('#app .dwgver select');return s?{o:[...s.options].map(x=>x.textContent),old:/古い版/.test(document.querySelector('#app').textContent)}:null});
 if(!r)bad.push(tag+'版の選び方が無い');else{if(r.o.length!==10)bad.push(tag+'版の数 '+r.o.length);if(!/第10版.*最新/.test(r.o[0]))bad.push(tag+'先頭が最新でない '+r.o[0]);if(!/^版 第1版/.test(r.o[9]))bad.push(tag+'最後が最古でない '+r.o[9]);if(r.old)bad.push(tag+'最新なのに古い版の知らせ')}
 await p.evaluate(()=>{const s=document.querySelector('#app .dwgver select');s.selectedIndex=9;s.dispatchEvent(new Event('change'))});await p.waitForTimeout(200);
 r=await p.evaluate(()=>({v:V.dwgVer,old:/古い版を表示しています/.test(document.querySelector('#app').textContent),note:/変更0/.test(document.querySelector('#app').textContent),sw:document.documentElement.scrollWidth}));
 if(r.v!=='dm7v0')bad.push(tag+'最古の版を選べない '+r.v);if(!r.old)bad.push(tag+'古い版の知らせが出ない');if(!r.note)bad.push(tag+'古い版の変更内容が出ない');if(r.sw>392)bad.push(tag+'図面がはみ出す '+r.sw);
 const after=await p.evaluate(()=>JSON.stringify(S.drawings));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
