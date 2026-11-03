// 作業管理の件数の箱の確認：390px で4つが1行・高さが小さく（80px以下）押せる（44px以上）・押すとその状態で絞り込まれ選択中の印が付く・はみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{const mk=(i,st)=>({id:'w'+i,no:'W-00'+i,title:'作業'+i,kind:'点検',status:st,date:TODAY,endDate:'',start:'09:00',end:'17:00',equipIds:[],staff:['職員甲'],vendor:'',outage:{on:false,range:''},cost:'',approvals:[],pre:[],post:[],ky:[],hist:[],photos:[],docs:[],needQuals:[],ky:[],hist:[],photos:[],docs:[]});
  S.works=[mk(1,'承認待ち'),mk(2,'実施中'),mk(3,'実施中')];go('works')});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const t=[...document.querySelectorAll('.tiles.wkt .tile')].map(x=>x.getBoundingClientRect());return {n:t.length,tops:[...new Set(t.map(x=>Math.round(x.top)))].length,h:Math.max(...t.map(x=>x.height)),hmin:Math.min(...t.map(x=>x.height)),sw:document.documentElement.scrollWidth}});
 if(r.n!==4)bad.push('箱が4つでない '+r.n);if(r.tops!==1)bad.push('4つが1行でない');if(r.h>80)bad.push('箱が大きい '+r.h);if(r.hmin<44)bad.push('箱が小さい '+r.hmin);if(r.sw>392)bad.push('横にはみ出す '+r.sw);
 await p.click('.tiles.wkt .tile:nth-child(3)');await p.waitForTimeout(300);
 const q=await p.evaluate(()=>({f:V.wkF,on:document.querySelectorAll('.tiles.wkt .tile.on').length,items:document.getElementById('app').innerText.includes('作業2')&&document.getElementById('app').innerText.includes('作業3')&&!document.getElementById('app').innerText.includes('作業1')}));
 if(q.f!=='実施中'||q.on!==1||!q.items)bad.push('絞り込みが効かない '+JSON.stringify(q));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
