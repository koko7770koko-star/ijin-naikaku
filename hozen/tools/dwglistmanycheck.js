// 図面の一覧：図面 300 枚（版 5 つずつ・設備の印 100 個ずつ、設備 2000 台・場所 3400）で、一覧・探す（名前・全角半角）・図面を開く・版の切り替えが
// それぞれ 1 秒以内、件数が合い、390px・特大ではみ出さないか（hz-v-dwg-list-many）。見ただけで記録は変えない。usage: node hozen/tools/dwglistmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const fs of ['m','xl']){const tag=(fs==='xl'?'特大':'標準')+'・';
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push(tag+'PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(f=>{S.settings.fscale=f;applyFScale();const L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:L[(i*7)%L.length].id,status:'稼働',photos:[],repairs:[],docs:[]}));
  S.drawings=Array.from({length:300},(_,i)=>({id:'dl'+i,name:(i%2?'単線結線図':'配置図')+'No'+(i+1),kind:i%2?'単線結線図':'配置図',locId:L[(i*13)%L.length].id,note:'',
   vers:Array.from({length:5},(_,k)=>({id:'dl'+i+'v'+k,ver:'第'+(k+1)+'版',date:addD(TODAY,-(5-k)*100),type:'application/pdf',file:'',note:'変更'+k})),
   pins:Array.from({length:100},(_,k)=>({id:'pn'+i+'_'+k,x:(k%10)/10,y:Math.floor(k/10)/10,equipId:'e'+((i*7+k)%2000),label:''}))}));V.dwgQ='';save()},fs);
 const before=await p.evaluate(()=>JSON.stringify(S.drawings).length);
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 let s=Date.now();await p.evaluate(()=>go('dwgs'));await raf();tm.list=Date.now()-s;
 const n=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>/No\d+/.test(x.textContent)).length);if(n!==300)bad.push(tag+'一覧の枚数 '+n);
 s=Date.now();await p.evaluate(()=>{V.dwgQ='ｎｏ123';render()});await raf();tm.search=Date.now()-s;
 const hit=await p.evaluate(()=>[...document.querySelectorAll('#app .item')].filter(x=>/No\d+/.test(x.textContent)).map(x=>(x.textContent.match(/No\d+/)||[])[0]));if(!hit.includes('No123')||hit.length>2)bad.push(tag+'探す '+hit.join(','));
 s=Date.now();await p.evaluate(()=>{V.dwgQ='';go('dwg',{dwg:'dl122'})});await raf();tm.open=Date.now()-s;
 const sel=await p.$('#app select');if(sel){const opts=await p.evaluate(()=>[...document.querySelector('#app select').options].map(o=>o.value));const last=opts[opts.length-1];
  s=Date.now();await p.evaluate(v=>{const e=document.querySelector('#app select');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))},last);await raf();tm.ver=Date.now()-s}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push(tag+'はみ出す');
 for(const k in tm)if(tm[k]>1000)bad.push(tag+k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>JSON.stringify(S.drawings).length)!==before)bad.push(tag+'見ただけで記録が変わった');
 console.log(tag+JSON.stringify(tm));await c.close()}
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
