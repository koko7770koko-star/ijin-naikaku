// 異常・修理：異常 5000 件・設備 2000 台・場所 3400 で、「棟で絞る」「探す（設備名で）」「未完了／すべて」の切り替えがそれぞれ 1 秒以内で、
// 件数が手で数えた値と同じか（設備の場所がその棟の下、または設置場所の文字に棟の名前）。390px（hz-v-issues-bldg-many）。
// 保存の形は変えない。usage: node hozen/tools/issuesbldgmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const T=TODAY,L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:i%10?L[(i*7)%L.length].id:'',status:'稼働',photos:[],repairs:[],docs:[]}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%900)),equipId:i%9?'e'+(i%2000):'',place:i%9?'':'C棟 3F',title:'異常'+i,status:i%3?'完了':'対応中',urgency:['緊急','高','中','低'][i%4],failure:i%2===0,detail:'',action:'',cause:'',closed:'',log:[]}));save();
  // 手で数える：C棟（lb2）
  const under=id=>{let l=L.find(x=>x.id===id),n=0;while(l&&n++<10){if(l.id==='lb2')return true;l=L.find(x=>x.id===l.parent)}return false};
  const inC=i=>{const e=S.equipment.find(x=>x.id===i.equipId);return !!(e&&e.locId&&under(e.locId))||String(i.place).includes('C棟')};
  return {cAll:S.issues.filter(inC).length,cOpen:S.issues.filter(i=>inC(i)&&i.status!=='完了').length,q:S.issues.filter(i=>i.status!=='完了'&&(i.equipId==='e123')).length}});
 const raf=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const tm={};
 const cnt=()=>p.evaluate(()=>{const h=[...document.querySelectorAll('#app .card h2')].map(x=>x.textContent).find(t=>/異常・故障/.test(t))||'';return +(h.match(/(\d+)件/)||[])[1]});
 let s=Date.now();await p.evaluate(()=>{V.isF='open';V.isB='';V.isQ='';go('issues')});await raf();tm.open=Date.now()-s;
 s=Date.now();await p.evaluate(()=>{V.isB='lb2';render()});await raf();tm.bldg=Date.now()-s;let n=await cnt();if(n!==exp.cOpen)bad.push('C棟の未完了 '+n+'（手で '+exp.cOpen+'）');
 s=Date.now();await p.evaluate(()=>{V.isF='all';render()});await raf();tm.all=Date.now()-s;n=await cnt();if(n!==exp.cAll)bad.push('C棟のすべて '+n+'（手で '+exp.cAll+'）');
 s=Date.now();await p.evaluate(()=>{V.isB='';V.isF='open';V.isQ='設備123';render()});await raf();tm.search=Date.now()-s;n=await cnt();
 const want=await p.evaluate(()=>S.issues.filter(i=>i.status!=='完了'&&/設備123/.test(equipName(i.equipId))).length);if(n!==want)bad.push('探す '+n+'（手で '+want+'）');
 for(const k in tm)if(tm[k]>1000)bad.push(k+' '+tm[k]+'ms');
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
