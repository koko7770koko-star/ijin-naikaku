// CSV の BOM の確認：書き出す CSV（異常・修正履歴・設備台帳・予備品・測定・予定実績・点検履歴・故障）の先頭が UTF-8 の BOM（EF BB BF）で、Excel で開いても日本語が化けない／
// BOM つきのファイルを実際に選んで読み戻しても件数が同じ（設備台帳・予備品）／BOM なしでも読める。保存の形は変えない。
// usage: node hozen/tools/csvbomcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.equipment=[{id:'e1',code:'E-1',name:'分電盤',kind:'配電盤・分電盤',status:'稼働',photos:[],docs:[],repairs:[{id:'r',date:TODAY,kind:'修理',content:'端子増し締め',vendor:'',cost:'',photos:[]}],health:[]}];
  S.parts=[{id:'p1',code:'F-1',name:'ヒューズ',spec:'',maker:'',place:'棚1',unit:'本',qty:3,min:1,price:'',equipIds:[],note:''}];S.moves=[];
  S.issues=[{id:'i1',date:TODAY,title:'球切れ',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]}];
  S.tasks=[{id:'t1',date:TODAY,time:'',kind:'点検',cat:'',title:'点検',place:'',staff:'',attend:'',status:'予定',result:'',note:''}];
  S.daily[TODAY]={[numDefs()[0].id]:6.6,done:new Date().toISOString()};save()});
 let checked=0;
 const fns=['exportIssuesCsv','exportHistoryCsv','exportEquipCsv','exportStockCsv','exportMeasCsv','exportCsv','exportDailyCsv','exportFailCsv'];
 for(const fn of fns){
  const r=await p.evaluate(async fn=>{if(typeof window[fn]!=='function'&&typeof eval('typeof '+fn)!=='string')return {skip:true};
   let got=null;const orig=download;download=async(n,blob)=>{const a=new Uint8Array(await blob.arrayBuffer());got={name:n,head:[...a.slice(0,3)]};return true};
   try{await Promise.resolve(eval(fn+'()'));await new Promise(r=>setTimeout(r,200))}catch(e){got={err:String(e)}}finally{download=orig}
   return got||{none:true}},fn);
  if(r.skip)continue;
  if(r.none){continue} // 書き出す内容が無いとき（ファイルを作らない）
  checked++;if(r.err)bad.push(fn+' でエラー '+r.err);else if(r.head.join()!=='239,187,191')bad.push(fn+'（'+r.name+'）の先頭が BOM でない '+r.head.join());
 }
 if(checked<5)bad.push('確かめられた書き出しが少ない '+checked);
 // BOM つき・なしのファイルを実際に選んで読み戻す
 const csvE=await p.evaluate(async()=>{let t='';const orig=download;download=async(n,b)=>{t=await b.text();return true};exportEquipCsv();await new Promise(r=>setTimeout(r,150));download=orig;return t});
 const csvS=await p.evaluate(async()=>{let t='';const orig=download;download=async(n,b)=>{t=await b.text();return true};exportStockCsv();await new Promise(r=>setTimeout(r,150));download=orig;return t});
 for(const [label,buf] of [['BOMあり',Buffer.concat([Buffer.from([0xEF,0xBB,0xBF]),Buffer.from(csvE.replace(/^﻿/,''),'utf-8')])],['BOMなし',Buffer.from(csvE.replace(/^﻿/,''),'utf-8')]]){
  await p.evaluate(()=>{V.eqFo=true;go('equip')});await p.waitForTimeout(200);
  await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'e.csv',mimeType:'text/csv',buffer:buf});await p.waitForTimeout(400);
  const t=await p.evaluate(()=>$('#modal').textContent);if(!t.includes('設備 1件')||!t.includes('修理履歴 1件'))bad.push('設備台帳 '+label+' '+t.slice(0,80));await p.evaluate(()=>closeModal(true));
 }
 for(const [label,buf] of [['BOMあり',Buffer.concat([Buffer.from([0xEF,0xBB,0xBF]),Buffer.from(csvS.replace(/^﻿/,''),'utf-8')])],['BOMなし',Buffer.from(csvS.replace(/^﻿/,''),'utf-8')]]){
  await p.evaluate(()=>{V.stTab='parts';go('stock')});await p.waitForTimeout(200);
  await p.setInputFiles('#app input[type=file][accept*=csv]',{name:'s.csv',mimeType:'text/csv',buffer:buf});await p.waitForTimeout(400);
  const t=await p.evaluate(()=>$('#modal').textContent);if(!t.includes('予備品 1品目'))bad.push('予備品 '+label+' '+t.slice(0,80));await p.evaluate(()=>closeModal(true));
 }
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
