// 作業管理：「すべて」で完了・中止は畳まれ今やる作業が上／場所が1行に出る／終わった行は薄い／はみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{const mk=(id,st,d,pl)=>({id,title:'作業'+id,status:st,date:d,place:pl,staff:[],vendor:'',vendorStaff:'',needN:0,needQuals:[],outage:{on:false,range:''},cost:'',approvals:[],pre:[],post:[],checks:{pre:[],post:[]},ky:[],equipIds:[]});
  S.works=[mk('w1','完了','2026-01-05','○○電気室'),mk('w2','承認済み','2026-03-01','△△電気室'),mk('w3','中止','2026-02-01','')];V.wkF='all';go('works')});
 await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const d=document.querySelector('#wkFin');const items=[...document.querySelectorAll('#app .item')];return{fin:!!d,n:d?d.querySelectorAll('.item').length:0,open:d?d.open:null,firstTitle:items[0]&&items[0].textContent,sw:document.documentElement.scrollWidth,place:/△△電気室/.test(document.body.textContent)}});
 if(!r.fin)bad.push('完了・中止の畳みが無い');else{if(r.n!==2)bad.push('畳みの中の件数 '+r.n);if(r.open)bad.push('最初から開いている')}
 if(!/作業w2/.test(r.firstTitle||''))bad.push('今やる作業が先頭でない');
 if(!r.place)bad.push('場所が出ない');
 if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
