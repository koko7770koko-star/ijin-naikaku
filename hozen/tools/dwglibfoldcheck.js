// 図面（dwgs）と技術資料（lib）の検索で、全角/半角・カタカナ/ひらがなの違いを無視する。半角カナ（濁点つき）の強調の位置がずれない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.drawings=[{id:'d1',name:'トランス配置図',kind:'配置図',locId:'',vers:[],pins:[]},{id:'d2',name:'ＶＣＢ単線結線図',kind:'単線結線図',locId:'',vers:[],pins:[]}];V.dwgQ='';go('dwgs')});await p.waitForTimeout(300);
 const cnt=()=>p.evaluate(()=>document.querySelectorAll('#app .item').length);
 for(const [q,n] of [['ﾄﾗﾝｽ',1],['とらんす',1],['vcb',1],['ＶＣＢ',1],['ありえない',0]]){await p.evaluate(q=>{V.dwgQ=q;render()},q);await p.waitForTimeout(150);const k=await cnt();if(k!==n)bad.push('図面 「'+q+'」で '+k+' 件（期待 '+n+'）')}
 await p.evaluate(()=>{S.library=[{id:'l1',title:'取扱説明',tags:'',text:'点検の前に ﾄﾞﾗｲﾔｰ と ﾄﾗﾝｽ を確認。VCB の開閉回数。',file:'',type:'',equipIds:[]}]});
 const r=await p.evaluate(()=>({a:libSearch('どらいやー'),b:libSearch('トランス'),c:libSearch('ｖｃｂ'),d:libSearch('ありえない')}));
 const m=x=>x.length?x[0].mid:null;
 if(m(r.a)!=='ﾄﾞﾗｲﾔｰ')bad.push('濁点つき半角の強調がずれる '+JSON.stringify(m(r.a)));
 if(m(r.b)!=='ﾄﾗﾝｽ')bad.push('「トランス」で半角が当たらない '+JSON.stringify(m(r.b)));
 if(m(r.c)!=='VCB')bad.push('全角小文字で当たらない '+JSON.stringify(m(r.c)));
 if(r.d.length)bad.push('当たらない言葉が当たる');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
