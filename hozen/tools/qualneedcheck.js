// 人員・資格：作業が求める資格が「持つ人がいません／持つ人 ○人」の文字で出て、持つ人がいない資格が上。作業が無ければ出ない。390px・はみ出し無し・保存の形は変えない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 await p.evaluate(()=>{S.works=[];S.quals={};go('staff')});await p.waitForTimeout(300);
 if(await p.evaluate(()=>/作業が求める資格/.test(document.querySelector('#app').innerText)))bad.push('作業が無いのに出る');
 await p.evaluate(()=>{S.quals={'職員1':['電気主任技術者'],'職員2':['電気主任技術者','高所作業']};
  const w=(id,q,st)=>({id,no:id,title:'試験'+id,kind:'点検',status:st,date:TODAY,endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:[],needQuals:q,needN:1,content:'',outage:{on:false},ky:[],stdId:'',photos:[],docs:[],pre:[],post:[],approvals:[],hist:[],handover:'',result:''});
  S.works=[w('w1',['電気主任技術者'],'起案'),w('w2',['特別高圧'],'起案'),w('w3',['特別高圧','電気主任技術者'],'承認'),w('w4',['高所作業'],'完了')];
  const before=JSON.stringify(S.quals);window.__q=before;go('staff')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#app .card:first-of-type .item')].map(e=>e.innerText.replace(/\s+/g,' ')),H=[...document.querySelectorAll('#app .card:first-of-type .item')].map(e=>e.getBoundingClientRect().height);return{rows,H,sw:document.documentElement.scrollWidth,same:JSON.stringify(S.quals)===window.__q}});
 if(r.rows.length!==2)bad.push('行数が違う '+JSON.stringify(r.rows));
 else{if(!/特別高圧.*2件.*持つ人がいません/.test(r.rows[0]))bad.push('先頭は持つ人がいない資格 '+r.rows[0]);if(!/電気主任技術者.*2件.*持つ人 2人/.test(r.rows[1]))bad.push('2行目が違う '+r.rows[1])}
 if(r.H.some(h=>h<44))bad.push('行が低い');if(r.sw>392)bad.push('はみ出す');if(!r.same)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
