// 設定の CSV 5 種：予定 1 万・日常点検 3 年・異常 2000・設備 1000（修理 3000）・修正履歴 3 万件（2.8 万件は端末内の保管）の記録で、
// それぞれ 3 秒以内に作られ、行の数が件数とそろい（修正履歴は保管分を含む）、先頭に BOM（Excel で文字化けしない印）があるか（hz-v-csv-all-big）。
// 保存の形は変えない。ファイルは受け取るだけで書き出さない。usage: node hozen/tools/csvallbigcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
const READY=()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0;
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(READY,null,{timeout:15000});await p.waitForTimeout(300);
 await p.evaluate(()=>{const T=TODAY;
  S.tasks=[...Array(10000)].map((_,i)=>({id:'t'+i,date:addD(T,-(i%1000)),time:'',kind:'定期',cat:S.settings.cats[0],title:'点検'+i,place:'',staff:'',attend:'',status:'完了',result:'',note:'',photos:[]}));
  const cid=S.settings.dchecks[0].id;for(let i=0;i<1095;i++){S.daily[addD(T,-i)]={done:'済',c:{[cid]:'○'}}}
  S.issues=[...Array(2000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%700)),title:'異常'+i,status:'完了',urgency:'中',closed:addD(T,-(i%700)),photos:[],log:[]}));
  S.equipment=[...Array(1000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',status:'稼働',photos:[],docs:[],health:[],repairs:[0,1,2].map(k=>({id:'r'+i+k,date:addD(T,-k),kind:'修理',content:'修理',vendor:'',cost:'',photos:[]}))}));
  S.history=[];for(let i=0;i<30000;i++)S.history.push({at:new Date(Date.now()-(30000-i)*60000).toISOString(),type:'task',ref:'t'+(i%500),field:'状態',from:'予定',to:'完了',by:''});save();trimHistory()});
 await p.waitForFunction(()=>S.history.length<=3000&&(S.histArcKeys||[]).length>0,null,{timeout:30000}).catch(()=>bad.push('修正履歴が保管に移らない'));
 await p.reload();await p.waitForFunction(READY,null,{timeout:20000});await p.waitForTimeout(300);
 if(await p.evaluate(()=>SAVE_FAIL.app))bad.push('試しの記録が保存できていない（大きすぎる）');
 const n=await p.evaluate(async()=>({t:S.tasks.length,d:Object.keys(S.daily).length,i:S.issues.length,e:S.equipment.length,r:S.equipment.reduce((a,e)=>a+(e.repairs||[]).length,0),h:(await allHistory()).length}));
 const cases=[['予定・実績','exportCsv()',n.t],['日常点検','exportAllDaily()',n.d],['異常案件','exportIssuesCsv()',n.i],['修正履歴','exportHistoryCsv()',n.h],['設備台帳・修理履歴','exportEquipCsv()',n.e+n.r]];
 for(const [name,call,want] of cases){
  const r=await p.evaluate(async call=>{let got=null;const keep=window.hzSave;window.hzSave=async(nm,blob)=>{const u=new Uint8Array(await blob.arrayBuffer());got={nm,txt:new TextDecoder('utf-8',{ignoreBOM:true}).decode(u)};return true};
   const s=performance.now();try{await eval(call)}catch(e){return {err:e.message}}let w=0;while(!got&&w++<100)await new Promise(r=>setTimeout(r,50));window.hzSave=keep;
   if(!got)return {err:'ファイルが渡されない'};const lines=got.txt.split('\r\n').filter(Boolean);return {ms:Math.round(performance.now()-s),bom:got.txt.charCodeAt(0)===0xFEFF,rows:lines.length-1,nm:got.nm}},call);
  console.log(name+'：'+(r.err||r.ms+'ms・'+r.rows+' 行（件数 '+want+'）・'+r.nm));
  if(r.err){bad.push(name+'：'+r.err);continue}
  if(r.ms>3000)bad.push(name+'：遅い '+r.ms+'ms');if(!r.bom)bad.push(name+'：先頭に BOM が無い');
  if(name==='日常点検'?r.rows<want:r.rows!==want)bad.push(name+'：行の数が件数と違う '+r.rows+'/'+want);
 }
 console.log(bad.join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
