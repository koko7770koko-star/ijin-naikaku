// 設定の CSV：修正履歴 3 万件（日常点検の項目名つき）・異常案件 5000 件（場所の階層つき）・予定 2 万件で、「CSV：修正履歴（全件）」「CSV：異常案件」「CSV：予定・実績」が
// それぞれ 2 秒以内に書き出され、件数・見出し・BOM が正しく、改行や「"」を含む文字が 1 つの欄に収まる（Excel で開ける形）か（hz-v-hist-csv-many）。
// 書き出しは window.hzSave を差し替えて受け取る。保存の形は変えない。usage: node hozen/tools/csvmanycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];const LIM=2000;
// CSV を欄に分ける（"…" の中の , と改行はそのまま）
const parse=t=>{const R=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=ch}
 else if(ch==='"')q=true;else if(ch===','){row.push(f);f=''}else if(ch==='\r'&&t[i+1]==='\n'){row.push(f);R.push(row);row=[];f='';i++}else f+=ch}row.push(f);R.push(row);return R};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const exp=await p.evaluate(()=>{const T=TODAY,L=[],add=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  for(let bi=0;bi<6;bi++){const bid='lb'+bi;add(bid,'ABCDEF'[bi]+'棟','建屋','');for(let fi=1;fi<=10;fi++){const fid=bid+'f'+fi;add(fid,fi+'F','階',bid);for(let ri=1;ri<=5;ri++){const rid=fid+'r'+ri;add(rid,'第'+ri+'電気室','電気室',fid);for(let pi=1;pi<=10;pi++)add(rid+'p'+pi,'盤'+pi,'盤',rid)}}}
  S.locs=L;S.equipment=[...Array(2000)].map((_,i)=>({id:'e'+i,code:'E'+i,name:'設備'+i,kind:'変圧器',locId:L[(i*7)%L.length].id,status:'稼働',photos:[],repairs:[],docs:[]}));
  const nd=numDefs(),f0=nd.length?nd[0].id:'by';
  S.history=[...Array(30000)].map((_,i)=>({at:new Date(Date.now()-i*60000).toISOString(),type:i%3?'daily':'task',ref:addD(T,-(i%900)),field:i%3?f0:'status',from:'前'+i,to:i===7?'改行\nと"引用"と,カンマ':'後'+i,by:'係'}));
  S.issues=[...Array(5000)].map((_,i)=>({id:'i'+i,date:addD(T,-(i%900)),equipId:'e'+(i%2000),locId:i%2?L[(i*11)%L.length].id:'',title:'異常'+i,place:'',status:'完了',detail:i===3?'1行目\n2行目':'',action:'',closed:'',confirmedBy:'',log:[]}));
  S.tasks=S.tasks.concat([...Array(20000)].map((_,i)=>({id:'t'+i,date:addD(T,(i%700)-350),time:'',kind:'月次',cat:'',title:'点検'+i,place:'',staff:'',attend:'',status:'予定',result:'',note:''})));
  save();return {h:30000,i:5000,t:S.tasks.length,fname:nd.length?nd[0].name:'点検者'}});
 await p.waitForTimeout(500);
 const run=fn=>p.evaluate(async fn=>{window.__out=null;window.hzSave=async(n,bl)=>{window.__out={n,t:await bl.text(),raw:new Uint8Array(await bl.arrayBuffer()).slice(0,3).join(',')};return true};
   const s=performance.now();await window[fn]();for(let k=0;k<400&&!window.__out;k++)await new Promise(r=>setTimeout(r,10));return {...window.__out,ms:performance.now()-s}},fn);
 const tm={};
 for(const [fn,n,head,name] of [['exportHistoryCsv',exp.h,'日時,種類,対象,項目,変更前,変更後,操作者',/^修正履歴_/],['exportIssuesCsv',exp.i,'発見日,内容,設置場所,棟,階,電気室,盤',/^異常案件_/],['exportCsv',exp.t,'日付,開始,区分,分類,作業内容',/^予定実績_/]]){
  const o=await run(fn);if(!o||!o.t){bad.push(fn+' が書き出されない');continue}tm[fn]=Math.round(o.ms);if(o.ms>LIM)bad.push(fn+' '+Math.round(o.ms)+'ms');
  if(!name.test(o.n))bad.push(fn+' のファイル名 '+o.n);if(o.raw!=='239,187,191')bad.push(fn+' に BOM が無い');
  const R=parse(o.t.replace(/^﻿/,''));if(!R[0].join(',').startsWith(head))bad.push(fn+' の見出し '+R[0].join(','));
  if(R.length-1!==n)bad.push(fn+' の行 '+(R.length-1)+'（'+n+' のはず）');const w=R[0].length;const odd=R.filter(r=>r.length!==w).length;if(odd)bad.push(fn+' の欄の数がそろわない行 '+odd);
  if(fn==='exportHistoryCsv'){if(!R.some(r=>r[5]==='改行\nと"引用"と,カンマ'))bad.push('改行と引用符の入った値が 1 つの欄にならない');if(!R.some(r=>r[1]==='日常点検'&&r[3]===exp.fname))bad.push('日常点検の項目名が出ない')}
  if(fn==='exportIssuesCsv'){if(!R.some(r=>r[9]==='1行目\n2行目'))bad.push('異常の詳細の改行');if(!R.some(r=>/^[A-F]棟$/.test(r[3])&&/F$/.test(r[4])))bad.push('異常の棟・階が出ない')}}
 const sv=await p.evaluate(()=>[S.issues.length,S.tasks.length]);if(sv[0]!==exp.i||sv[1]!==exp.t)bad.push('書き出しで記録が変わった '+sv);
 console.log(JSON.stringify(tm));console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
