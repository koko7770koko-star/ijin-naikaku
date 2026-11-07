// 場所の登録：棟 6・階 10・電気室 5・盤 10（約 3400 か所）と設備 500 台で、最初の画面が 1 秒以内に出て棟だけが見え、
// 棟・階・電気室を開くとその下が出て（開くのも 1 秒以内）、全部を開いても 3 秒以内、390px・文字「標準」「特大」ではみ出さないか。名前は「A棟」「1F」の形だけ。記録は変えない（hz-v-locs-deep）。
// usage: node hozen/tools/locsdeepcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const n=await p.evaluate(f=>{S.settings.fscale=f;const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(500)].map((_,i)=>({id:'leq'+i,code:'L'+i,name:'場所の試しの設備'+i,kind:'変圧器',locId:L[(i*7)%L.length].id,status:'稼働',importance:'',repairs:[]}));save();return L.length},fs);
 await p.waitForTimeout(300);await p.reload();await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(150);
 const before=await p.evaluate(()=>JSON.stringify([S.locs,S.equipment]));
 const t0=await p.evaluate(()=>{applyFScale();Object.keys(V).filter(k=>/^lo_/.test(k)).forEach(k=>delete V[k]);V.locSortM=false;const t=performance.now();go('locs');return performance.now()-t});await p.waitForTimeout(200);
 if(t0>1000)bad.push(tag+'最初の画面が出るまで '+Math.round(t0)+'ms');
 const vis=()=>p.evaluate(()=>{const ns=[...document.querySelectorAll('#app .locn')];const ty={};ns.forEach(x=>{const t=(x.querySelector('.pill')||{textContent:''}).textContent;ty[t]=(ty[t]||0)+1});return {ty,sw:document.documentElement.scrollWidth}});
 let r=await vis();if(r.sw>392)bad.push(tag+'最初の画面がはみ出す '+r.sw);if((r.ty['盤']||0)>0)bad.push(tag+'最初から盤まで全部出る '+JSON.stringify(r.ty));
 const t1=await p.evaluate(()=>{const t=performance.now();V['lo_lb2']=true;V['lo_lb2f3']=true;V['lo_lb2f3r4']=true;render();return performance.now()-t});await p.waitForTimeout(150);
 if(t1>1000)bad.push(tag+'開くのに '+Math.round(t1)+'ms');
 r=await p.evaluate(()=>['lb2f3','lb2f3r4','lb2f3r4p10'].map(id=>!!document.querySelector('#app .locn[data-loc="'+id+'"]')));if(r.some(x=>!x))bad.push(tag+'開いた所の下が出ない '+r);
 const t2=await p.evaluate(()=>{S.locs.forEach(l=>{if(l.type!=='盤')V['lo_'+l.id]=true});const t=performance.now();render();return performance.now()-t});await p.waitForTimeout(300);
 if(t2>3000)bad.push(tag+'全部開くのに '+Math.round(t2)+'ms');
 r=await vis();if((r.ty['盤']||0)!==3000)bad.push(tag+'全部開いても盤が 3000 出ない '+JSON.stringify(r.ty));if(r.sw>392)bad.push(tag+'全部開いてはみ出す '+r.sw);
 console.error(tag+'時間（ms）：最初 '+Math.round(t0)+'・開く '+Math.round(t1)+'・全部 '+Math.round(t2)+'（'+n+'か所）');
 const after=await p.evaluate(()=>JSON.stringify([S.locs,S.equipment]));if(after!==before)bad.push(tag+'見ただけで記録が変わった');
 errs.forEach(e=>bad.push(e));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
